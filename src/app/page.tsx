'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MathSolution, ChatSession, ArtifactData, InlinePracticeQuestion } from '@/types';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MathView } from '@/components/math/MathView';
import { MathKeyboard } from '@/components/math/MathKeyboard';
import { ImageUploader } from '@/components/ocr/ImageUploader';
import { Sidebar } from '@/components/layout/Sidebar';
import { ArtifactDrawer } from '@/components/workspace/ArtifactDrawer';
import { FloatingCalculator } from '@/components/calculator/FloatingCalculator';
import {
  Send,
  Keyboard,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Mic,
  MicOff,
  Calculator,
  Wrench,
  GraduationCap,
  FileQuestion,
  LineChart,
  Zap,
} from 'lucide-react';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);

  // Attached image state
  const [attachedImage, setAttachedImage] = useState<{
    base64: string;
    mime: string;
    previewUrl: string;
  } | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load chat sessions from localStorage on mount (for sidebar history), starting with a blank chat
  useEffect(() => {
    try {
      const saved = localStorage.getItem('openmath_chat_sessions');
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          // Keep chat blank on load; user can click any session in the sidebar if desired
        }
      }
    } catch (e) {
      console.warn('Failed to load saved chat sessions:', e);
    }
  }, []);

  // Save active session whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;

    setSessions((prev) => {
      const now = Date.now();
      const firstUserMsg = messages.find((m) => m.role === 'user');
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 36)
        : 'Math Problem';

      const currentId = activeSessionId || `session-${now}`;
      const existingIdx = prev.findIndex((s) => s.id === currentId);

      let updated: ChatSession[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          messages,
          title: updated[existingIdx].title || title,
          updatedAt: now,
        };
      } else {
        const newSession: ChatSession = {
          id: currentId,
          title,
          messages,
          createdAt: now,
          updatedAt: now,
        };
        updated = [newSession, ...prev];
        setActiveSessionId(currentId);
      }

      try {
        localStorage.setItem('openmath_chat_sessions', JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });
  }, [messages, activeSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Voice Dictation (Web Speech API)
  const toggleVoiceRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleInsertFormula = (snippet: string) => {
    const el = inputRef.current;
    if (!el) {
      setInput((prev) => prev + snippet);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value;

    const updated = currentVal.substring(0, start) + snippet + currentVal.substring(end);
    setInput(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  };

  const handleBackspace = () => {
    const el = inputRef.current;
    if (!el) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end && start > 0) {
      const updated = el.value.substring(0, start - 1) + el.value.substring(end);
      setInput(updated);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start - 1, start - 1);
      }, 0);
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt ?? input).trim();
    if (!textToSend && !attachedImage) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend || 'Please solve the problem in this image.',
      imageUrl: attachedImage?.previewUrl,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const currentImage = attachedImage;
    setAttachedImage(null);
    setShowUploader(false);
    setLoading(true);

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          imageBase64: currentImage?.base64,
          imageMimeType: currentImage?.mime,
        }),
      });

      const data = await res.json();

      if (data.solution) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.solution.boxedAnswer,
          solution: data.solution,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Failed to solve');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message}.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // In-Chat Practice Question Generator
  const handleCreatePracticeQuestion = (solution: MathSolution) => {
    const practiceQ: InlinePracticeQuestion = {
      id: `pq-${Date.now()}`,
      question: `Solve for x: $${solution.query}$.`,
      options: [
        solution.boxedAnswer,
        'x = 1 \\text{ or } x = -2',
        'x = 3 \\text{ or } x = -1',
        '\\text{No real solutions}',
      ],
      correctOptionIndex: 0,
      explanation: `Substitute root into original equation to verify: $${solution.boxedAnswer}$.`,
    };

    const newMsg: ChatMessage = {
      id: `assistant-pq-${Date.now()}`,
      role: 'assistant',
      content: 'Practice problem:',
      practiceQuestion: practiceQ,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  // Practice Test Generator (Opens Artifact Drawer)
  const handleCreatePracticeTest = (solution: MathSolution) => {
    setActiveArtifact({
      id: `test-${Date.now()}`,
      type: 'practice_test',
      title: `Practice: ${solution.query.slice(0, 30)}`,
      subtitle: `${solution.subject || 'Mathematics'} questions`,
      data: {
        questions: [
          {
            id: 'q1',
            question: `Which of the following is equivalent to the final root of $${solution.query}$?`,
            options: [solution.boxedAnswer, 'x = 0', 'x = \\pm 1', 'x = 4'],
            correctOptionIndex: 0,
            explanation: `The solution is verified by direct substitution: $${solution.boxedAnswer}$.`,
          },
          {
            id: 'q2',
            question: 'What is the governing mathematical principle used to factor or solve this equation?',
            options: [
              'Quadratic formula / factoring by grouping',
              'Integration by parts',
              'Binomial expansion',
              "L'Hôpital's rule",
            ],
            correctOptionIndex: 0,
            explanation: 'The equation is quadratic, solved via algebraic factorization or the quadratic formula.',
          },
          {
            id: 'q3',
            question: 'If the leading coefficient is doubled, what happens to the discriminant $\\Delta$?',
            options: [
              'The discriminant changes according to $b^2 - 4(2a)c$',
              'The discriminant stays constant',
              'The roots become imaginary regardless of c',
              'The vertex moves to the origin',
            ],
            correctOptionIndex: 0,
            explanation: 'In the discriminant $\\Delta = b^2 - 4ac$, doubling $a$ multiplies the second term by 2.',
          },
        ],
      },
    });
  };

  // Video Explainer Generator (Opens Artifact Drawer)
  const handleCreateVideoExplainer = (solution: MathSolution) => {
    setActiveArtifact({
      id: `video-${Date.now()}`,
      type: 'video_explainer',
      title: `Walkthrough: ${solution.query.slice(0, 24)}`,
      subtitle: `${solution.steps.length} derivation steps`,
      data: {
        steps: solution.steps,
      },
    });
  };

  // Session Handlers
  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInput('');
    setAttachedImage(null);
    setActiveArtifact(null);
  };

  const handleSelectSession = (id: string) => {
    const target = sessions.find((s) => s.id === id);
    if (target) {
      setActiveSessionId(id);
      setMessages(target.messages);
      setActiveArtifact(null);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    try {
      localStorage.setItem('openmath_chat_sessions', JSON.stringify(updated));
    } catch {}

    if (activeSessionId === id) {
      handleNewChat();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Chat Workspace */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        {/* Top Info Bar */}
        <div className="py-2.5 px-4 sm:px-8 flex items-center justify-between text-xs text-gray-500 dark:text-dark-muted border-b border-gray-100 dark:border-dark-border/60 bg-white/40 dark:bg-dark-bg/40 backdrop-blur-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-gray-600 dark:text-gray-300">
              Calculation Engine Ready
            </span>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center space-x-1.5 hover:text-red-500 transition-colors"
            title="Start New Chat Session"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Messages Feed or Blank Chat Hero */}
        <div className={`flex-1 overflow-y-auto px-4 sm:px-8 py-4 space-y-4 max-w-4xl mx-auto w-full flex flex-col ${messages.length === 0 ? 'math-grid-pattern' : ''}`}>
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 animate-fade-in my-auto">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 dark:bg-brand-600/90 flex items-center justify-center text-white shadow-sm mb-5 border border-brand-500/20">
                <span className="font-bold text-2xl leading-none">Ω</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                OpenMath
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-muted max-w-md mb-8">
                Enter an equation, select an example, or attach a document.
              </p>

              {/* Quick Suggestion Lemma Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full text-left">
                {[
                  {
                    subject: 'Polynomial Equation',
                    formula: '2x^2 + 5x - 3 = 0',
                    prompt: 'Solve 2x^2 + 5x - 3 = 0',
                  },
                  {
                    subject: 'Trigonometric Limit',
                    formula: '\\lim_{x \\to 0} \\frac{\\sin(4x)}{x}',
                    prompt: 'Evaluate lim_{x->0} sin(4x)/x',
                  },
                  {
                    subject: 'Product Rule Derivative',
                    formula: '\\frac{d}{dx}\\left[x^2 \\ln(x)\\right]',
                    prompt: 'Derivative of x^2 * ln(x)',
                  },
                  {
                    subject: 'Indefinite Integral',
                    formula: '\\int x e^{2x} \\, dx',
                    prompt: 'Evaluate integral of x * e^(2x) dx',
                  },
                ].map((sugg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInput(sugg.prompt);
                      inputRef.current?.focus();
                    }}
                    className="p-3.5 rounded-xl border border-gray-200/90 dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-500 dark:hover:border-brand-500 hover:bg-gray-50/50 dark:hover:bg-dark-surface/60 transition-colors text-left flex flex-col justify-between min-h-[76px]"
                  >
                    <span className="text-[11px] font-medium text-gray-500 dark:text-dark-muted mb-1.5">
                      {sugg.subject}
                    </span>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      <MathView content={`$${sugg.formula}$`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onSelectPrompt={(p) => handleSend(p)}
                onEditMessage={(c) => {
                  setInput(c);
                  inputRef.current?.focus();
                }}
                onRetryResponse={(q) => handleSend(q)}
                onCreatePracticeQuestion={handleCreatePracticeQuestion}
                onCreatePracticeTest={handleCreatePracticeTest}
                onCreateVideoExplainer={handleCreateVideoExplainer}
              />
            ))
          )}

          {loading && (
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-dark-muted py-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <span>Calculating solution...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Uploader Panel */}
        {showUploader && (
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 mb-2">
            <div className="p-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-md animate-fade-in">
              <ImageUploader
                selectedPreviewUrl={attachedImage?.previewUrl}
                onImageSelected={(base64, mime, previewUrl) => {
                  setAttachedImage({ base64, mime, previewUrl });
                }}
                onClearImage={() => setAttachedImage(null)}
                onSelectSamplePrompt={(p) => {
                  setInput(p);
                  setShowUploader(false);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              />
            </div>
          </div>
        )}

        {/* Math Virtual Keyboard */}
        <MathKeyboard
          isOpen={showKeyboard}
          onClose={() => setShowKeyboard(false)}
          onInsert={handleInsertFormula}
          onBackspace={handleBackspace}
          onSubmit={() => handleSend()}
        />

        {/* Input Composer */}
        <div className="py-3 px-4 sm:px-8 bg-white/60 dark:bg-dark-bg/60 backdrop-blur-md max-w-4xl mx-auto w-full relative">
          {/* Floating Scientific Calculator Popover */}
          <FloatingCalculator
            isOpen={showCalculator}
            onClose={() => setShowCalculator(false)}
            onInsertToInput={(val) => {
              setInput((prev) => (prev ? `${prev} ${val}` : val));
              inputRef.current?.focus();
            }}
          />

          <div className="relative rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all p-2">
            {attachedImage && (
              <div className="mb-2 flex items-center space-x-2 px-2 py-1 bg-brand-50/50 dark:bg-brand-950/30 rounded-lg text-xs text-brand-700 dark:text-brand-300">
                <img
                  src={attachedImage.previewUrl}
                  alt="attachment"
                  className="w-7 h-7 object-cover rounded"
                />
                <span className="truncate">Document attached</span>
              </div>
            )}

            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              aria-label="Mathematical expression input"
              placeholder="Enter an equation or expression (e.g., 2x^2 + 5x - 3 = 0, \int x e^x dx)..."
              className="w-full resize-none bg-transparent px-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />

            <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-dark-border/60">
              <div className="flex items-center space-x-1 relative">
                {/* Tool Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowToolSelector(!showToolSelector)}
                    aria-label="Tool Selector"
                    title="Math Tools Menu"
                    className="p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface transition-colors"
                  >
                    <Wrench className="w-4 h-4" />
                    <span className="hidden sm:inline">Tools</span>
                  </button>

                  {showToolSelector && (
                    <div className="absolute bottom-10 left-0 z-50 w-52 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-xl py-1 text-xs animate-fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUploader(true);
                          setShowToolSelector(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-dark-surface"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                        <span>Upload Photo / PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCalculator(true);
                          setShowToolSelector(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-dark-surface"
                      >
                        <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Scientific Calculator</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowKeyboard(true);
                          setShowToolSelector(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-dark-surface"
                      >
                        <Keyboard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Virtual Math Keyboard</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Calculator Button */}
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors ${
                    showCalculator
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface'
                  }`}
                  title="Toggle Calculator"
                  aria-label="Toggle Calculator"
                >
                  <Calculator className="w-4 h-4" />
                </button>

                {/* Math Keyboard Button */}
                <button
                  type="button"
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors ${
                    showKeyboard
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface'
                  }`}
                  title="Toggle Math Keyboard"
                  aria-label="Toggle virtual math keyboard"
                >
                  <Keyboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Math Input</span>
                </button>

                {/* Photo OCR Button */}
                <button
                  type="button"
                  onClick={() => setShowUploader(!showUploader)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors ${
                    showUploader
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface'
                  }`}
                  title="Upload Photo / Homework"
                  aria-label="Upload homework photo for OCR"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface'
                  }`}
                  title="Start Voice Recording"
                  aria-label="Start Voice Recording"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit Solve Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || (!input.trim() && !attachedImage)}
                className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 transition-all shadow-xs"
                title="Solve"
                aria-label="Solve math problem"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Scientific Calculator Popover */}
      <FloatingCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onInsertToInput={(val) => {
          handleInsertMath(val);
          setShowCalculator(false);
        }}
      />

      {/* Right-Hand Artifact Drawer */}
      <ArtifactDrawer
        artifact={activeArtifact}
        onClose={() => setActiveArtifact(null)}
      />
    </div>
  );
}

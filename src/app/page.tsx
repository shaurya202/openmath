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
  GraduationCap,
  FileQuestion,
  LineChart,
  Zap,
} from 'lucide-react';

const EXAMPLES = [
  { subject: 'Algebra', title: 'Polynomial Equation', formula: '2x^2 + 5x - 3 = 0', prompt: 'Solve 2x^2 + 5x - 3 = 0' },
  { subject: 'Calculus', title: 'Trigonometric Limit', formula: '\\lim_{x \\to 0} \\frac{\\sin(4x)}{x}', prompt: 'Evaluate lim_{x->0} sin(4x)/x' },
  { subject: 'Calculus', title: 'Product Rule Derivative', formula: '\\frac{d}{dx}\\left[x^2 \\ln(x)\\right]', prompt: 'Derivative of x^2 * ln(x)' },
  { subject: 'Calculus', title: 'Indefinite Integral', formula: '\\int x e^{2x} \\, dx', prompt: 'Evaluate integral of x * e^(2x) dx' },
];

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: { results: { transcript: string }[][] }) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

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
  const [subject, setSubject] = useState('All');
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
      } catch (e) {
        console.warn('Failed to persist chat sessions:', e);
      }

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

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
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

      recognition.onresult = (event) => {
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
          content: data.solution.content || data.solution.boxedAnswer || data.solution.interpretation || '',
          solution: data.solution,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `assistant-err-${Date.now()}`,
          role: 'assistant',
          content: data.error || 'Failed to solve.',
          topUpUrl: data.topUpUrl,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const topUpMatch = message.match(/https?:\/\/[^\s]+/);
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${message}.`,
        topUpUrl: topUpMatch ? topUpMatch[0] : undefined,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // In-Chat Practice Question Generator
  const handleCreatePracticeQuestion = (solution: MathSolution) => {
    const boxed = solution.boxedAnswer || 'x = 0';
    const practiceQ: InlinePracticeQuestion = {
      id: `pq-${Date.now()}`,
      question: `Solve for x: $${solution.query}$.`,
      options: [
        boxed,
        'x = 1 \\text{ or } x = -2',
        'x = 3 \\text{ or } x = -1',
        '\\text{No real solutions}',
      ],
      correctOptionIndex: 0,
      explanation: `Substitute root into original equation to verify: $${boxed}$.`,
    };

    const newMsg: ChatMessage = {
      id: `assistant-pq-${Date.now()}`,
      role: 'assistant',
      content: "Here's a quick practice question to test your understanding:",
      practiceQuestion: practiceQ,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  // Practice Test Generator (Opens Artifact Drawer)
  const handleCreatePracticeTest = (solution: MathSolution) => {
    const boxed = solution.boxedAnswer || 'x = 0';
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
            options: [boxed, 'x = 0', 'x = \\pm 1', 'x = 4'],
            correctOptionIndex: 0,
            explanation: `The solution is verified by direct substitution: $${boxed}$.`,
          },
          {
            id: 'q2',
            question: 'What is the governing mathematical principle used to factor or solve this equation?',
            options: [
              'Quadratic formula / factoring by grouping',
              'Integration by parts',
              'Binomial expansion',
              "L'HÃ´pital's rule",
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
      subtitle: `${solution.steps?.length || 0} derivation steps`,
      data: {
        steps: solution.steps || [],
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
    } catch (err) {
      console.warn('Failed to persist chat sessions:', err);
    }

    if (activeSessionId === id) {
      handleNewChat();
    }
  };

  const isEmpty = messages.length === 0;
  const visibleExamples = EXAMPLES.filter((ex) => subject === 'All' || ex.subject === subject);

  const toolButton = (active: boolean) =>
    `px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
      active
        ? 'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface'
    }`;

  const composer = (
    <div className="relative w-full">
      {/* Floating Scientific Calculator Popover */}
      <FloatingCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onInsertToInput={(val) => {
          setInput((prev) => (prev ? `${prev} ${val}` : val));
          inputRef.current?.focus();
        }}
      />

      <div className="rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500 transition-all p-3">
        {attachedImage && (
          <div className="mb-2 flex items-center space-x-2 px-2 py-1 bg-brand-50/50 dark:bg-brand-950/30 rounded text-xs text-brand-700 dark:text-brand-300">
            <img src={attachedImage.previewUrl} alt="attachment" className="w-7 h-7 object-cover rounded" />
            <span className="truncate">Worksheet attached</span>
          </div>
        )}

        <textarea
          ref={inputRef}
          rows={isEmpty ? 3 : 2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          aria-label="Mathematical expression input"
          placeholder="Enter an equation or expression, or paste a word problem..."
          className="w-full resize-none bg-transparent px-1 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-dark-muted/70 focus:outline-none"
        />

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setShowUploader(!showUploader)}
              className={toolButton(showUploader)}
              title="Upload a photo or PDF of your homework"
              aria-label="Upload homework photo for OCR"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Photo or PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setShowKeyboard(!showKeyboard)}
              className={toolButton(showKeyboard)}
              title="Math keyboard"
              aria-label="Toggle virtual math keyboard"
            >
              <Keyboard className="w-4 h-4" />
              <span className="hidden sm:inline">Math keyboard</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCalculator(!showCalculator)}
              className={toolButton(showCalculator)}
              title="Calculator"
              aria-label="Toggle Calculator"
            >
              <Calculator className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={
                isRecording
                  ? 'px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center bg-red-600 text-white animate-pulse'
                  : toolButton(false)
              }
              title="Dictate your problem"
              aria-label="Start Voice Recording"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={loading || (!input.trim() && !attachedImage)}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold flex items-center space-x-1.5 disabled:opacity-40 transition-colors"
            title="Solve"
            aria-label="Solve math problem"
          >
            <span>Solve</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const composerPanels = (
    <>
      {showUploader && (
        <div className="w-full mb-2">
          <div className="p-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-md animate-fade-in">
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

      <MathKeyboard
        isOpen={showKeyboard}
        onClose={() => setShowKeyboard(false)}
        onInsert={handleInsertFormula}
        onBackspace={handleBackspace}
        onSubmit={() => handleSend()}
      />
    </>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
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
        {/* Top bar */}
        <div className="py-2 px-4 sm:px-8 flex items-center justify-between text-xs text-gray-500 dark:text-dark-muted border-b border-gray-200/80 dark:border-dark-border bg-white/80 dark:bg-dark-bg/80">
          <span className="font-medium text-gray-700 dark:text-gray-300">Math solver</span>
          <button
            onClick={handleNewChat}
            className="flex items-center space-x-1.5 text-xs hover:text-red-500 transition-colors"
            title="Start a new chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {isEmpty ? (
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 flex flex-col">
            <div className="my-auto w-full max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
                What math problem can I help you solve?
              </h1>
              <p className="mt-2 text-base text-gray-600 dark:text-dark-muted">
                Type an equation, snap a photo of your worksheet, or try an example. I'll walk you through every step.
              </p>

              <div className="mt-6">
                {composerPanels}
                {composer}
              </div>

              <div className="mt-6 flex items-center gap-2">
                {['All', 'Algebra', 'Calculus'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      subject === s
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-muted hover:border-brand-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {visibleExamples.map((ex) => (
                  <button
                    key={ex.title}
                    type="button"
                    onClick={() => {
                      setInput(ex.prompt);
                      inputRef.current?.focus();
                    }}
                    className="p-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-400 transition-colors text-left"
                  >
                    <div className="text-xs font-medium text-gray-600 dark:text-dark-muted mb-1">{ex.title}</div>
                    <div className="text-sm text-gray-900 dark:text-white overflow-x-auto">
                      <MathView content={`$${ex.formula}$`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5 max-w-4xl mx-auto w-full flex flex-col">
              {messages.map((msg) => (
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
              ))}

              {loading && (
                <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-dark-muted py-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <span>Working through the steps...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="py-3 px-4 sm:px-8 bg-white/90 dark:bg-dark-bg/90 border-t border-gray-200/80 dark:border-dark-border max-w-4xl mx-auto w-full">
              {composerPanels}
              {composer}
            </div>
          </>
        )}
      </div>

      {/* Right-Hand Artifact Drawer */}
      <ArtifactDrawer
        artifact={activeArtifact}
        onClose={() => setActiveArtifact(null)}
      />
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MathSolution } from '@/types';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MathKeyboard } from '@/components/math/MathKeyboard';
import { ImageUploader } from '@/components/ocr/ImageUploader';
import {
  Send,
  Keyboard,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { SAMPLE_PROBLEMS } from '@/core/samples/mathCorpus';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome to **OpenMath**! I am your open-source AI math and STEM homework assistant.\n\nType an equation, upload a photo of your worksheet, or open the formula keyboard below to get started.',
      solution: SAMPLE_PROBLEMS[0].solution,
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  // Attached image state
  const [attachedImage, setAttachedImage] = useState<{
    base64: string;
    mime: string;
    previewUrl: string;
  } | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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

    // Restore focus and position cursor after snippet
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
        content: `⚠️ Error solving problem: ${err.message}. Please try again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Chat cleared. What math problem can I help you with next?',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 sm:px-6">
      {/* Top Banner with Zero-Key Notice */}
      <div className="py-2 flex items-center justify-between text-xs text-gray-500 dark:text-dark-muted border-b border-gray-100 dark:border-dark-border/60">
        <div className="flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Universal Solver Active (Zero-Key Offline & Cloud Supported)</span>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center space-x-1 hover:text-red-500 transition-colors"
          title="Clear Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onSelectPrompt={(p) => handleSend(p)}
          />
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-dark-muted py-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <span>Evaluating equation and deriving step-by-step solution...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Uploader Panel */}
      {showUploader && (
        <div className="mb-2 p-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-md animate-fade-in">
          <ImageUploader
            selectedPreviewUrl={attachedImage?.previewUrl}
            onImageSelected={(base64, mime, previewUrl) => {
              setAttachedImage({ base64, mime, previewUrl });
            }}
            onClearImage={() => setAttachedImage(null)}
            onSelectSamplePrompt={(p) => {
              setInput(p);
              setShowUploader(false);
            }}
          />
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

      {/* Input Bar */}
      <div className="py-3 bg-white/50 dark:bg-dark-bg/50 backdrop-blur-xs">
        <div className="relative rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all p-2">
          {attachedImage && (
            <div className="mb-2 flex items-center space-x-2 px-2 py-1 bg-brand-50/50 dark:bg-brand-950/30 rounded-lg text-xs text-brand-700 dark:text-brand-300">
              <img
                src={attachedImage.previewUrl}
                alt="attachment"
                className="w-7 h-7 object-cover rounded"
              />
              <span className="truncate">Image attached for OCR solving</span>
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
            placeholder="Ask any math question or enter an equation (e.g., 2x^2 + 5x - 3 = 0, \int x e^x dx)..."
            className="w-full resize-none bg-transparent px-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />

          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-dark-border/60">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setShowKeyboard(!showKeyboard)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors ${
                  showKeyboard
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface'
                }`}
                title="Toggle Math Keyboard"
              >
                <Keyboard className="w-4 h-4" />
                <span className="hidden sm:inline">Math Keyboard</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUploader(!showUploader)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors ${
                  showUploader
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface'
                }`}
                title="Upload Photo / Homework"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Photo OCR</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || (!input.trim() && !attachedImage)}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 transition-all shadow-xs"
              title="Solve"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

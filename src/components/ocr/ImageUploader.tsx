'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, Sparkles, Camera } from 'lucide-react';
import { SAMPLE_PROBLEMS } from '@/core/samples/mathCorpus';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string, previewUrl: string) => void;
  onClearImage: () => void;
  selectedPreviewUrl?: string;
  onSelectSamplePrompt: (prompt: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  onClearImage,
  selectedPreviewUrl,
  onSelectSamplePrompt,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isImage && !isPdf) {
      alert('Please select an image or PDF worksheet (PNG, JPG, WebP, or PDF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const parts = result.split(',');
        const mime = isPdf ? 'application/pdf' : (parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg');
        const base64 = parts[1];
        onImageSelected(base64, mime, isPdf ? '/pdf-preview-icon.png' : result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Upload Dropzone */}
      {!selectedPreviewUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 scale-[0.99]'
              : 'border-gray-200 dark:border-dark-border hover:border-brand-400 bg-gray-50/50 dark:bg-dark-surface/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Drag and drop an image or PDF
              </p>
              <p className="text-[11px] text-gray-500 dark:text-dark-muted mt-0.5">
                Accepts PNG, JPG, WebP, and PDF up to 20MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden bg-gray-900/5 dark:bg-black/40 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={selectedPreviewUrl}
              alt="Attached document"
              className="w-16 h-16 object-cover rounded-lg border border-gray-300 dark:border-dark-border"
            />
            <div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                File attached
              </span>
              <p className="text-[11px] text-gray-500 dark:text-dark-muted mt-0.5">
                Ready for solution
              </p>
            </div>
          </div>
          <button
            onClick={onClearImage}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1-Click Sample Chips */}
      <div className="pt-1">
        <div className="flex items-center space-x-1 mb-2">
          <Sparkles className="w-3 h-3 text-brand-500" />
          <span className="text-xs font-medium text-gray-600 dark:text-dark-muted">
            Try a sample benchmark problem:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PROBLEMS.slice(0, 4).map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSamplePrompt(sample.prompt)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-200 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors shadow-xs"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

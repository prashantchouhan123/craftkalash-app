import React, { useState, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Upload, Trash2, Loader2, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const { addToast } = useShop();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rlsError, setRlsError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // 1. Validate File type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast('Only JPG, JPEG, PNG, and WEBP formats are supported.', 'error');
      return;
    }

    // 2. Validate File size (Max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      addToast('File size must be less than 5 MB.', 'error');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setRlsError(null);

    if (isSupabaseConfigured) {
      try {
        // Explicitly verify that we have an active, authenticated Supabase session before starting the upload
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active authenticated session found. Please log in with your administrator account to upload assets.');
        }

        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        // Simulate progress increment alongside actual upload to make it smooth and responsive
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 95) return prev;
            return prev + Math.floor(Math.random() * 10) + 5;
          });
        }, 100);

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        clearInterval(interval);

        if (error) {
          throw error;
        }

        setProgress(100);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        onChange(publicUrl);
        addToast('Image uploaded successfully to database storage!', 'success');
      } catch (err: any) {
        console.error('Storage upload error:', err);
        const errMsg = err.message || 'Unknown error';
        if (errMsg.toLowerCase().includes('row-level security') || errMsg.toLowerCase().includes('rls') || errMsg.toLowerCase().includes('policy')) {
          setRlsError(errMsg);
        }
        addToast(`Upload failed: ${errMsg}`, 'error');
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    } else {
      addToast('Upload failed: Supabase connection is not configured.', 'error');
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async () => {
    if (!value) return;

    if (isSupabaseConfigured) {
      const parts = value.split('/product-images/');
      if (parts.length > 1) {
        const filePath = parts[1];
        try {
          await supabase.storage.from('product-images').remove([filePath]);
        } catch (err) {
          console.error('Error removing file from storage:', err);
        }
      }
    }

    onChange('');
    addToast('Image removed.', 'info');
  };

  const fixSql = `-- Run this in your Supabase SQL Editor to enable image uploads:

-- 1. Ensure the 'product-images' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable Row Level Security (RLS) on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Public read access to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin write access to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- 4. Create bulletproof policies for product-images bucket
CREATE POLICY "Public read access to product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Allow public deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(fixSql);
    setCopied(true);
    addToast('SQL patch copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">Product Asset</label>
        {value && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-[9px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Remove Asset
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      {isUploading ? (
        <div className="w-full h-40 border border-brand-border/60 rounded-xl bg-brand-bg/20 flex flex-col items-center justify-center space-y-3 p-4">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          <div className="text-center">
            <p className="text-xs font-bold text-brand-text-primary">Uploading your artisanal asset...</p>
            <p className="text-[10px] text-brand-text-secondary mt-1">Please wait a moment</p>
          </div>
          <div className="w-full max-w-xs bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-brand-primary h-full transition-all duration-200 rounded-full" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-brand-primary font-bold">{progress}%</span>
        </div>
      ) : value ? (
        <div className="relative group border border-brand-border/60 rounded-xl overflow-hidden bg-brand-bg/10 aspect-video flex items-center justify-center">
          <img 
            src={value} 
            alt="Product Preview" 
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-brand-text-primary text-[10px] font-bold rounded-lg hover:bg-gray-100 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-200 select-none ${
            isDragging
              ? 'border-brand-primary bg-brand-primary/5 scale-[0.99]'
              : 'border-brand-border/60 hover:border-brand-primary hover:bg-brand-bg/20'
          }`}
        >
          <div className="p-3 bg-brand-bg/50 rounded-full border border-brand-border/40 mb-2">
            <Upload className="w-5 h-5 text-brand-text-secondary" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-brand-text-primary">
              <span className="text-brand-primary">Click to upload</span> or drag & drop
            </p>
            <p className="text-[9px] text-gray-400 font-medium">
              Supports PNG, JPG, JPEG, WEBP up to 5MB
            </p>
          </div>
        </div>
      )}

      {rlsError && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-[11px] font-bold text-red-800 uppercase tracking-wider">Database Policy Restriction Detected</h5>
              <p className="text-[10px] text-red-600 mt-0.5 leading-relaxed">
                Supabase Storage is rejecting uploads because Row-Level Security (RLS) is enabled but no permissive write policies exist for the <strong>product-images</strong> bucket.
              </p>
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-2.5 relative">
            <div className="flex items-center justify-between mb-1.5 border-b border-slate-800 pb-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">SQL Patch</span>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-[9px] text-brand-primary hover:text-white bg-brand-primary/10 hover:bg-brand-primary/20 px-2 py-1 rounded font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy SQL'}
              </button>
            </div>
            <pre className="text-[9px] font-mono text-slate-300 overflow-x-auto max-h-36 whitespace-pre">
              {fixSql}
            </pre>
          </div>
          
          <p className="text-[9px] text-slate-500 leading-normal">
            💡 <strong>How to fix:</strong> Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline hover:text-brand-secondary">Supabase Dashboard</a>, navigate to the <strong>SQL Editor</strong>, paste this patch, and click <strong>Run</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

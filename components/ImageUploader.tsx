import React, { useCallback, useEffect, useState } from 'react';
import { ImageIcon, ClipboardPaste, ArrowUpFromLine, Package, Loader2, FileArchive } from 'lucide-react';
import { UploadedImage } from '../types';
import JSZip from 'jszip';
import { Monitor } from '../utils/monitoring';

interface ImageUploaderProps {
  image: UploadedImage | null;
  onImageChange: (image: UploadedImage | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const processFile = useCallback(async (file: File) => {
    // Handle standard images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange({ 
          id: Math.random().toString(36).substr(2, 9),
          file, 
          previewUrl: URL.createObjectURL(file), 
          base64: reader.result as string 
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // Handle Archives (.zip)
    if (file.type === 'application/zip' || file.name.endsWith('.zip') || file.name.endsWith('.7z') || file.name.endsWith('.rar')) {
      // Note: JSZip primarily handles .zip. For .7z and .rar, we provide a guided warning if they fail.
      if (file.name.match(/\.(rar|7z)$/i)) {
        Monitor.log('warning', `Archive format detected: ${file.name.split('.').pop()?.toUpperCase()}`, 'Native browser decompression is optimized for .ZIP. If extraction fails, please re-archive as a standard ZIP.');
      }

      setIsExtracting(true);
      Monitor.log('info', `Unpacking archive swarm: ${file.name}`);
      
      try {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);
        
        // Filter out directories and system junk (MACOSX, DS_Store, etc.)
        const validFiles = Object.values(content.files).filter((f: any) => {
          if (f.dir) return false;
          const name = f.name.toLowerCase();
          return !name.includes('__macosx') && 
                 !name.includes('.ds_store') && 
                 !name.includes('thumbs.db') &&
                 name.match(/\.(png|jpg|jpeg|webp)$/);
        });

        if (validFiles.length === 0) {
          Monitor.log('warning', 'Archive Analysis Complete', 'No valid image assets (PNG, JPG, WebP) found in the package.');
          setIsExtracting(false);
          return;
        }
        
        let extractedCount = 0;
        for (const zipFile of validFiles as any[]) {
          const blob = await zipFile.async('blob');
          
          // Use the full path as the filename to preserve directory context for the AI
          // (e.g. "Screenshots/Auth/Login.png")
          const cleanPath = zipFile.name.replace(/^\.\//, '');
          const extractedFile = new File([blob], cleanPath, { type: blob.type || 'image/png' });
          
          const base64 = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.readAsDataURL(extractedFile);
          });

          onImageChange({
            id: Math.random().toString(36).substr(2, 9),
            file: extractedFile,
            previewUrl: URL.createObjectURL(extractedFile),
            base64: base64
          });
          
          extractedCount++;
          // Log only every few files if there are many to avoid flooding the console
          if (validFiles.length < 10 || extractedCount % 5 === 0) {
            Monitor.log('success', `Recovered asset: ${cleanPath}`);
          }
        }
        
        Monitor.log('success', `Unpack complete. ${extractedCount} modular assets synchronized.`);
      } catch (err: any) {
        Monitor.log('error', 'Archive decompression failed', err.message);
      } finally {
        setIsExtracting(false);
      }
      return;
    }
  }, [onImageChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(f => processFile(f));
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) processFile(file);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) Array.from(e.dataTransfer.files).forEach(f => processFile(f)); }}
      className={`relative flex flex-col items-center justify-center w-full h-[280px] border-2 border-dashed rounded-[2.5rem] transition-all group overflow-hidden ${isDragging ? 'border-indigo-600 bg-indigo-50 shadow-2xl scale-[1.02]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
    >
      {isExtracting && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Decompressing Swarm...</p>
        </div>
      )}

      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-8 text-center z-10">
        <div className="flex gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isDragging ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 shadow-sm group-hover:text-indigo-600 group-hover:scale-110'}`}>
            {isDragging ? <ArrowUpFromLine /> : <ImageIcon />}
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isDragging ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 shadow-sm group-hover:text-indigo-400 group-hover:scale-110'}`}>
            <Package />
          </div>
        </div>
        
        <p className="text-sm font-black text-slate-800 tracking-tight uppercase">
          {isDragging ? 'DROP TO ANALYZE' : 'Drop Screenshots or Archives'}
        </p>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 leading-relaxed">
          PNG, JPG, WebP or <span className="text-indigo-600">.ZIP / .7Z / .RAR</span>
        </p>
        
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 text-[9px] text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm font-black uppercase tracking-wider">
            <ClipboardPaste className="w-3.5 h-3.5" /> Cmd+V Paste
          </div>
          <div className="flex items-center gap-2 text-[9px] text-indigo-600 bg-white px-4 py-2 rounded-xl border border-indigo-50 shadow-sm font-black uppercase tracking-wider">
            <FileArchive className="w-3.5 h-3.5" /> Archive Swarm
          </div>
        </div>
        
        <input type="file" className="hidden" accept="image/*,.zip,.rar,.7z" multiple onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default ImageUploader;
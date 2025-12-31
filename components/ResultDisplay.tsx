import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Download, Check, FileCode, Package, Zap, AlertTriangle, Info, FileQuestion, ChevronRight, Braces, Terminal, FileText, History, Clock, Layers } from 'lucide-react';
import JSZip from 'jszip';
import { ParsedFile, Checkpoint } from '../types';

interface ResultDisplayProps {
  content: string;
  checkpoints: Checkpoint[];
  onSelectCheckpoint: (checkpoint: Checkpoint) => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ content, checkpoints, onSelectCheckpoint }) => {
  const [activeFile, setActiveFile] = useState<ParsedFile | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'report' | 'checkpoints'>('code');
  const [copied, setCopied] = useState(false);

  const files = useMemo(() => {
    const lines = content.split('\n');
    const parsedFiles: ParsedFile[] = [];
    let currentFilename: string | null = null;
    let currentLines: string[] = [];
    
    const headerRegex = /^### FILE:\s*([^\s]+)/i;

    const flush = () => {
       if (currentFilename && currentLines.length > 0) {
          let code = currentLines.join('\n');
          const match = code.match(/```[a-z]*\n([\s\S]*?)```/i) || code.match(/```([\s\S]*?)```/i);
          if (match) code = match[1];
          parsedFiles.push({
             filename: currentFilename,
             content: code.trim(),
             language: currentFilename.split('.').pop() || 'text'
          });
       }
       currentLines = [];
       currentFilename = null;
    };

    lines.forEach(line => {
       const match = line.match(headerRegex);
       if (match) {
          flush();
          currentFilename = match[1].replace(/^\.\//, '').trim(); 
       } else if (currentFilename) {
          currentLines.push(line);
       }
    });
    flush(); 
    return parsedFiles;
  }, [content]);

  useEffect(() => {
    if (files.length > 0 && !activeFile) setActiveFile(files[0]);
  }, [files, activeFile]);

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    files.forEach(f => zip.file(f.filename, f.content));
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `recovery-${new Date().getTime()}.zip`;
    a.click();
  };

  const getIcon = (lang: string) => {
    if (['ts', 'tsx', 'js', 'jsx'].includes(lang)) return <FileCode className="w-4 h-4 text-indigo-500" />;
    if (['json', 'yml'].includes(lang)) return <Braces className="w-4 h-4 text-amber-500" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Dynamic Modular Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> 
              Swarm Asset: {activeFile?.filename || 'Analyzing...'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Modular System Recovery</span>
               <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
               <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{files.length} Assets Found</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex bg-slate-100 rounded-2xl p-1.5 border border-slate-200">
            <button onClick={() => setViewMode('code')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'code' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Files</button>
            <button onClick={() => setViewMode('checkpoints')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'checkpoints' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>History</button>
            <button onClick={() => setViewMode('report')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'report' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Report</button>
          </div>
          <button onClick={handleDownloadZip} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all active:scale-90"><Download className="w-5 h-5"/></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Modular Sidebar */}
        <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
          {viewMode === 'checkpoints' ? (
             <div className="p-6 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Recovery Checkpoints</h4>
                {checkpoints.length === 0 && <div className="text-[10px] text-slate-400 italic">No previous sessions found.</div>}
                {checkpoints.map((cp, idx) => (
                   <button 
                     key={idx} 
                     onClick={() => onSelectCheckpoint(cp)}
                     className="w-full group text-left p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all"
                   >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-400">{new Date(cp.timestamp).toLocaleTimeString()}</span>
                        <History className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                      </div>
                      <div className="text-[11px] font-black text-slate-800 line-clamp-1 mb-1">{cp.summary}</div>
                      <div className="flex items-center gap-2">
                         <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded uppercase">{cp.files.length} Files</span>
                         <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black rounded uppercase">{cp.imageCount} Imgs</span>
                      </div>
                   </button>
                ))}
             </div>
          ) : (
            <div className="p-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Recovered Modules</h4>
              <div className="space-y-1.5">
                {files.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveFile(file); setViewMode('code'); }}
                    className={`w-full text-left px-4 py-3 text-xs rounded-2xl transition-all flex items-center justify-between group
                      ${activeFile?.filename === file.filename ? 'bg-white text-indigo-700 font-black shadow-lg border border-slate-200' : 'text-slate-500 hover:bg-white hover:shadow-sm'}
                    `}
                  >
                    <span className="truncate flex items-center gap-3">
                      {getIcon(file.language)}
                      {file.filename}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${activeFile?.filename === file.filename ? 'rotate-90 text-indigo-500' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Area with Transition Effect */}
        <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
          {viewMode === 'code' && activeFile ? (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
              <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Source Context: {activeFile.filename}</span>
                </div>
                <button 
                  onClick={() => { navigator.clipboard.writeText(activeFile.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-[0.1em]"
                >
                  {copied ? 'Copied' : 'Copy module'}
                </button>
              </div>
              <div className="flex-1 overflow-auto p-10 bg-slate-50/10 custom-scrollbar">
                <pre className="text-xs font-mono leading-relaxed text-slate-700 selection:bg-indigo-100 whitespace-pre">
                  {activeFile.content}
                </pre>
              </div>
            </div>
          ) : viewMode === 'report' ? (
            <div className="p-12 h-full overflow-y-auto bg-white animate-in slide-in-from-right-10 duration-500">
              <div className="max-w-3xl">
                <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter">Swarm Integrity Report</h2>
                <div className="markdown-body prose prose-slate max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-200 font-black uppercase tracking-[0.2em] text-xs animate-in zoom-in-95 duration-500">
               Select module to initiate view
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
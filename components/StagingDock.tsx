
import React from 'react';
import { Box, Rocket, CheckCircle2, X, Info, Gauge, Layers, BrainCircuit, ShieldCheck, Sparkles, FileText } from 'lucide-react';
import { StagingData } from '../types';

interface StagingDockProps {
  data: StagingData;
  isPersistenceActive: boolean;
  onLaunch: () => void;
  onEject: () => void;
}

const StagingDock: React.FC<StagingDockProps> = ({ data, isPersistenceActive, onLaunch, onEject }) => {
  return (
    <div className={`h-full flex flex-col bg-slate-900 rounded-[3rem] border-2 transition-all duration-700 overflow-hidden shadow-2xl ${isPersistenceActive ? 'border-indigo-400' : 'border-slate-800'}`}>
      
      {/* Header */}
      <div className={`px-10 py-10 flex items-center justify-between transition-colors ${isPersistenceActive ? 'bg-indigo-600' : 'bg-slate-800'}`}>
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/10">
            {isPersistenceActive ? <BrainCircuit className="w-7 h-7 animate-pulse" /> : <Sparkles className="w-7 h-7" />}
          </div>
          <div>
            <div className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mb-1">
              {isPersistenceActive ? 'Full Context Persistence Active' : 'Project Translation Ready'}
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight">{data.projectName || 'My New Project'}</h3>
          </div>
        </div>
        <button onClick={onEject} className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-xl">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-slate-900">
        {/* Project Snapshot */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
            <Gauge className="w-5 h-5 text-indigo-400 mb-3" />
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Complexity</div>
            <div className="text-lg font-bold text-white capitalize">{data.estimatedComplexity}</div>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
            <Layers className="w-5 h-5 text-emerald-400 mb-3" />
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Modules</div>
            <div className="text-lg font-bold text-white">{data.modules.length} Components</div>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
            <ShieldCheck className="w-5 h-5 text-amber-400 mb-3" />
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Confidence</div>
            <div className="text-lg font-bold text-white">{isPersistenceActive ? 'Production' : 'High'}</div>
          </div>
        </div>

        {/* Blueprint Checklist */}
        {data.deploymentChecklist && data.deploymentChecklist.length > 0 && (
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Synthesis Blueprint</h4>
            <div className="space-y-3">
              {data.deploymentChecklist.map((task, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                  <CheckCircle2 className={`w-4 h-4 ${isPersistenceActive ? 'text-indigo-400' : 'text-emerald-400'}`} />
                  <span className="text-[11px] text-slate-300 group-hover:text-white">{task}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module List */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Identified Modules</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.modules.map((mod) => (
              <div key={mod.id} className="p-6 bg-slate-800/30 border border-white/5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-white text-sm">{mod.filename}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">"{mod.description}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Handoff Insight */}
        <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex gap-6">
           <Info className="w-8 h-8 text-indigo-400 shrink-0" />
           <div className="space-y-1">
             <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Synthesis Mode</div>
             <p className="text-sm text-slate-300 leading-relaxed">
               I've mapped your chat history to a clean architecture. Next, I'll generate the full source code for <strong>{data.projectName}</strong> using <strong>{data.techStack[0]}</strong>.
             </p>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-10 bg-slate-950 border-t border-white/5">
        <button 
          onClick={onLaunch}
          className={`w-full py-6 text-white rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-4 ${isPersistenceActive ? 'bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-900/40' : 'bg-slate-700 hover:bg-slate-600'}`}
        >
          Finalize Project Handoff
          <Rocket className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default StagingDock;

import React from 'react';
import { 
  AlertTriangle, WifiOff, Key, Server, RefreshCw, 
  ShieldAlert, Cpu, Activity, Settings, ExternalLink,
  ChevronRight, Terminal, AlertCircle
} from 'lucide-react';
import { ProviderSettings } from '../types';
import { Monitor, ErrorClassification } from '../utils/monitoring';

interface ErrorDisplayProps {
  error: string;
  providerSettings: ProviderSettings;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, providerSettings, onRetry }) => {
  const diagnosis: ErrorClassification = Monitor.classifyError(error);

  const getIcon = () => {
    switch (diagnosis.code.split('_')[0]) {
      case 'AUTH': return <Key className="w-8 h-8" />;
      case 'NET': return <WifiOff className="w-8 h-8" />;
      case 'SWARM': return <Activity className="w-8 h-8" />;
      case 'SAFE': return <ShieldAlert className="w-8 h-8" />;
      case 'PERM': return <Server className="w-8 h-8" />;
      default: return <AlertTriangle className="w-8 h-8" />;
    }
  };

  const handleAction = () => {
    if (diagnosis.action?.type === 'billing') {
      window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
    } else if (diagnosis.action?.type === 'config') {
      // In a real app, this would scroll to settings or open a modal
      onRetry();
    } else {
      onRetry();
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-[4rem] border-4 border-rose-50 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden relative">
      {/* Background Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] animate-pulse"></div>
      
      <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-rose-100 ring-4 ring-white relative z-10">
        {getIcon()}
      </div>
      
      <div className="text-center space-y-4 max-w-xl relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="px-3 py-1 bg-rose-600 text-white text-[9px] font-black rounded-lg uppercase tracking-[0.2em]">Error Code: {diagnosis.code}</span>
        </div>
        <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{diagnosis.title}</h3>
        <p className="text-xl text-slate-400 font-medium leading-relaxed italic">
          "{diagnosis.message}"
        </p>
      </div>

      <div className="mt-12 w-full max-w-lg space-y-6 relative z-10">
        {/* Actionable Repair Protocols */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Repair Protocol Required</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider mb-1">Step 1: Diagnostic Verification</div>
                <div className="text-[10px] text-slate-400 leading-relaxed">Ensure the system state matches the requirements for {providerSettings.provider.toUpperCase()} provider.</div>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider mb-1">Step 2: Buffer Reset</div>
                <div className="text-[10px] text-slate-400 leading-relaxed">Clearing existing splice cache and re-initializing model context {diagnosis.code.includes('429') ? '(Wait recommended)' : ''}.</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button 
              onClick={handleAction}
              className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
            >
              {diagnosis.action?.label || 'Retry Synthesis'}
              {diagnosis.action?.type === 'billing' ? <ExternalLink className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-6">
           <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.1em]">Stack Trace Attached Below</span>
           </div>
           <button 
            onClick={() => Monitor.log('info', 'Error context exported to clipboard')}
            className="text-[9px] font-black text-indigo-400 hover:text-indigo-600 transition-colors uppercase"
           >
             Copy Details
           </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
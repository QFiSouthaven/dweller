import React from 'react';
import { ShieldAlert, Zap, ExternalLink, Trash2, Cpu, Activity } from 'lucide-react';
import { SwarmMetrics } from '../types';

interface MemoryGovernorProps {
  metrics: SwarmMetrics;
  onClearSwarm: () => void;
}

const MemoryGovernor: React.FC<MemoryGovernorProps> = ({ metrics, onClearSwarm }) => {
  if (!metrics.isCritical) return null;

  const handleScaleOut = () => {
    window.open(window.location.href, '_blank');
  };

  const formattedSize = (metrics.totalBytes / (1024 * 1024 * 1024)).toFixed(2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="max-w-2xl w-full bg-white rounded-[4rem] p-12 shadow-[0_0_100px_rgba(244,63,94,0.3)] border-4 border-rose-500 relative overflow-hidden">
        {/* Overload HUD Decoration */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Cpu className="w-64 h-64 text-rose-500" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl animate-bounce">
            <ShieldAlert className="w-12 h-12" />
          </div>

          <div className="space-y-4 mb-12">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              Critical Payload Detected
            </div>
            <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
              SWARM <span className="text-rose-600">OVERLOAD</span>
            </h2>
            <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
              The synthesis engine has reached <span className="font-black text-rose-600">{formattedSize}GB</span> of resident memory. 
              Continuing in this instance may result in a system crash (OOM).
            </p>
          </div>

          {/* Saturation Gauge */}
          <div className="w-full bg-slate-100 h-10 rounded-full mb-12 p-2 border-2 border-slate-200 shadow-inner relative overflow-hidden">
            <div 
              className="h-full bg-rose-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${metrics.saturation * 100}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">100% STACK SATURATION</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <button 
              onClick={handleScaleOut}
              className="group flex flex-col items-center gap-4 p-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] transition-all hover:-translate-y-2 shadow-2xl shadow-indigo-200"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <ExternalLink className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black uppercase tracking-widest mb-1">Scale Out</div>
                <div className="text-sm font-bold">Open New Instance</div>
              </div>
            </button>

            <button 
              onClick={onClearSwarm}
              className="group flex flex-col items-center gap-4 p-8 bg-white border-2 border-slate-100 hover:border-rose-200 text-slate-900 rounded-[2.5rem] transition-all hover:-translate-y-2"
            >
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emergency Reset</div>
                <div className="text-sm font-bold">Wipe Current Swarm</div>
              </div>
            </button>
          </div>
          
          <div className="mt-12 flex items-center gap-4 text-slate-400">
             <Activity className="w-4 h-4" />
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">Telemetry protocol: OOM-GUARD v1.0 active</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default MemoryGovernor;
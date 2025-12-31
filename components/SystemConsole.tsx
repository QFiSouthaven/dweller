import React, { useEffect, useState } from 'react';
import { Terminal, Activity, CheckCircle2, AlertCircle, Maximize2, ShieldAlert } from 'lucide-react';
import { Monitor } from '../utils/monitoring';
import { LogEntry } from '../types';

const SystemConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return Monitor.subscribe(setLogs);
  }, []);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'text-indigo-400';
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'error': return 'text-rose-500';
    }
  };

  const hasCritical = logs.some(l => l.level === 'error');

  return (
    <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 ease-in-out ${isOpen ? 'w-[450px]' : 'w-16'}`}>
      {isOpen ? (
        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col h-[500px] overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Activity className={`w-4 h-4 ${hasCritical ? 'text-rose-500 animate-pulse' : 'text-indigo-400 animate-pulse'}`} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Telemetry Stream</span>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => { navigator.clipboard.writeText(JSON.stringify(logs, null, 2)) }}
                className="text-slate-500 hover:text-white transition-colors"
                title="Copy Telemetry Data"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white font-black text-xl leading-none">&times;</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-[10px] custom-scrollbar bg-[rgba(2,6,23,0.5)]">
            {logs.length === 0 && <div className="text-slate-700 italic border border-dashed border-slate-800 p-4 rounded-xl">No system telemetry detected. Passive scan active...</div>}
            {logs.map(log => (
              <div key={log.id} className={`flex gap-4 items-start border-l-2 pl-4 py-1 transition-colors ${log.level === 'error' ? 'border-rose-500 bg-rose-500/5' : 'border-slate-800'}`}>
                <span className="text-slate-600 shrink-0 font-bold">{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <div className="space-y-1 flex-1">
                  <div className={`font-black flex items-center gap-2 uppercase tracking-tight ${getLevelColor(log.level)}`}>
                    {log.level === 'error' && <ShieldAlert className="w-3 h-3" />}
                    {log.level === 'success' && <CheckCircle2 className="w-3 h-3" />}
                    {log.message}
                  </div>
                  {log.details && <div className="text-slate-400 leading-relaxed font-medium bg-white/5 p-2 rounded-lg mt-2 border border-white/5">{log.details}</div>}
                </div>
              </div>
            ))}
          </div>
          
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/10"></div>
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Uplink: Synchronized</span>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className={`w-16 h-16 rounded-[2rem] border shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative
            ${hasCritical 
              ? 'bg-rose-600 border-rose-400 text-white animate-pulse' 
              : 'bg-slate-900 border-slate-800 text-indigo-400 hover:text-white'
            }
          `}
        >
          {hasCritical ? <ShieldAlert className="w-7 h-7" /> : <Terminal className="w-7 h-7" />}
          
          {/* Notification Badge */}
          {logs.length > 0 && (
            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center text-[9px] font-black
              ${hasCritical ? 'bg-white text-rose-600' : 'bg-indigo-600 text-white'}
            `}>
              {logs.length > 99 ? '99+' : logs.length}
            </div>
          )}
        </button>
      )}
    </div>
  );
};

export default SystemConsole;
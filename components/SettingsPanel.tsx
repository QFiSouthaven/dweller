
import React from 'react';
import { ConversionSettings, ProviderSettings } from '../types';
import { FolderTree, FileCode, Sparkles, Zap, GitBranch, BrainCircuit, Rocket, HeartHandshake } from 'lucide-react';

interface SettingsPanelProps {
  settings: ConversionSettings;
  providerSettings: ProviderSettings;
  onToggle: (key: keyof ConversionSettings) => void;
  onUpdateProvider: (key: keyof ProviderSettings, value: any) => void;
  disabled?: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  settings, 
  onToggle, 
  disabled 
}) => {
  const options = [
    {
      key: 'extractProjectStructure' as keyof ConversionSettings,
      label: 'Blueprint Map',
      description: 'Define the folder structure first',
      icon: <FolderTree className="w-5 h-5" />,
      color: 'bg-slate-800',
    },
    {
      key: 'extractSourceCode' as keyof ConversionSettings,
      label: 'Full Source',
      description: 'Extract every line of code',
      icon: <FileCode className="w-5 h-5" />,
      color: 'bg-slate-800',
    },
    {
      key: 'enableSpliceAssembly' as keyof ConversionSettings,
      label: 'Smart Stitching',
      description: 'Connect code across screenshots',
      icon: <GitBranch className="w-5 h-5" />,
      color: 'bg-slate-800',
    },
    {
      key: 'refactorForBestPractices' as keyof ConversionSettings,
      label: 'Polish Code',
      description: 'Clean up naming and structure',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'bg-slate-800',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={() => onToggle(option.key)}
            disabled={disabled}
            className={`
              relative flex items-start p-5 rounded-2xl border-2 transition-all duration-300 text-left
              ${settings[option.key] 
                ? 'border-indigo-500 bg-indigo-50/50 shadow-md' 
                : 'border-slate-100 bg-white hover:border-slate-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
            `}
          >
            <div className={`
              p-2.5 rounded-xl mr-4 text-white transition-all
              ${settings[option.key] ? 'bg-indigo-600 scale-105' : 'bg-slate-200 text-slate-400'}
            `}>
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-[11px] uppercase tracking-wider mb-1 ${settings[option.key] ? 'text-indigo-900' : 'text-slate-500'}`}>
                {option.label}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Context persistence toggle */}
      <button
        onClick={() => onToggle('enableNeuralPersistence')}
        disabled={disabled}
        className={`
          w-full group relative overflow-hidden p-6 rounded-3xl border-2 transition-all duration-500 flex items-center gap-6
          ${settings.enableNeuralPersistence 
            ? 'bg-slate-900 border-indigo-400 shadow-xl' 
            : 'bg-white border-slate-100 hover:border-indigo-200'
          }
        `}
      >
        <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500
          ${settings.enableNeuralPersistence ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-400'}
        `}>
          <HeartHandshake className={`w-7 h-7 ${settings.enableNeuralPersistence ? 'animate-pulse' : ''}`} />
        </div>
        
        <div className="text-left">
          <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${settings.enableNeuralPersistence ? 'text-indigo-400' : 'text-slate-500'}`}>
            {settings.enableNeuralPersistence ? 'Full Handoff Mode' : 'Deep Context Persistence'}
          </div>
          <div className={`text-sm font-bold leading-tight ${settings.enableNeuralPersistence ? 'text-white' : 'text-slate-400'}`}>
            {settings.enableNeuralPersistence 
              ? 'Optimized for large chat history' 
              : 'Best for one-shot project builds'}
          </div>
        </div>

        <div className="ml-auto">
          <Rocket className={`w-5 h-5 transition-transform duration-700 ${settings.enableNeuralPersistence ? 'text-indigo-400 -translate-y-1' : 'text-slate-200'}`} />
        </div>
      </button>

      <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3 border border-slate-100">
         <Zap className="w-5 h-5 text-amber-500 flex-shrink-0" />
         <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
           This mode resolves all imports by scanning your entire chat history for a complete project build.
         </p>
      </div>
    </div>
  );
};

export default SettingsPanel;


import React, { useState, useMemo } from 'react';
import { UploadedImage, ConversionSettings, ProcessingState, ProviderSettings, Checkpoint, ParsedFile, SwarmMetrics } from './types';
import SettingsPanel from './components/SettingsPanel';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import ErrorDisplay from './components/ErrorDisplay';
import SystemConsole from './components/SystemConsole';
import MemoryGovernor from './components/MemoryGovernor';
import StagingDock from './components/StagingDock';
import { performStagingAnalysis, executeSynthesis } from './services/llmService'; 
import { Monitor } from './utils/monitoring';
// Fix: Added missing 'X' icon import to fix line 167 error
import { Activity, FileArchive, Loader2, Thermometer, Box, BrainCircuit, HeartHandshake, Sparkles, X } from 'lucide-react';

const App: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [settings, setSettings] = useState<ConversionSettings>({
    extractProjectStructure: true,
    extractSourceCode: true,
    addDocumentation: true,
    refactorForBestPractices: true,
    enableSpliceAssembly: true,
    enableNeuralPersistence: false,
  });

  const [providerSettings, setProviderSettings] = useState<ProviderSettings>({
    provider: 'google',
    localBaseUrl: 'http://localhost:1234/v1',
    localModelId: 'local-model'
  });

  const [processing, setProcessing] = useState<ProcessingState>({
    isLoading: false,
    isStaged: false,
    stagingData: null,
    progress: 0,
    error: null,
    result: null,
    logs: [],
    checkpoints: []
  });

  const metrics: SwarmMetrics = useMemo(() => Monitor.calculateMetrics(images), [images]);

  const handleImageAdd = (newImage: UploadedImage | null) => {
    if (newImage) {
      setImages(prev => [...prev, { ...newImage, isSpliceSource: true }]);
      Monitor.log('info', `Added asset: ${newImage.file.name}`);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleStaging = async () => {
    if (images.length === 0 || metrics.isCritical) return;
    setProcessing(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));
    try {
      const data = await performStagingAnalysis(images, settings, (p) => setProcessing(v => ({...v, progress: p})));
      setProcessing(prev => ({ ...prev, isLoading: false, isStaged: true, stagingData: data, progress: 100 }));
    } catch (err: any) {
      setProcessing(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  const handleLaunch = async () => {
    if (!processing.stagingData) return;
    setProcessing(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));
    try {
      const result = await executeSynthesis(images, processing.stagingData, settings, (p) => setProcessing(v => ({...v, progress: p})));
      
      const parsedFiles: ParsedFile[] = [];
      const lines = result.split('\n');
      let currentFilename: string | null = null;
      let currentLines: string[] = [];
      
      lines.forEach(line => {
        const match = line.match(/^### FILE:\s*([^\s]+)/i);
        if (match) {
          if (currentFilename) parsedFiles.push({ filename: currentFilename, content: currentLines.join('\n'), language: currentFilename.split('.').pop() || 'text' });
          currentFilename = match[1];
          currentLines = [];
        } else if (currentFilename) currentLines.push(line);
      });
      if (currentFilename) parsedFiles.push({ filename: currentFilename, content: currentLines.join('\n'), language: currentFilename.split('.').pop() || 'text' });

      const newCheckpoint: Checkpoint = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        result: result,
        imageCount: images.length,
        files: parsedFiles,
        summary: `Handoff: ${processing.stagingData.projectName}`
      };

      setProcessing(prev => ({ 
        ...prev, 
        isLoading: false, 
        isStaged: false,
        result,
        checkpoints: [newCheckpoint, ...prev.checkpoints].slice(0, 10)
      }));
      Monitor.log('success', 'Project handoff complete!');
    } catch (err: any) {
      setProcessing(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 lg:px-16 selection:bg-indigo-100">
      <MemoryGovernor metrics={metrics} onClearSwarm={() => setImages([])} />
      
      <div className="max-w-[1600px] mx-auto space-y-16">
        
        {/* Main Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-12 border-b border-slate-200">
          <div className="max-w-3xl">
            <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-8 ${settings.enableNeuralPersistence ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <HeartHandshake className="w-3.5 h-3.5" /> Project Handoff Studio
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-slate-900 tracking-tight leading-[0.9] mb-8">
              Chat to <span className="text-indigo-600">Code</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Synthesize production-ready project files directly from your chat history and inspiration screenshots.
            </p>
          </div>

          <div className="flex flex-col items-end gap-6">
            <div className={`p-6 rounded-[2rem] bg-white border border-slate-200 shadow-xl flex items-center gap-8 transition-all duration-700 relative overflow-hidden group`}>
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all ${metrics.isCritical ? 'bg-rose-500' : settings.enableNeuralPersistence ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                    {metrics.isCritical ? <Thermometer className="w-7 h-7 animate-pulse" /> : <Activity className="w-7 h-7" />}
                  </div>
                  {images.length > 0 && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 text-white text-[10px] font-bold rounded-full border-4 border-white flex items-center justify-center">
                      {images.length}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Handoff Payload</div>
                  <div className="text-xl font-bold text-slate-900">
                    {(metrics.totalBytes / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 items-start">
          <div className="xl:col-span-4 space-y-12">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                Input Inspiration
              </h2>
              <ImageUploader image={null} onImageChange={handleImageAdd} />
              
              {images.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {images.map(img => (
                    <div key={img.id} className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-100 relative group">
                      <img src={img.previewUrl} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(img.id)} className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                Project Preferences
              </h2>
              <SettingsPanel 
                settings={settings} 
                providerSettings={providerSettings}
                onToggle={(k) => setSettings(prev => ({...prev, [k]: !prev[k]}))} 
                onUpdateProvider={(k, v) => setProviderSettings(prev => ({...prev, [k]: v}))}
                disabled={processing.isLoading}
              />
            </div>

            <div className="space-y-4">
              {processing.isLoading && (
                <div className="px-10 space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{processing.isStaged ? 'Synthesizing...' : 'Analyzing Chat...'}</span>
                    <span className="text-lg font-bold text-indigo-600">{processing.progress}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${processing.progress}%` }}></div>
                  </div>
                </div>
              )}
              
              {!processing.isStaged ? (
                <button
                  onClick={handleStaging}
                  disabled={images.length === 0 || processing.isLoading || metrics.isCritical}
                  className={`w-full py-8 rounded-[2rem] font-bold text-xl transition-all flex items-center justify-center gap-4 uppercase tracking-widest
                    ${(images.length === 0 || metrics.isCritical) ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-black hover:-translate-y-1 shadow-xl'}
                  `}
                >
                  {processing.isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                  Generate Blueprint
                </button>
              ) : (
                <button
                  onClick={handleLaunch}
                  disabled={processing.isLoading}
                  className="w-full py-8 rounded-[2rem] font-bold text-xl bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 uppercase tracking-widest shadow-xl shadow-indigo-100"
                >
                  {processing.isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Box className="w-6 h-6" />}
                  Finalize Build
                </button>
              )}
            </div>
          </div>

          <div className="xl:col-span-8 min-h-[800px]">
            {processing.error ? (
              <ErrorDisplay error={processing.error} providerSettings={providerSettings} onRetry={processing.isStaged ? handleLaunch : handleStaging} />
            ) : processing.isStaged && processing.stagingData ? (
              <StagingDock data={processing.stagingData} isPersistenceActive={settings.enableNeuralPersistence} onLaunch={handleLaunch} onEject={() => setProcessing(v => ({...v, isStaged: false, stagingData: null}))} />
            ) : processing.result ? (
              <ResultDisplay content={processing.result} checkpoints={processing.checkpoints} onSelectCheckpoint={(cp) => setProcessing(v => ({...v, result: cp.result}))} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-32 text-center bg-white rounded-[3rem] border-2 border-slate-100 border-dashed">
                <div className="w-32 h-32 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-10">
                  <Activity className="w-16 h-16" />
                </div>
                <h3 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Ready for Handoff</h3>
                <p className="text-slate-400 max-w-md font-medium text-lg leading-relaxed">
                  Upload your chat screenshots to begin the project synthesis process.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <SystemConsole />
    </div>
  );
};

export default App;

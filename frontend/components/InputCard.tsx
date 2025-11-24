import React, { useState, useRef } from 'react';
import { Wand2, Link as LinkIcon, AlertCircle, Globe, Loader2, Video, X, UploadCloud, FileVideo } from 'lucide-react';
import { motion } from 'framer-motion';
import { GenerationRequest, AppStatus, Language } from '../types';
import { t } from '../utils/translations';
import clsx from 'clsx';

interface InputCardProps {
  status: AppStatus;
  language: Language;
  onAnalyze: (request: GenerationRequest) => void;
}

const InputCard: React.FC<InputCardProps> = ({ status, language, onAnalyze }) => {
  const [prompt, setPrompt] = useState('');
  const [topK, setTopK] = useState(3);
  const [useExternal, setUseExternal] = useState(false);
  const [urls, setUrls] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!prompt.trim() && !videoFile) return;
    onAnalyze({
      prompt,
      topK,
      useExternalInfo: useExternal,
      externalUrls: urls,
      videoFile
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        if(e.dataTransfer.files[0].type.startsWith('video/')) {
            setVideoFile(e.dataTransfer.files[0]);
        }
    }
  };

  const isLoading = status === AppStatus.ANALYZING;
  const isHidden = status !== AppStatus.IDLE && status !== AppStatus.ANALYZING && status !== AppStatus.ERROR;

  if (isHidden) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-panel relative overflow-hidden rounded-[2rem] p-1 shadow-2xl ring-1 ring-white/40"
    >
      {/* Inner Content Container */}
      <div className="relative rounded-[1.8rem] bg-white/40 p-8 backdrop-blur-sm">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
              <span className="font-sans text-xl font-bold text-slate-800">{t(language, 'input.step')}</span>
            </div>
            <div>
              <h2 className="font-sans text-2xl font-bold text-slate-800">{t(language, 'input.title')}</h2>
              <p className="text-sm font-medium text-slate-500">{t(language, 'input.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t(language, 'input.refTemplates')}</span>
            <div className="h-4 w-px bg-slate-200"></div>
            <input 
              type="number" 
              min={1} 
              max={10} 
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value) || 1)}
              className="w-8 bg-transparent text-center text-lg font-bold text-slate-700 outline-none focus:text-brand-600"
            />
          </div>
        </div>

        <div className="space-y-8">
          {/* Video Upload Area */}
          <div 
             className={clsx(
                "group relative overflow-hidden rounded-3xl border-2 transition-all duration-300 ease-out",
                isDragging ? "border-brand-400 bg-brand-50/50 scale-[1.01]" : "border-dashed border-slate-200 bg-slate-50/30 hover:border-brand-300 hover:bg-white/60",
                videoFile ? "border-solid border-brand-200 bg-brand-50/20" : ""
             )}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
          >
             <input 
                type="file" 
                accept="video/*" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
             />
             
             <div className="relative z-10 flex min-h-[120px] flex-col items-center justify-center py-6">
               {videoFile ? (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex w-full max-w-md items-center gap-4 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5"
                 >
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md">
                     <FileVideo size={24} />
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <p className="truncate font-sans text-sm font-bold text-slate-800">{videoFile.name}</p>
                     <p className="text-xs font-medium text-slate-500">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                   </div>
                   <button 
                     onClick={(e) => {
                       e.preventDefault();
                       setVideoFile(null);
                       if(fileInputRef.current) fileInputRef.current.value = '';
                     }}
                     className="relative z-30 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                   >
                     <X size={18} />
                   </button>
                 </motion.div>
               ) : (
                 <div className="flex flex-col items-center gap-3 text-center">
                    <div className={clsx(
                      "flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-colors duration-300",
                      isDragging ? "bg-brand-100 text-brand-600" : "bg-white text-slate-400 group-hover:text-brand-500 group-hover:scale-110 transition-transform"
                    )}>
                      <UploadCloud size={28} />
                    </div>
                    <div>
                      <p className="font-sans text-sm font-bold text-slate-700">
                        {isDragging ? t(language, 'input.dropZone.active') : t(language, 'input.dropZone.idle')}
                        <span className="font-normal text-slate-500"> {t(language, 'input.dropZone.sub')}</span>
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-400">Max 50MB</p>
                    </div>
                 </div>
               )}
             </div>
             
             {/* Background gradient for upload area */}
             {!videoFile && (
               <div className="absolute inset-0 z-0 bg-gradient-to-tr from-transparent via-transparent to-white/40 opacity-0 transition-opacity group-hover:opacity-100" />
             )}
          </div>

          {/* Text Area */}
          <div className="relative">
            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:shadow-neon transition-all duration-300">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t(language, 'input.placeholder')}
                className="min-h-[140px] w-full resize-none border-0 bg-transparent p-6 text-base leading-relaxed text-slate-700 placeholder:text-slate-300 focus:ring-0"
              />
              <div className="absolute bottom-4 right-6">
                 <div className={clsx(
                   "flex h-6 items-center rounded-full px-2.5 text-[10px] font-bold transition-colors",
                   prompt.length > 20 ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-400"
                 )}>
                   {prompt.length} chars
                 </div>
              </div>
            </div>
          </div>

          {/* External Info Toggle & Inputs */}
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white/40 transition-all duration-300 hover:bg-white/60">
            <div 
              className="flex cursor-pointer items-center justify-between p-5"
              onClick={() => setUseExternal(!useExternal)}
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  useExternal ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-500"
                )}>
                  <Globe size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">{t(language, 'input.external.title')}</h3>
                  <p className="text-xs text-slate-500">{t(language, 'input.external.desc')}</p>
                </div>
              </div>
              <div className={clsx(
                "relative h-6 w-11 rounded-full transition-colors duration-300",
                useExternal ? "bg-brand-500" : "bg-slate-200"
              )}>
                <div className={clsx(
                  "absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300",
                  useExternal ? "translate-x-5" : "translate-x-0"
                )} />
              </div>
            </div>

            <motion.div 
              initial={false}
              animate={{ height: useExternal ? 'auto' : 0, opacity: useExternal ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-4 top-4 text-slate-400" />
                  <textarea
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    placeholder={t(language, 'input.external.placeholder')}
                    className="w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 text-sm font-mono text-slate-600 shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500/50 placeholder:font-sans"
                    rows={3}
                  />
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50/50 p-3 text-xs text-blue-600">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{t(language, 'input.external.info')}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Area */}
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!prompt && !videoFile)}
              className={clsx(
                "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-8 py-4 font-bold text-white transition-all duration-300",
                isLoading || (!prompt && !videoFile)
                  ? "cursor-not-allowed bg-slate-200 text-slate-400"
                  : "bg-gradient-to-r from-brand-600 to-teal-500 shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-1 active:translate-y-0"
              )}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className="font-sans">{t(language, 'input.button.analyzing')}</span>
                </>
              ) : (
                <>
                  <span className="font-sans text-lg">{t(language, 'input.button.idle')}</span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <Wand2 size={14} className="transition-transform duration-500 group-hover:rotate-45" />
                  </div>
                </>
              )}
            </button>
          </div>
          
          {status === AppStatus.ERROR && (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center justify-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
               <AlertCircle size={16} />
               {t(language, 'input.error')}
             </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InputCard;

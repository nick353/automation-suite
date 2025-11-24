import React from 'react';
import { Workflow, Sparkles, Command, Languages } from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';
import clsx from 'clsx';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ language, setLanguage }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
      <header className="pointer-events-auto flex items-center justify-between rounded-full border border-white/40 bg-white/70 px-6 py-3 shadow-glass-lg backdrop-blur-xl transition-all duration-300 hover:bg-white/80 hover:shadow-xl w-full max-w-5xl">
        
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-n8n-primary to-n8n-accent text-white shadow-neon-n8n">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
            <Workflow size={20} className="relative z-10" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-sans text-lg font-bold tracking-tight text-slate-900 leading-tight">
              n8n Workflow <span className="text-gradient-primary">AI Builder</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/50">
             <Command size={12} className="opacity-50" />
             <span>Gemini 2.5 Flash</span>
           </div>
           
           {/* Language Switcher */}
           <div className="relative flex items-center rounded-full bg-slate-100 p-1 ring-1 ring-slate-200/50">
              <div 
                className={clsx(
                  "absolute h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out",
                  language === 'en' ? "translate-x-1" : "translate-x-[calc(100%+4px)]"
                )} 
              />
              <button 
                onClick={() => setLanguage('en')}
                className={clsx(
                  "relative z-10 flex items-center gap-1 px-3 py-1 text-xs font-bold transition-colors",
                  language === 'en' ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <span>EN</span>
              </button>
              <button 
                onClick={() => setLanguage('ja')}
                className={clsx(
                  "relative z-10 flex items-center gap-1 px-3 py-1 text-xs font-bold transition-colors",
                  language === 'ja' ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <span>JP</span>
              </button>
           </div>

           <div className="hidden h-4 w-px bg-slate-300 sm:block" />
           <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-brand-600">
             <Sparkles size={12} />
             <span>{t(language, 'header.subtitle')}</span>
           </div>
        </div>
      </header>
    </div>
  );
};

export default Header;

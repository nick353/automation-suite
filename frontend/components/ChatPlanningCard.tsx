import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, ArrowRight, Loader2, Sparkles, Edit3 } from 'lucide-react';
import { ChatMessage, AppStatus, Language } from '../types';
import { t } from '../utils/translations';
import clsx from 'clsx';

interface ChatPlanningCardProps {
  messages: ChatMessage[];
  status: AppStatus;
  language: Language;
  onSendMessage: (message: string) => void;
  onConfirmPlan: () => void;
}

const ChatPlanningCard: React.FC<ChatPlanningCardProps> = ({ messages, status, language, onSendMessage, onConfirmPlan }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const isGeneratingJson = status === AppStatus.GENERATING;
  const isWaitingForReply = status === AppStatus.ANALYZING;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-panel relative flex h-[700px] flex-col overflow-hidden rounded-[2.5rem] shadow-2xl ring-1 ring-white/40"
    >
      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-20 border-b border-white/30 bg-white/80 px-8 py-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand-500 to-teal-400 text-white shadow-neon">
                <Sparkles size={18} />
             </div>
             <div>
                <h2 className="font-sans text-lg font-bold text-slate-800">{t(language, 'chat.title')}</h2>
                <div className="flex items-center gap-1.5">
                   <span className="relative flex h-2 w-2">
                      <span className={clsx("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", isWaitingForReply ? "bg-brand-400" : "hidden")}></span>
                      <span className={clsx("relative inline-flex h-2 w-2 rounded-full", isWaitingForReply ? "bg-brand-500" : "bg-green-500")}></span>
                   </span>
                   <span className="text-xs font-medium text-slate-500">
                     {isWaitingForReply ? t(language, 'chat.status.thinking') : t(language, 'chat.status.online')}
                   </span>
                </div>
             </div>
          </div>
          
          <button
            onClick={onConfirmPlan}
            disabled={isGeneratingJson || isWaitingForReply}
            className={clsx(
              "group flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-white transition-all shadow-lg",
              isGeneratingJson 
                ? "cursor-wait bg-slate-400" 
                : "bg-gradient-to-r from-n8n-primary to-n8n-accent hover:shadow-n8n-primary/40 hover:-translate-y-0.5"
            )}
          >
            {isGeneratingJson ? (
               <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t(language, 'chat.button.constructing')}</span>
               </>
            ) : (
               <>
                 <span>{t(language, 'chat.button.confirm')}</span>
                 <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
               </>
            )}
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 px-8 pb-32 pt-28" ref={chatContainerRef}>
        <div className="mx-auto max-w-3xl space-y-8">
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              key={idx}
              className={clsx(
                "flex gap-5",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div className={clsx(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-md ring-2 ring-white",
                msg.role === 'user' 
                    ? "bg-slate-200 text-slate-600" 
                    : "bg-gradient-to-br from-brand-500 to-teal-600 text-white"
              )}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              
              {/* Bubble */}
              <div className={clsx(
                "group relative max-w-[85%] rounded-[20px] p-6 text-[15px] leading-relaxed shadow-sm transition-shadow hover:shadow-md",
                msg.role === 'user' 
                  ? "bg-white text-slate-700 rounded-tr-sm" 
                  : "bg-white/90 text-slate-800 rounded-tl-sm ring-1 ring-slate-100/50"
              )}>
                <div className="whitespace-pre-wrap font-body">{msg.content}</div>
                
                {/* Timestamp / Status (Fake) */}
                <div className={clsx(
                    "absolute bottom-2 text-[10px] opacity-0 transition-opacity group-hover:opacity-100",
                    msg.role === 'user' ? "left-4 text-slate-400" : "right-4 text-slate-400"
                )}>
                    {idx === messages.length - 1 ? 'Just now' : 'Read'}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isWaitingForReply && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex gap-5"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-md ring-2 ring-white">
                        <Bot size={18} />
                    </div>
                    <div className="flex items-center gap-1 rounded-[20px] rounded-tl-sm bg-white/80 px-6 py-5 shadow-sm ring-1 ring-slate-100">
                        <motion.div 
                            className="h-2 w-2 rounded-full bg-brand-400" 
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} 
                        />
                        <motion.div 
                            className="h-2 w-2 rounded-full bg-brand-400" 
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.1 }} 
                        />
                        <motion.div 
                            className="h-2 w-2 rounded-full bg-brand-400" 
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} 
                        />
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white/95 to-transparent p-6">
        <div className="relative mx-auto max-w-3xl">
          <div className="relative flex items-center rounded-[1.5rem] bg-white shadow-xl ring-1 ring-slate-200 transition-shadow focus-within:shadow-2xl focus-within:ring-brand-400">
             <div className="pl-5 text-slate-400">
                <Edit3 size={20} />
             </div>
             <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={t(language, 'chat.placeholder')}
                disabled={isWaitingForReply || isGeneratingJson}
                className="flex-1 bg-transparent py-5 pl-4 pr-16 text-base text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
             />
             <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isWaitingForReply || isGeneratingJson}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white transition-all hover:bg-brand-700 hover:scale-105 disabled:bg-slate-200 disabled:hover:scale-100"
                >
                    <Send size={18} className={clsx(input.trim() && "ml-0.5")} />
                </button>
             </div>
          </div>
          <p className="mt-3 text-center text-xs font-medium text-slate-400">
            {t(language, 'chat.hint')}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatPlanningCard;

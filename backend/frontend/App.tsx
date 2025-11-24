import React, { useState } from 'react';
import Header from './components/Header';
import InputCard from './components/InputCard';
import ChatPlanningCard from './components/ChatPlanningCard';
import ResultCard from './components/ResultCard';
import DeployCard from './components/DeployCard';
import { AppStatus, GenerationRequest, WorkflowData, ChatMessage, Language } from './types';
import { buildDescriptionFromHistory, generateWorkflow } from './services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from './utils/translations';

function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentRequest, setCurrentRequest] = useState<GenerationRequest | null>(null);
  const [language, setLanguage] = useState<Language>('ja'); // Default to Japanese

  const assistantMessage = (workflow: WorkflowData) => workflow.summary || t(language, 'result.subtitle');

  const handleAnalyze = async (request: GenerationRequest) => {
    setCurrentRequest(request);
    setStatus(AppStatus.ANALYZING);

    setWorkflowData(null);
    setChatHistory(
      request.prompt
        ? [{ role: 'user', content: request.prompt }]
        : [{ role: 'user', content: 'Here is my automation idea.' }],
    );

    try {
      const { workflow } = await generateWorkflow(request, language);
      setWorkflowData(workflow);
      setChatHistory((prev) => [...prev, { role: 'model', content: assistantMessage(workflow) }]);
      setStatus(AppStatus.PLANNING);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!currentRequest) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newHistory);

    setStatus(AppStatus.ANALYZING);

    try {
      const description = buildDescriptionFromHistory(currentRequest, newHistory);
      const { workflow } = await generateWorkflow(currentRequest, language, description);
      setWorkflowData(workflow);
      setChatHistory([...newHistory, { role: 'model', content: assistantMessage(workflow) }]);
      setStatus(AppStatus.PLANNING);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleConfirmPlan = async () => {
    if (!currentRequest) return;
    setStatus(AppStatus.GENERATING);

    try {
      const description = buildDescriptionFromHistory(currentRequest, chatHistory);
      const { workflow } = await generateWorkflow(currentRequest, language, description);
      setWorkflowData(workflow);
      setChatHistory((prev) => [...prev, { role: 'model', content: assistantMessage(workflow) }]);
      setStatus(AppStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
    }
  };

  const showInput =
    status === AppStatus.IDLE || status === AppStatus.ERROR || (status === AppStatus.ANALYZING && chatHistory.length === 0);
  const showChat = chatHistory.length > 0;
  const showResult = workflowData !== null;

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 selection:bg-brand-500 selection:text-white overflow-x-hidden">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-white" />
        
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-200/30 rounded-full blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-200/30 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-purple-100/30 rounded-full blur-[120px] animate-blob animation-delay-4000" />
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      </div>

      <Header language={language} setLanguage={setLanguage} />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-24 pt-32 sm:px-6">
        
        {/* Hero Section */}
        <AnimatePresence mode="wait">
          {showInput && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-16 text-center"
            >
               <h1 className="mb-6 font-sans text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                 {t(language, 'hero.title')} <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-teal-500 to-brand-600 bg-300% animate-gradient">
                    {t(language, 'hero.title.gradient')}
                 </span>
               </h1>
               <p className="mx-auto max-w-2xl text-lg text-slate-500 leading-relaxed whitespace-pre-line">
                 {t(language, 'hero.subtitle')}
               </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {showInput && (
              <InputCard 
                key="input"
                status={status} 
                language={language}
                onAnalyze={handleAnalyze} 
              />
            )}

            {showChat && (
              <ChatPlanningCard 
                key="chat"
                messages={chatHistory}
                status={status}
                language={language}
                onSendMessage={handleSendMessage}
                onConfirmPlan={handleConfirmPlan}
              />
            )}

            {showResult && (
              <div key="result" className="flex flex-col gap-4">
                 <ResultCard 
                  data={workflowData} 
                  show={true} 
                  language={language}
                />
                <DeployCard 
                  canDeploy={Boolean(workflowData)}
                  workflowJson={workflowData?.workflowJson ?? null}
                  language={language}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;

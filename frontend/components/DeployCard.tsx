import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, CheckCircle2, AlertTriangle, Lock, ExternalLink, Loader2 } from 'lucide-react';
import { DeployStatus, Language } from '../types';
import { t } from '../utils/translations';
import clsx from 'clsx';
import { deployWorkflow } from '../services/geminiService';

interface DeployCardProps {
  canDeploy: boolean;
  workflowJson: Record<string, any> | null;
  language: Language;
}

const DeployCard: React.FC<DeployCardProps> = ({ canDeploy, workflowJson, language }) => {
  const [status, setStatus] = useState<DeployStatus>(DeployStatus.IDLE);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const env = (import.meta as any).env || {};
  const appBase =
    env.VITE_N8N_APP_URL ||
    (typeof env.VITE_N8N_API_URL === 'string'
      ? env.VITE_N8N_API_URL.replace(/\/api\/?$/, '')
      : null);

  const handleDeploy = async () => {
    if (!workflowJson) return;
    if (!env.VITE_N8N_API_URL || !env.VITE_N8N_API_KEY) {
      setErrorMessage(t(language, 'deploy.error.config'));
      setStatus(DeployStatus.ERROR);
      return;
    }

    setErrorMessage(null);
    setStatus(DeployStatus.DEPLOYING);

    try {
      const result = await deployWorkflow(workflowJson);
      setWorkflowId(result.n8nWorkflowId || null);
      setStatus(DeployStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setErrorMessage(t(language, 'deploy.error.deployFailed'));
      setStatus(DeployStatus.ERROR);
    }
  };

  useEffect(() => {
    if (!canDeploy) {
      setStatus(DeployStatus.IDLE);
      setWorkflowId(null);
    }
  }, [canDeploy]);

  if (!canDeploy && status === DeployStatus.IDLE) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="glass-panel mt-8 rounded-[2.5rem] p-1 shadow-2xl ring-1 ring-white/40"
    >
      <div className="relative overflow-hidden rounded-[2.3rem] bg-white/50 p-8 backdrop-blur-xl sm:p-10">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
               <span className="font-sans text-xl font-bold text-slate-800">{t(language, 'deploy.step')}</span>
            </div>
            <div>
              <h2 className="font-sans text-2xl font-bold text-slate-800">{t(language, 'deploy.title')}</h2>
              <p className="text-sm font-medium text-slate-500">{t(language, 'deploy.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center transition-all hover:bg-white/60">
          
          {status === DeployStatus.SUCCESS ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex w-full max-w-lg flex-col items-center gap-6"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-lg shadow-green-200 ring-4 ring-white">
                <CheckCircle2 size={40} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800">{t(language, 'deploy.success.title')}</h3>
                <p className="text-slate-500">{t(language, 'deploy.success.desc')}</p>
              </div>
              
              <div className="flex w-full items-center justify-between rounded-xl border border-green-200 bg-green-50/50 px-4 py-3">
                 <span className="font-mono text-sm text-green-800">ID: {workflowId}</span>
                 <a
                   href={workflowId && appBase ? `${appBase}/workflow/${workflowId}` : '#'}
                   target="_blank"
                   rel="noreferrer"
                   className="flex items-center gap-1 text-sm font-bold text-green-700 hover:underline"
                 >
                    {t(language, 'deploy.open')} <ExternalLink size={14} />
                 </a>
              </div>
            </motion.div>
          ) : (
             <div className="flex flex-col items-center gap-6 w-full max-w-md">
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {t(language, 'deploy.desc')}
                </p>

                <button
                  onClick={handleDeploy}
                  disabled={status === DeployStatus.DEPLOYING || !workflowJson}
                  className={clsx(
                      "group relative w-full overflow-hidden rounded-2xl p-1 transition-all active:scale-[0.98]",
                      status === DeployStatus.DEPLOYING || !workflowJson ? "cursor-not-allowed opacity-80" : "hover:shadow-2xl hover:shadow-n8n-primary/30"
                  )}
                >
                  <div className={clsx(
                      "relative flex items-center justify-center gap-3 rounded-xl px-8 py-4 font-bold text-white transition-all",
                      status === DeployStatus.DEPLOYING ? "bg-slate-700" : "bg-gradient-to-br from-n8n-primary to-n8n-dark"
                  )}>
                      {status === DeployStatus.DEPLOYING ? (
                          <>
                              <Loader2 size={24} className="animate-spin text-white/70" />
                              <span>{t(language, 'deploy.button.deploying')}</span>
                          </>
                      ) : (
                          <>
                              <Rocket size={24} className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                              <span className="text-lg">{t(language, 'deploy.button.idle')}</span>
                          </>
                      )}
                  </div>
                </button>
                
                {status === DeployStatus.ERROR && (
                     <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-xs font-bold text-red-600">
                         <AlertTriangle size={14} />
                         <span>{errorMessage || t(language, 'deploy.error.deployFailed')}</span>
                     </div>
                )}
             </div>
          )}

          <div className="mt-8 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            <Lock size={12} />
            <span>{t(language, 'deploy.security')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DeployCard;

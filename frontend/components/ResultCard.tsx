import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Terminal, Puzzle, Tag } from 'lucide-react';
import { WorkflowData, Language } from '../types';
import { t } from '../utils/translations';
import clsx from 'clsx';

interface ResultCardProps {
  data: WorkflowData | null;
  show: boolean;
  language: Language;
}

interface WorkflowTreeNode {
  id: string;
  label: string;
  type?: string;
  children: WorkflowTreeNode[];
}

const ResultCard: React.FC<ResultCardProps> = ({ data, show, language }) => {
  const [copied, setCopied] = React.useState(false);

  if (!show || !data) return null;

  const workflowTree = React.useMemo((): WorkflowTreeNode[] => {
    const workflowJson = data.workflowJson as any;
    const nodes: any[] = Array.isArray(workflowJson?.nodes) ? workflowJson.nodes : [];
    const connections = workflowJson?.connections ?? {};
    if (nodes.length === 0) return [];

    const nodeMap = new Map<string, any>();
    nodes.forEach((node) => {
      if (node?.name) nodeMap.set(node.name, node);
    });

    const outgoing = new Map<string, Set<string>>();
    const incomingCount = new Map<string, number>();

    nodeMap.forEach((_value, key) => {
      outgoing.set(key, new Set());
      incomingCount.set(key, 0);
    });

    const addEdge = (from: string, to: string) => {
      if (!outgoing.has(from)) outgoing.set(from, new Set());
      outgoing.get(from)?.add(to);
      incomingCount.set(to, (incomingCount.get(to) ?? 0) + 1);
    };

    const parseConnections = (connObj: any, source: string) => {
      if (!connObj || typeof connObj !== 'object') return;
      Object.values(connObj).forEach((output: any) => {
        if (!Array.isArray(output)) return;
        output.forEach((branch) => {
          if (!Array.isArray(branch)) return;
          branch.forEach((link) => {
            if (link?.node) addEdge(source, link.node);
          });
        });
      });
    };

    Object.entries(connections).forEach(([source, connObj]) => {
      parseConnections(connObj as any, source);
    });

    const roots = nodes
      .map((n) => n.name)
      .filter((name) => (incomingCount.get(name) ?? 0) === 0);

    const visited = new Set<string>();

    const buildNode = (name: string): WorkflowTreeNode | null => {
      if (visited.has(name)) return null;
      visited.add(name);
      const node = nodeMap.get(name);
      const children = Array.from(outgoing.get(name) ?? []).map((child) => buildNode(child)).filter(Boolean) as WorkflowTreeNode[];
      return {
        id: name,
        label: node?.displayName || node?.name || name,
        type: node?.type,
        children
      };
    };

    const trees = roots.map((r) => buildNode(r)).filter(Boolean) as WorkflowTreeNode[];
    // If no roots (fully connected graph), fallback to first node as root
    if (trees.length === 0 && nodes[0]?.name) {
      const fallback = buildNode(nodes[0].name);
      if (fallback) trees.push(fallback);
    }
    return trees;
  }, [data.workflowJson]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data.workflowJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-panel mt-12 overflow-hidden rounded-[2.5rem] p-1 shadow-2xl ring-1 ring-white/40"
    >
      <div className="rounded-[2.3rem] bg-white/60 p-8 backdrop-blur-xl sm:p-10">
        
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
               <span className="font-sans text-xl font-bold text-slate-800">{t(language, 'result.step')}</span>
            </div>
            <div>
              <h2 className="font-sans text-2xl font-bold text-slate-800">{t(language, 'result.title')}</h2>
              <p className="text-sm font-medium text-slate-500">{t(language, 'result.subtitle')}</p>
            </div>
          </div>
          <div className="hidden rounded-full bg-brand-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 sm:block">
            {t(language, 'result.badge')}
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-12">
          
          {/* Left: Strategy & Templates (Bento-ish) */}
          <div className="flex flex-col gap-6 xl:col-span-5">
             {/* Summary Card */}
             <div className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-sm transition-all hover:bg-white/60">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                   <Terminal size={14} />
                   {t(language, 'result.strategy')}
                </h3>
                <p className="font-body text-sm leading-loose text-slate-600">
                  {data.summary}
                </p>
             </div>

             {/* Templates */}
             <div className="flex-1 rounded-3xl border border-white/60 bg-slate-50/30 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                   <Puzzle size={14} />
                   {t(language, 'result.patterns')}
                </h3>
                <div className="space-y-3">
                  {data.templates.map((template, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (idx * 0.1) }}
                      key={idx} 
                      className="group relative overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-brand-200"
                    >
                       {/* Progress bar background for relevance */}
                       <div className="absolute bottom-0 left-0 h-0.5 bg-brand-500/20" style={{ width: `${template.relevanceScore}%` }} />
                       
                       <div className="flex items-start justify-between mb-2">
                          <span className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{template.title}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                             {template.relevanceScore}%
                          </span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                             {template.category}
                          </span>
                          {template.tags.slice(0, 2).map(t => (
                             <span key={t} className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                <Tag size={10} /> {t}
                             </span>
                          ))}
                       </div>
                    </motion.div>
                  ))}
                </div>
             </div>
          </div>

          {/* Right: Workflow Tree + Code Block */}
          <div className="flex flex-col gap-4 xl:col-span-7">
            <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Terminal size={14} />
                  {t(language, 'result.workflowTree.title')}
                </div>
                <div className="text-[11px] font-semibold text-slate-400">
                  {Array.isArray(workflowTree) ? `${workflowTree.length} root${workflowTree.length === 1 ? '' : 's'}` : ''}
                </div>
              </div>
              {workflowTree.length === 0 ? (
                <p className="text-sm text-slate-500">{t(language, 'result.workflowTree.empty')}</p>
              ) : (
                <div className="space-y-4">
                  {workflowTree.map((tree) => (
                    <div key={tree.id} className="relative rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                      <WorkflowTreeView node={tree} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col overflow-hidden rounded-3xl bg-[#1e1e1e] shadow-2xl shadow-black/20 ring-1 ring-white/10">
            {/* Window Controls */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#252526] px-4 py-3">
               <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
               </div>
               <span className="text-xs font-medium text-gray-500 font-mono">workflow.json</span>
               <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
               >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? t(language, 'result.copied') : t(language, 'result.copy')}
               </button>
            </div>

            <div className="relative grow">
              <div className="dark-scroll h-[500px] overflow-auto p-6 font-mono text-xs leading-relaxed">
                 {/* Minimal Syntax Highlighting Simulation */}
                <pre className="text-gray-300">
                  {JSON.stringify(data.workflowJson, null, 2).split('\n').map((line, i) => {
                      // Basic highlighting logic for visual pop
                      const isKey = line.includes('":');
                      const isString = line.includes('"') && !isKey;
                      
                      return (
                        <div key={i} className="table-row">
                            <span className="table-cell select-none pr-4 text-right text-gray-600">{i + 1}</span>
                            <span className="table-cell">
                                {isKey ? (
                                    <span dangerouslySetInnerHTML={{ 
                                        __html: line.replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1"</span>:')
                                                    .replace(/: "([^"]+)"/g, ': <span class="text-orange-300">"$1"</span>')
                                                    .replace(/: ([0-9]+)/g, ': <span class="text-green-300">$1</span>')
                                                    .replace(/: (true|false)/g, ': <span class="text-purple-300">$1</span>')
                                    }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ 
                                        __html: line.replace(/"([^"]+)"/g, '<span class="text-orange-300">"$1"</span>')
                                    }} />
                                )}
                            </span>
                        </div>
                      );
                  })}
                </pre>
              </div>
              {/* Fade at bottom */}
              <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-[#1e1e1e] to-transparent" />
            </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

const WorkflowTreeView: React.FC<{ node: WorkflowTreeNode; depth?: number }> = ({ node, depth = 0 }) => {
  const hasChildren = node.children.length > 0;
  return (
    <div className="relative pl-6">
      {depth > 0 && (
        <span className="absolute left-0 top-3 h-full w-0.5 bg-gradient-to-b from-brand-200 to-slate-100" aria-hidden />
      )}
      <div className="relative flex items-start gap-3">
        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-brand-500 to-teal-400 shadow shadow-brand-200" />
        <div>
          <div className="text-sm font-bold text-slate-800">{node.label}</div>
          {node.type && <div className="text-[11px] uppercase tracking-wide text-slate-400">{node.type}</div>}
        </div>
      </div>
      {hasChildren && (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <WorkflowTreeView key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultCard;

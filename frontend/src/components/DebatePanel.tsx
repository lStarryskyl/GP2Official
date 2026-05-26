import React from 'react';
import { DebateArgument, AgentPersona } from '@/lib/api';
import { AgentAvatar } from './AgentAvatar';
import { CheckCircle2, AlertTriangle, Info, BookOpen } from 'lucide-react';

interface DebatePanelProps {
  argument: DebateArgument;
  agent: AgentPersona;
  isRebuttal?: boolean;
}

export const DebatePanel: React.FC<DebatePanelProps> = ({ argument, agent, isRebuttal = false }) => {
  const stanceConfig = {
    support: {
      color: 'bg-emerald-50 border-emerald-200',
      iconUrl: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    concern: {
      color: 'bg-red-50 border-red-200',
      iconUrl: <AlertTriangle className="w-4 h-4 text-red-600" />,
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-700 border-red-200'
    },
    neutral: {
      color: 'bg-slate-50 border-slate-200',
      iconUrl: <Info className="w-4 h-4 text-slate-600" />,
      text: 'text-slate-700',
      badge: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  };

  const config = stanceConfig[argument.stance] || stanceConfig.neutral;

  return (
    <div className={`relative flex gap-4 p-5 rounded-2xl border ${config.color} transition-all duration-300 hover:shadow-md ${isRebuttal ? 'ml-12' : ''}`}>
      {/* Decorative connecting line for rebuttals */}
      {isRebuttal && (
        <div className="absolute -left-6 top-10 w-6 h-px bg-slate-200"></div>
      )}

      {/* Avatar Sidebar */}
      <div className="flex flex-col items-center shrink-0">
        <AgentAvatar agent={agent} size="lg" />
        <div className="mt-3 w-0.5 h-full bg-slate-200/50 rounded-full" />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{agent.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${config.badge}`}>
              {config.iconUrl}
              <span className="capitalize">{argument.stance}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1">
              <span>Confidence:</span>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${argument.stance === 'support' ? 'bg-emerald-500' : argument.stance === 'concern' ? 'bg-red-500' : 'bg-slate-500'}`}
                  style={{ width: `${argument.confidence * 100}%` }}
                />
              </div>
              <span className="w-8 text-right">{Math.round(argument.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        <h4 className="text-lg font-bold text-slate-900 mb-3">{argument.title}</h4>
        
        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
          {argument.content}
        </div>

        {argument.evidence && (
          <div className="mt-4 p-3 bg-white/60 rounded-xl border border-white/40 shadow-sm flex gap-3 items-start">
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 italic">"{argument.evidence}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

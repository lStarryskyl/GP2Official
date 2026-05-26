import React from 'react';
import { AgentPersona } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AgentAvatarProps {
  agent: AgentPersona;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
  isThinking?: boolean;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  agent,
  size = 'md',
  showName = false,
  className,
  isThinking = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
  };

  const nameClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg font-medium',
  };

  return (
    <div 
      className={cn('flex items-center gap-3', className)}
      title={`${agent.name}: ${agent.system_prompt.split('\n')[1] || agent.system_prompt}`}
    >
      <div className="relative">
        <div
          className={cn(
            'rounded-full flex items-center justify-center shadow-sm relative z-10 transition-all duration-300',
            sizeClasses[size],
            agent.avatar_color,
            isThinking && 'animate-pulse ring-4 ring-purple-500/30'
          )}
        >
          {agent.emoji}
        </div>
        
        {/* Thinking indicator pulse rings */}
        {isThinking && (
          <>
            <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-30 z-0"></div>
          </>
        )}
      </div>

      {showName && (
        <div className="flex flex-col">
          <span className={cn('font-semibold text-slate-900', nameClasses[size])}>
            {agent.name}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {agent.focus_areas.slice(0, 2).join(' • ')}
          </span>
        </div>
      )}
    </div>
  );
};

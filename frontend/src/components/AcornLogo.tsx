import React from 'react';
import { Sparkles } from 'lucide-react';

interface AcornLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

export const AcornLogo: React.FC<AcornLogoProps> = ({ 
  size = 'md', 
  showText = true,
  className = '',
  animated = true
}) => {
  const sizeConfig = {
    sm: { icon: 'w-8 h-8', iconInner: 'w-4 h-4', text: 'text-lg', blur: 'blur-sm' },
    md: { icon: 'w-10 h-10', iconInner: 'w-5 h-5', text: 'text-xl', blur: 'blur-md' },
    lg: { icon: 'w-12 h-12', iconInner: 'w-6 h-6', text: 'text-2xl', blur: 'blur-lg' },
    xl: { icon: 'w-16 h-16', iconInner: 'w-8 h-8', text: 'text-3xl', blur: 'blur-xl' },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center gap-3 group ${className}`}>
      {/* Logo Icon */}
      <div className="relative">
        {/* Glow Effect */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl ${config.blur} opacity-40 ${
            animated ? 'group-hover:opacity-60 transition-opacity duration-300' : ''
          }`} 
        />
        
        {/* Main Icon */}
        <div 
          className={`relative ${config.icon} bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25 ${
            animated ? 'group-hover:scale-105 transition-transform duration-300' : ''
          }`}
        >
          {/* Acorn SVG Icon */}
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className={config.iconInner}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Acorn Cap */}
            <path 
              d="M7 9C7 9 7 6 12 6C17 6 17 9 17 9" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path 
              d="M5 10C5 10 5 7 12 7C19 7 19 10 19 10" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round"
              opacity="0.5"
            />
            
            {/* Acorn Body */}
            <path 
              d="M8 10C8 10 6 12 6 15C6 18 9 21 12 21C15 21 18 18 18 15C18 12 16 10 16 10" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            
            {/* Stem */}
            <path 
              d="M12 6V3" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            
            {/* Sparkle */}
            <circle cx="10" cy="14" r="1" fill="white" opacity="0.6" />
          </svg>
        </div>
        
        {/* Shine Effect */}
        <div 
          className={`absolute inset-0 ${config.icon} rounded-xl overflow-hidden ${
            animated ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-300' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <span 
          className={`font-bold ${config.text} bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent ${
            animated ? 'group-hover:from-amber-300 group-hover:via-orange-300 group-hover:to-amber-400 transition-all duration-300' : ''
          }`}
        >
          Acorn
        </span>
      )}
    </div>
  );
};

// Alternative Sparkle-based Logo
export const AcornLogoSparkle: React.FC<AcornLogoProps> = ({ 
  size = 'md', 
  showText = true,
  className = '',
  animated = true
}) => {
  const sizeConfig = {
    sm: { icon: 'w-8 h-8', iconInner: 'w-4 h-4', text: 'text-lg' },
    md: { icon: 'w-10 h-10', iconInner: 'w-5 h-5', text: 'text-xl' },
    lg: { icon: 'w-12 h-12', iconInner: 'w-6 h-6', text: 'text-2xl' },
    xl: { icon: 'w-16 h-16', iconInner: 'w-8 h-8', text: 'text-3xl' },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center gap-3 group ${className}`}>
      <div className="relative">
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl blur-lg opacity-50 ${
            animated ? 'group-hover:opacity-75 transition-opacity' : ''
          }`}
        />
        <div 
          className={`relative ${config.icon} bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg ${
            animated ? 'group-hover:scale-105 transition-transform' : ''
          }`}
        >
          <Sparkles className={`${config.iconInner} text-white`} />
        </div>
      </div>
      
      {showText && (
        <span className={`font-bold ${config.text} bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent`}>
          Acorn
        </span>
      )}
    </div>
  );
};

export default AcornLogo;

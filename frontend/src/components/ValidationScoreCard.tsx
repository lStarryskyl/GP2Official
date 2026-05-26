import React from 'react';
import { ShieldCheck, AlertTriangle, TrendingUp, Puzzle } from 'lucide-react';

interface ValidationScoreCardProps {
  label: string;
  score: number;
  category: 'feasibility' | 'completeness' | 'consistency' | 'risk' | 'overall';
}

const categoryConfig: Record<string, { icon: React.FC<{ className?: string }>; gradient: string; bg: string }> = {
  feasibility: { icon: ShieldCheck, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
  completeness: { icon: Puzzle, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
  consistency: { icon: TrendingUp, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50' },
  risk: { icon: AlertTriangle, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
  overall: { icon: ShieldCheck, gradient: 'from-slate-700 to-slate-900', bg: 'bg-slate-50' },
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getBarColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreLabel(score: number) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 50) return 'Needs Work';
  return 'Critical';
}

export const ValidationScoreCard: React.FC<ValidationScoreCardProps> = ({ label, score, category }) => {
  const config = categoryConfig[category] || categoryConfig.overall;
  const Icon = config.icon;
  const rounded = Math.round(score);

  return (
    <div className={`rounded-2xl border border-slate-200 p-5 ${config.bg} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-3xl font-bold ${getScoreColor(rounded)}`}>{rounded}</span>
        <span className="text-sm text-slate-400">/100</span>
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
          rounded >= 80 ? 'bg-emerald-100 text-emerald-700'
          : rounded >= 60 ? 'bg-amber-100 text-amber-700'
          : 'bg-red-100 text-red-700'
        }`}>
          {getScoreLabel(rounded)}
        </span>
      </div>

      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getBarColor(rounded)}`}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  );
};

export default ValidationScoreCard;

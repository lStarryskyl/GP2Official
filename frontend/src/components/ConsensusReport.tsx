import React from 'react';
import { ConsensusReport as IConsensusReport } from '@/lib/api';
import { ShieldCheck, Crosshair, Users, ArrowRight } from 'lucide-react';

interface ConsensusReportProps {
  report: IConsensusReport;
}

export const ConsensusReport: React.FC<ConsensusReportProps> = ({ report }) => {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-fuchsia-500 opacity-20 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-sm font-medium">
              <Users className="w-4 h-4" />
              Consensus Reached
            </div>
            <h3 className="text-2xl font-bold leading-tight">Executive Summary</h3>
            <p className="text-purple-100 text-base max-w-2xl leading-relaxed">
              {report.overall_summary}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shrink-0 w-full md:w-auto">
            <span className="text-sm font-medium text-purple-200 mb-1">Readiness Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black">{report.readiness_score}</span>
              <span className="text-xl text-purple-300 font-bold">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Final Verdict */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex gap-4 items-start">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-slate-700" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900 mb-2">Final Verdict</h4>
          <p className="text-slate-600">{report.final_verdict}</p>
        </div>
      </div>

      {/* Detailed Consensus Points */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-slate-900 px-1">Key Architectural Decisions</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.points.map((point, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-purple-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3 gap-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-purple-500" />
                  {point.topic}
                </h5>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  point.confidence > 0.8 ? 'bg-emerald-100 text-emerald-700' :
                  point.confidence > 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {Math.round(point.confidence * 100)}% Conf
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Agreed Position</span>
                  <p className="text-sm text-slate-700">{point.agreed_position}</p>
                </div>
                
                {point.dissenting_views.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Remaining Concerns</span>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      {point.dissenting_views.map((view, vIdx) => (
                        <li key={vIdx}>{view}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {point.action_items.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Action Items</span>
                    <div className="space-y-1.5">
                      {point.action_items.map((item, aIdx) => (
                        <div key={aIdx} className="flex gap-2 text-sm text-slate-700">
                          <ArrowRight className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

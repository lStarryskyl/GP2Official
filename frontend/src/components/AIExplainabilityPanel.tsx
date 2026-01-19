import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Brain, Target, AlertCircle } from 'lucide-react';

interface ExplanationProps {
  type: 'requirement' | 'audit' | 'task' | 'priority';
  data: {
    key_phrases?: string[];
    reasoning?: string;
    assumptions?: string[];
    confidence?: number;
    alternatives?: string[];
    detection_method?: string;
    factors?: string[];
  };
}

export const AIExplainabilityPanel: React.FC<ExplanationProps> = ({ type, data }) => {
  const [expanded, setExpanded] = useState(false);

  const getTitle = () => {
    switch (type) {
      case 'requirement':
        return 'How was this requirement generated?';
      case 'audit':
        return 'Why was this finding raised?';
      case 'task':
        return 'How were these tasks broken down?';
      case 'priority':
        return 'Why was this priority assigned?';
      default:
        return 'AI Explanation';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'requirement':
        return <Brain className="w-5 h-5" />;
      case 'audit':
        return <AlertCircle className="w-5 h-5" />;
      case 'task':
        return <Target className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-acorn-orange-600 bg-acorn-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-gradient-to-r from-acorn-blue-50 to-acorn-orange-50 rounded-lg border border-acorn-blue-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-acorn-blue-100 rounded-lg text-acorn-blue-600">
            {getIcon()}
          </div>
          <div className="text-left">
            <p className="font-semibold text-acorn-gray-900">{getTitle()}</p>
            <p className="text-sm text-acorn-gray-600">Click to see AI reasoning</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data.confidence !== undefined && (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(data.confidence)}`}>
              {data.confidence}% confident
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-acorn-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-acorn-gray-600" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-6 bg-white border-t border-acorn-blue-200 space-y-4">
          {/* Key Phrases */}
          {data.key_phrases && data.key_phrases.length > 0 && (
            <div>
              <h4 className="font-semibold text-acorn-gray-900 mb-2">Key Phrases Identified</h4>
              <div className="flex flex-wrap gap-2">
                {data.key_phrases.map((phrase, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-acorn-blue-100 text-acorn-blue-700 rounded-full text-sm"
                  >
                    "{phrase}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          {data.reasoning && (
            <div>
              <h4 className="font-semibold text-acorn-gray-900 mb-2">AI Reasoning</h4>
              <p className="text-acorn-gray-700 bg-acorn-gray-50 p-4 rounded-lg">
                {data.reasoning}
              </p>
            </div>
          )}

          {/* Detection Method */}
          {data.detection_method && (
            <div>
              <h4 className="font-semibold text-acorn-gray-900 mb-2">Detection Method</h4>
              <p className="text-acorn-gray-700">{data.detection_method}</p>
            </div>
          )}

          {/* Factors */}
          {data.factors && data.factors.length > 0 && (
            <div>
              <h4 className="font-semibold text-acorn-gray-900 mb-2">Contributing Factors</h4>
              <ul className="space-y-2">
                {data.factors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-acorn-blue-500 rounded-full mt-2" />
                    <span className="text-acorn-gray-700">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Assumptions */}
          {data.assumptions && data.assumptions.length > 0 && (
            <div>
              <h4 className="font-semibold text-acorn-gray-900 mb-2">Assumptions Made</h4>
              <ul className="space-y-2">
                {data.assumptions.map((assumption, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-acorn-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-acorn-gray-700">{assumption}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternatives */}
          {data.alternatives && data.alternatives.length > 0 && (
            <div>
              <h4 className="font-semibold text-acorn-gray-900 mb-2">Alternative Interpretations</h4>
              <ul className="space-y-2">
                {data.alternatives.map((alt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-acorn-gray-500">{idx + 1}.</span>
                    <span className="text-acorn-gray-700">{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback */}
          <div className="pt-4 border-t border-acorn-gray-200">
            <p className="text-sm text-acorn-gray-600 mb-2">Was this explanation helpful?</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium">
                Yes, helpful
              </button>
              <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
                Not helpful
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

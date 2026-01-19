import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Users, Sparkles, Target, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Persona {
  id: string;
  name: string;
  role: string;
  goals: string[];
  pain_points: string[];
  background: string;
}

interface PersonaGeneratorProps {
  projectId: string;
  onGenerated?: () => void;
}

export const PersonaGenerator: React.FC<PersonaGeneratorProps> = ({ projectId, onGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [count, setCount] = useState(3);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await api.generatePersonas(projectId, count);
      setPersonas(data);
      onGenerated?.();
    } catch (error) {
      console.error('Failed to generate personas:', error);
      alert('Failed to generate personas. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-blue-500 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Personas</h2>
            <p className="text-gray-600">AI-generated user personas for your project</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          >
            <option value={2}>2 Personas</option>
            <option value={3}>3 Personas</option>
            <option value={4}>4 Personas</option>
            <option value={5}>5 Personas</option>
          </select>
          
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white shadow-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Personas
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Personas Grid */}
      {personas.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="bg-white border-2 border-orange-200 rounded-2xl p-6 hover:shadow-xl hover:border-orange-400 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {persona.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{persona.name}</h3>
                  <p className="text-sm text-orange-600">{persona.role}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{persona.background}</p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">Goals</span>
                  </div>
                  <ul className="space-y-1">
                    {persona.goals.map((goal, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">Pain Points</span>
                  </div>
                  <ul className="space-y-1">
                    {persona.pain_points.map((pain, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{pain}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {personas.length === 0 && !isGenerating && (
        <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-blue-50 rounded-2xl border-2 border-dashed border-orange-200">
          <Users className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Personas Yet</h3>
          <p className="text-gray-600 mb-4">Generate AI-powered user personas to understand your target audience</p>
          <Button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-orange-500 to-blue-500 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Your First Personas
          </Button>
        </div>
      )}
    </div>
  );
};

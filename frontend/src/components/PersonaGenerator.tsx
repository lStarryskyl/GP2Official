import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Users, Sparkles, Target, Loader2, Plus, UserCircle, Brain, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface Persona {
  id: string;
  name: string;
  role: string;
  goals: string[];
  pain_points: string[];
  background: string;
}

interface UserStory {
  id: string;
  title: string;
  as_a: string;
  i_want: string;
  so_that: string;
  acceptance_criteria: string[];
  priority: 'high' | 'medium' | 'low';
}

interface PersonaGeneratorProps {
  projectId: string;
  onGenerated?: () => void;
}

export const PersonaGenerator: React.FC<PersonaGeneratorProps> = ({ projectId, onGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingStories, setIsGeneratingStories] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [count, setCount] = useState(3);
  const [activeTab, setActiveTab] = useState<'personas' | 'stories'>('personas');
  const [personaError, setPersonaError] = useState('');
  const [storyError, setStoryError] = useState('');

  const handleGeneratePersonas = async () => {
    setIsGenerating(true);
    setPersonaError('');
    try {
      const data = await api.generatePersonas(projectId, count);
      setPersonas(data);
      onGenerated?.();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'Failed to generate personas. Please try again.';
      setPersonaError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateUserStories = async () => {
    setIsGeneratingStories(true);
    setStoryError('');
    try {
      const data = await api.generateUserStories(projectId);
      setUserStories(data);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'Failed to generate user stories. Please try again.';
      setStoryError(msg);
    } finally {
      setIsGeneratingStories(false);
    }
  };

  const priorityColors = {
    high: { bg: 'rgba(239,68,68,0.2)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
    medium: { bg: 'rgba(212,175,55,0.2)', text: 'var(--blue-400)', border: 'rgba(212,175,55,0.3)' },
    low: { bg: 'rgba(59,130,246,0.2)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--blue-400), #b8962e)', boxShadow: '0 10px 25px -5px rgba(212,175,55,0.3)' }}>
            <Users className="w-7 h-7" style={{ color: 'var(--brand-900)' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Personas & User Stories</h2>
            <p className="text-gray-400">AI-generated user research for your project</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: 'var(--brand-900)' }}>
        <button
          onClick={() => setActiveTab('personas')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'personas' ? 'text-[var(--brand-900)] shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
          style={activeTab === 'personas' ? { background: 'linear-gradient(to right, var(--blue-400), #b8962e)' } : {}}
        >
          <UserCircle className="w-5 h-5" />
          User Personas
        </button>
        <button
          onClick={() => setActiveTab('stories')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'stories' ? 'text-[var(--brand-900)] shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
          style={activeTab === 'stories' ? { background: 'linear-gradient(to right, var(--blue-400), #b8962e)' } : {}}
        >
          <Brain className="w-5 h-5" />
          User Stories
        </button>
      </div>

      {/* Personas Tab */}
      {activeTab === 'personas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="px-4 py-2 rounded-lg text-white focus:outline-none"
                style={{ backgroundColor: 'var(--brand-900)', border: '1px solid var(--brand-700)' }}
              >
                <option value={2}>2 Personas</option>
                <option value={3}>3 Personas</option>
                <option value={4}>4 Personas</option>
                <option value={5}>5 Personas</option>
              </select>
            </div>
            
            <Button
              onClick={handleGeneratePersonas}
              disabled={isGenerating}
              className="font-semibold shadow-lg"
              style={{ background: 'linear-gradient(to right, var(--blue-400), #b8962e)', color: 'var(--brand-900)' }}
              data-testid="generate-personas-btn"
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

          {/* Error */}
          {personaError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={16} color="#ef4444" />
              <span style={{ fontSize: '13px', color: '#f87171', fontFamily: 'DM Sans, sans-serif' }}>{personaError}</span>
            </div>
          )}

          {/* Personas Grid */}
          {personas.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  className="rounded-2xl p-6 transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}
                  data-testid={`persona-card-${persona.id}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(to bottom right, var(--blue-400), #b8962e)' }}>
                      {persona.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{persona.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--blue-400)' }}>{persona.role}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{persona.background}</p>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4" style={{ color: '#60a5fa' }} />
                        <span className="text-xs font-semibold text-gray-300 uppercase">Goals</span>
                      </div>
                      <ul className="space-y-1">
                        {persona.goals.map((goal, idx) => (
                          <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                            <span style={{ color: 'var(--blue-400)' }} className="mt-1">•</span>
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4" style={{ color: '#f87171' }} />
                        <span className="text-xs font-semibold text-gray-300 uppercase">Pain Points</span>
                      </div>
                      <ul className="space-y-1">
                        {persona.pain_points.map((pain, idx) => (
                          <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                            <span style={{ color: '#f87171' }} className="mt-1">•</span>
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
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--brand-850)', border: '2px dashed var(--brand-700)' }}>
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--blue-400)' }} />
              <h3 className="text-lg font-semibold text-white mb-2">No Personas Yet</h3>
              <p className="text-gray-400 mb-4">Generate AI-powered user personas to understand your target audience</p>
              <Button
                onClick={handleGeneratePersonas}
                className="font-semibold"
                style={{ background: 'linear-gradient(to right, var(--blue-400), #b8962e)', color: 'var(--brand-900)' }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Your First Personas
              </Button>
            </div>
          )}
        </div>
      )}

      {/* User Stories Tab */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={handleGenerateUserStories}
              disabled={isGeneratingStories}
              className="font-semibold shadow-lg"
              style={{ background: 'linear-gradient(to right, var(--blue-400), #b8962e)', color: 'var(--brand-900)' }}
              data-testid="generate-stories-btn"
            >
              {isGeneratingStories ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate User Stories
                </>
              )}
            </Button>
          </div>

          {/* Error */}
          {storyError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={16} color="#ef4444" />
              <span style={{ fontSize: '13px', color: '#f87171', fontFamily: 'DM Sans, sans-serif' }}>{storyError}</span>
            </div>
          )}

          {/* User Stories Grid */}
          {userStories.length > 0 && (
            <div className="space-y-4">
              {userStories.map((story) => (
                <div
                  key={story.id}
                  className="rounded-2xl p-6"
                  style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}
                  data-testid={`story-card-${story.id}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="text-lg font-bold text-white">{story.title}</h3>
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold uppercase"
                      style={{ 
                        backgroundColor: priorityColors[story.priority].bg, 
                        color: priorityColors[story.priority].text,
                        border: `1px solid ${priorityColors[story.priority].border}`
                      }}
                    >
                      {story.priority}
                    </span>
                  </div>
                  
                  <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--brand-900)' }}>
                    <p className="text-gray-300">
                      <span className="font-semibold" style={{ color: 'var(--blue-400)' }}>As a</span> {story.as_a},
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold" style={{ color: 'var(--blue-400)' }}>I want</span> {story.i_want},
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold" style={{ color: 'var(--blue-400)' }}>So that</span> {story.so_that}.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Acceptance Criteria:</h4>
                    <ul className="space-y-1">
                      {story.acceptance_criteria.map((criteria, idx) => (
                        <li key={idx} className="text-sm text-gray-400 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: '#152238', color: 'var(--blue-400)' }}>{idx + 1}</span>
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {userStories.length === 0 && !isGeneratingStories && (
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--brand-850)', border: '2px dashed var(--brand-700)' }}>
              <Brain className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--blue-400)' }} />
              <h3 className="text-lg font-semibold text-white mb-2">No User Stories Yet</h3>
              <p className="text-gray-400 mb-4">Generate user stories based on your project requirements</p>
              <Button
                onClick={handleGenerateUserStories}
                className="font-semibold"
                style={{ background: 'linear-gradient(to right, var(--blue-400), #b8962e)', color: 'var(--brand-900)' }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate User Stories
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

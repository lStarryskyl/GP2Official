import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Users, Sparkles, Target, Loader2, Plus, UserCircle, Brain } from 'lucide-react';
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

  const handleGeneratePersonas = async () => {
    setIsGenerating(true);
    try {
      const data = await api.generatePersonas(projectId, count);
      setPersonas(data);
      onGenerated?.();
    } catch (error) {
      console.error('Failed to generate personas:', error);
      // Generate mock personas for demo
      const mockPersonas: Persona[] = Array.from({ length: count }, (_, i) => ({
        id: `persona_${i + 1}`,
        name: ['Alex Chen', 'Sarah Johnson', 'Michael Rivera', 'Emily Wong', 'David Kim'][i] || `User ${i + 1}`,
        role: ['Product Manager', 'Software Engineer', 'UX Designer', 'Project Lead', 'Business Analyst'][i] || 'Team Member',
        background: 'Experienced professional with 5+ years in the industry, focused on delivering value and improving team productivity.',
        goals: [
          'Streamline project planning processes',
          'Improve team collaboration and communication',
          'Reduce time spent on administrative tasks'
        ],
        pain_points: [
          'Manual tracking of project progress is time-consuming',
          'Difficulty in maintaining consistent documentation',
          'Lack of AI-powered insights for decision making'
        ]
      }));
      setPersonas(mockPersonas);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateUserStories = async () => {
    setIsGeneratingStories(true);
    try {
      const data = await api.generateUserStories(projectId);
      setUserStories(data);
    } catch (error) {
      console.error('Failed to generate user stories:', error);
      // Generate mock user stories for demo
      const mockStories: UserStory[] = [
        {
          id: 'story_1',
          title: 'Project Creation',
          as_a: 'Product Manager',
          i_want: 'to create new projects with AI-generated templates',
          so_that: 'I can quickly kickstart project planning',
          acceptance_criteria: ['Can create project with name and description', 'AI generates initial structure', 'Templates are customizable'],
          priority: 'high'
        },
        {
          id: 'story_2',
          title: 'Requirements Generation',
          as_a: 'Business Analyst',
          i_want: 'to generate requirements from project descriptions',
          so_that: 'I can save time on documentation',
          acceptance_criteria: ['AI extracts key requirements', 'Requirements are editable', 'Can export to various formats'],
          priority: 'high'
        },
        {
          id: 'story_3',
          title: 'Phase Navigation',
          as_a: 'Team Member',
          i_want: 'to navigate between project phases easily',
          so_that: 'I can track project progress efficiently',
          acceptance_criteria: ['Clear phase indicators', 'Progress tracking', 'Easy navigation'],
          priority: 'medium'
        }
      ];
      setUserStories(mockStories);
    } finally {
      setIsGeneratingStories(false);
    }
  };

  const priorityColors = {
    high: { bg: 'rgba(239,68,68,0.2)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
    medium: { bg: 'rgba(212,175,55,0.2)', text: '#4ade80', border: 'rgba(212,175,55,0.3)' },
    low: { bg: 'rgba(59,130,246,0.2)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #4ade80, #b8962e)', boxShadow: '0 10px 25px -5px rgba(212,175,55,0.3)' }}>
            <Users className="w-7 h-7" style={{ color: '#0a150e' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Personas & User Stories</h2>
            <p className="text-gray-400">AI-generated user research for your project</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: '#0a150e' }}>
        <button
          onClick={() => setActiveTab('personas')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'personas' ? 'text-[#0a150e] shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
          style={activeTab === 'personas' ? { background: 'linear-gradient(to right, #4ade80, #b8962e)' } : {}}
        >
          <UserCircle className="w-5 h-5" />
          User Personas
        </button>
        <button
          onClick={() => setActiveTab('stories')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'stories' ? 'text-[#0a150e] shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
          style={activeTab === 'stories' ? { background: 'linear-gradient(to right, #4ade80, #b8962e)' } : {}}
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
                style={{ backgroundColor: '#0a150e', border: '1px solid #1e4a28' }}
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
              style={{ background: 'linear-gradient(to right, #4ade80, #b8962e)', color: '#0a150e' }}
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

          {/* Personas Grid */}
          {personas.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  className="rounded-2xl p-6 transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: '#0f1f15', border: '1px solid #1e4a28' }}
                  data-testid={`persona-card-${persona.id}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(to bottom right, #4ade80, #b8962e)' }}>
                      {persona.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{persona.name}</h3>
                      <p className="text-sm" style={{ color: '#4ade80' }}>{persona.role}</p>
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
                            <span style={{ color: '#4ade80' }} className="mt-1">•</span>
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
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#0f1f15', border: '2px dashed #1e4a28' }}>
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#4ade80' }} />
              <h3 className="text-lg font-semibold text-white mb-2">No Personas Yet</h3>
              <p className="text-gray-400 mb-4">Generate AI-powered user personas to understand your target audience</p>
              <Button
                onClick={handleGeneratePersonas}
                className="font-semibold"
                style={{ background: 'linear-gradient(to right, #4ade80, #b8962e)', color: '#0a150e' }}
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
              style={{ background: 'linear-gradient(to right, #4ade80, #b8962e)', color: '#0a150e' }}
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

          {/* User Stories Grid */}
          {userStories.length > 0 && (
            <div className="space-y-4">
              {userStories.map((story) => (
                <div
                  key={story.id}
                  className="rounded-2xl p-6"
                  style={{ backgroundColor: '#0f1f15', border: '1px solid #1e4a28' }}
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
                  
                  <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: '#0a150e' }}>
                    <p className="text-gray-300">
                      <span className="font-semibold" style={{ color: '#4ade80' }}>As a</span> {story.as_a},
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold" style={{ color: '#4ade80' }}>I want</span> {story.i_want},
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold" style={{ color: '#4ade80' }}>So that</span> {story.so_that}.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Acceptance Criteria:</h4>
                    <ul className="space-y-1">
                      {story.acceptance_criteria.map((criteria, idx) => (
                        <li key={idx} className="text-sm text-gray-400 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: '#152238', color: '#4ade80' }}>{idx + 1}</span>
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
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#0f1f15', border: '2px dashed #1e4a28' }}>
              <Brain className="w-16 h-16 mx-auto mb-4" style={{ color: '#4ade80' }} />
              <h3 className="text-lg font-semibold text-white mb-2">No User Stories Yet</h3>
              <p className="text-gray-400 mb-4">Generate user stories based on your project requirements</p>
              <Button
                onClick={handleGenerateUserStories}
                className="font-semibold"
                style={{ background: 'linear-gradient(to right, #4ade80, #b8962e)', color: '#0a150e' }}
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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { api, DebateSession } from '@/lib/api';
import { AgentAvatar } from '@/components/AgentAvatar';
import { DebatePanel } from '@/components/DebatePanel';
import { ConsensusReport } from '@/components/ConsensusReport';
import {
  ArrowLeft,
  MessageSquare,
  PlayCircle,
  History,
  AlertCircle,
  Loader2,
  BrainCircuit,
  Settings
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

type Tab = 'current' | 'history';

export const AgentDebatePage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const ws = useWebSocket(projectId || '');
    const bottomRef = useRef<HTMLDivElement>(null);

    const [activeTab, setActiveTab] = useState<Tab>('current');
    const [sessions, setSessions] = useState<DebateSession[]>([]);
    const [currentSession, setCurrentSession] = useState<DebateSession | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');

    const loadSessions = useCallback(async () => {
        if (!projectId) return;
        try {
            setIsLoading(true);
            try {
                const project = await api.getProject(projectId);
                setProjectName(project.name || 'Project');
            } catch { /* ignore */ }

            const response = await api.getDebates(projectId);
            const loadedSessions = response.sessions || [];
            setSessions(loadedSessions);
            
            // If we don't have a current session running, show the latest completed one
            if (loadedSessions.length > 0 && !currentSession?.id) {
                setCurrentSession(loadedSessions[0]);
            }
        } catch (err: any) {
            console.error('Failed to load debate sessions', err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, currentSession?.id]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // WebSocket listener for live updates
    useEffect(() => {
        if (!ws.lastMessage) return;
        
        try {
            const msg = ws.lastMessage;
            if (msg.type === 'debate_update' && msg.data) {
                const updatedSession = msg.data as DebateSession;
                setCurrentSession(updatedSession);
                
                // Update in list if it exists, or add it
                setSessions(prev => {
                    const exists = prev.some(s => s.id === updatedSession.id);
                    if (exists) {
                        return prev.map(s => s.id === updatedSession.id ? updatedSession : s);
                    }
                    return [updatedSession, ...prev];
                });

                // Auto-scroll when new arguments arrive
                setTimeout(() => {
                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (e) {
            console.error('Error processing WS message', e);
        }
    }, [ws.lastMessage]);

    const handleStartDebate = async () => {
        if (!projectId || isStarting) return;
        try {
            setIsStarting(true);
            setError(null);
            
            // Starting the debate returns immediately, progress comes via WS
            await api.startDebate(projectId);
            setActiveTab('current');
            
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start debate. Ensure you have completed the planning phases first.');
        } finally {
            setIsStarting(false);
        }
    };

    const selectSession = (session: DebateSession) => {
        setCurrentSession(session);
        setActiveTab('current');
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
            </Layout>
        );
    }

    const isRunning = currentSession?.status === 'running' || currentSession?.status === 'synthesizing';

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                    <div className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <button
                                onClick={() => navigate(`/projects/${projectId}`)}
                                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to {projectName || 'Project'}
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveTab('current')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'current'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Live Debate
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'history'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <History className="w-4 h-4" />
                                    History ({sessions.length})
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <BrainCircuit className="w-7 h-7 text-purple-500" />
                                    AI Architectural Debate
                                </h1>
                                <p className="text-slate-500 mt-1 max-w-2xl">
                                    Watch distinct AI personas review your project plan, argue their perspectives, and synthesize a rigorous consensus.
                                </p>
                            </div>

                            <Button
                                onClick={handleStartDebate}
                                disabled={isStarting || isRunning}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20 px-6 py-5 rounded-xl h-auto"
                            >
                                {isStarting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                        <div className="text-left">
                                            <div className="font-bold">Initializing Agents...</div>
                                            <div className="text-xs text-purple-200 font-normal">Please wait</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle className="w-5 h-5 mr-3" />
                                        <div className="text-left">
                                            <div className="font-bold">Start New Debate</div>
                                            <div className="text-xs text-purple-200 font-normal">2 Rounds + Synthesis</div>
                                        </div>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Past Debates</h3>
                        {sessions.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No debate sessions yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session, idx) => {
                                    const isSelected = currentSession?.id === session.id;
                                    const date = new Date(session.created_at).toLocaleString();
                                    return (
                                        <button
                                            key={session.id}
                                            onClick={() => selectSession(session)}
                                            className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${isSelected
                                                    ? 'border-purple-400 bg-purple-50/50 shadow-sm ring-1 ring-purple-400/20'
                                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div>
                                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                                        Session #{sessions.length - idx}
                                                        {session.status === 'completed' && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700">Completed</span>}
                                                        {(session.status === 'running' || session.status === 'synthesizing') && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-100 text-blue-700 animate-pulse">Running</span>}
                                                        {session.status === 'failed' && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-100 text-red-700">Failed</span>}
                                                    </p>
                                                    <p className="text-sm text-slate-500 mt-1">{date}</p>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    {/* Miniature avatars */}
                                                    <div className="flex -space-x-2">
                                                        {session.participating_agents.map(agent => (
                                                            <div key={agent.id} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs ${agent.avatar_color} shadow-sm`} title={agent.name}>
                                                                {agent.emoji}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    {session.consensus && (
                                                        <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-center">
                                                            <div className="text-xs text-slate-500 font-medium">Readiness</div>
                                                            <div className="text-sm font-bold text-slate-900">{session.consensus.readiness_score}/100</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Current Debate UI */}
                {activeTab === 'current' && (
                    <>
                        {!currentSession ? (
                            <div className="bg-white border border-slate-200 rounded-2xl p-16 shadow-sm text-center">
                                <BrainCircuit className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Debates Yet</h3>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                    Start an architectural debate to have specialized AI agents review your plan, find vulnerabilities, and establish a consensus.
                                </p>
                                <Button
                                    onClick={handleStartDebate}
                                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg px-8 py-6 rounded-xl text-lg h-auto"
                                >
                                    <PlayCircle className="w-5 h-5 mr-2" />
                                    Launch Debate Engine
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Agent Activity Header */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-4 z-20 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Agents in Session</div>
                                        <div className="flex items-center gap-4">
                                            {currentSession.participating_agents.map(agent => (
                                                <AgentAvatar 
                                                    key={agent.id} 
                                                    agent={agent} 
                                                    size="sm" 
                                                    showName 
                                                    isThinking={currentSession.active_agent_id === agent.id}
                                                />
                                            ))}
                                            {/* Moderator Avatar */}
                                            {currentSession.status === 'synthesizing' && (
                                                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200">
                                                    <div className="relative">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm relative z-10 bg-slate-800 text-sm animate-pulse ring-4 ring-slate-500/30">
                                                            ⚖️
                                                        </div>
                                                        <div className="absolute inset-0 rounded-full bg-slate-400 animate-ping opacity-30 z-0"></div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-900">Lead Moderator</span>
                                                        <span className="text-[10px] text-slate-500 font-medium">Synthesizing...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] tracking-wider ${
                                            currentSession.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                            currentSession.status === 'failed' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {currentSession.status}
                                        </span>
                                        {currentSession.status !== 'completed' && currentSession.status !== 'failed' && (
                                            <span className="flex items-center text-slate-500">
                                                <Settings className="w-4 h-4 mr-1.5 animate-spin" />
                                                Processing
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Debate Rounds */}
                                <div className="space-y-12">
                                    {currentSession.rounds.map((round, rIdx) => (
                                        <div key={rIdx} className="space-y-6 relative">
                                            {/* Round Divider */}
                                            <div className="flex items-center gap-4 py-2">
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                                <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 font-bold text-sm tracking-widest uppercase shadow-inner">
                                                    {round.topic}
                                                </span>
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                            </div>

                                            {/* Arguments */}
                                            <div className="space-y-5">
                                                {round.arguments.map((arg, aIdx) => {
                                                    const agent = currentSession.participating_agents.find(a => a.id === arg.agent_id);
                                                    if (!agent) return null;
                                                    
                                                    // Add delay stagger for visual effect during live runs
                                                    return (
                                                        <div key={arg.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
                                                            <DebatePanel 
                                                                argument={arg} 
                                                                agent={agent} 
                                                                isRebuttal={round.round_number > 1}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Consensus Report */}
                                {currentSession.consensus && (
                                    <div className="pt-8 border-t border-slate-200 mt-12 animate-in fade-in zoom-in-95 duration-700">
                                        <ConsensusReport report={currentSession.consensus} />
                                    </div>
                                )}
                                
                                <div ref={bottomRef} className="h-4" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default AgentDebatePage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Sparkles, Rocket, Zap, Target, Code, Smartphone, Cloud, Box } from 'lucide-react';

const templateTypes = [
  { value: 'web_app', label: 'Web Application', icon: Code, color: 'from-blue-500 to-cyan-600', description: 'Full-featured web platform' },
  { value: 'mobile_app', label: 'Mobile App', icon: Smartphone, color: 'from-purple-500 to-pink-600', description: 'iOS & Android applications' },
  { value: 'api', label: 'API Service', icon: Zap, color: 'from-green-500 to-emerald-600', description: 'RESTful or GraphQL APIs' },
  { value: 'desktop', label: 'Desktop App', icon: Box, color: 'from-orange-500 to-red-600', description: 'Cross-platform desktop software' },
  { value: 'other', label: 'Other', icon: Cloud, color: 'from-gray-500 to-slate-600', description: 'Custom project type' },
];

export const NewProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'web_app',
    brief_text: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project = await api.createProject(formData);
      navigate(`/projects/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        {/* Floating background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-float" style={{ top: '10%', left: '5%' }}></div>
          <div className="absolute w-80 h-80 bg-orange-200/20 rounded-full blur-3xl animate-float" style={{ top: '50%', right: '10%', animationDelay: '2s' }}></div>
          <div className="absolute w-72 h-72 bg-yellow-200/20 rounded-full blur-3xl animate-float" style={{ bottom: '10%', left: '15%', animationDelay: '4s' }}></div>
        </div>

        {/* Header */}
        <div className="space-y-4 animate-slideDown">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </Button>
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg transform hover:scale-110 transition-transform">
              <Rocket className="w-8 h-8 text-white animate-bounce" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent">
              Plant a New Project Seed
            </h1>
            <p className="text-gray-600">Let's grow your idea into reality with AI-powered planning</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 py-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-4">
              <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500 ${
                currentStep >= step
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-orange-600 shadow-lg scale-110'
                  : 'bg-white border-gray-300'
              }`}>
                <span className={`text-sm font-bold transition-colors ${
                  currentStep >= step ? 'text-white' : 'text-gray-400'
                }`}>
                  {step}
                </span>
                {currentStep >= step && (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full animate-ping opacity-30"></div>
                )}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 rounded-full transition-all duration-500 ${
                  currentStep > step ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-amber-100 shadow-2xl transform hover:shadow-3xl transition-shadow">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Step 1: Basic Info */}
            <div className={`space-y-6 transition-all duration-500 ${
              currentStep === 1 ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-10 hidden'
            }`}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                <p className="text-gray-600">Give your project a name and description</p>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-600" />
                    Project Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., E-commerce Platform, Healthcare App"
                    required
                    className="w-full border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-600 group-focus-within:w-full transition-all duration-500"></div>
                </div>

                <div className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description</label>
                  <Input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief overview of your project"
                    className="w-full border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={nextStep}
                disabled={!formData.name}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
              >
                Continue
                <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
              </Button>
            </div>

            {/* Step 2: Project Type */}
            <div className={`space-y-6 transition-all duration-500 ${
              currentStep === 2 ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-10 hidden'
            }`}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Type</h2>
                <p className="text-gray-600">What type of software are you building?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templateTypes.map((template, index) => (
                  <div
                    key={template.value}
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, template_type: template.value })}
                      className={`relative w-full p-6 rounded-2xl border-2 transition-all duration-300 group hover:scale-105 ${
                        formData.template_type === template.value
                          ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
                      }`}
                    >
                      {formData.template_type === template.value && (
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition"></div>
                      )}
                      
                      <div className="relative flex items-start gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                          <template.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-gray-900 mb-1">{template.label}</h3>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        {formData.template_type === template.value && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Continue
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Step 3: Project Brief */}
            <div className={`space-y-6 transition-all duration-500 ${
              currentStep === 3 ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-10 hidden'
            }`}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Brief</h2>
                <p className="text-gray-600">Describe your project vision and requirements</p>
              </div>

              <div className="relative group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Tell us about your project
                </label>
                <textarea
                  value={formData.brief_text}
                  onChange={(e) => setFormData({ ...formData, brief_text: e.target.value })}
                  placeholder="Describe features, user needs, technical requirements, goals, and any specific details that will help our AI generate comprehensive requirements..."
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all resize-none"
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-400">
                  {formData.brief_text.length} characters
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">Pro Tip:</p>
                    <p>The more detailed your brief, the better our AI can generate requirements, architecture, and planning documents!</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Planting...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2 group-hover:translate-y-[-2px] transition-transform" />
                      Plant Project Seed
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(5deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(-5deg);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
          animation-fill-mode: both;
        }
        .animate-slideDown {
          animation: slideDown 0.6s ease-out;
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
};

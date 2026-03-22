import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, TreePine, Rocket, Zap, Target, Code, Smartphone, Cloud, Box, CheckCircle, Layers, FileText } from 'lucide-react';

const templateTypes = [
  { value: 'web_app',     label: 'Web Application', icon: Code,        color: 'from-[#4ade80] to-[#2d6a3f]',    bgColor: 'bg-[#4ade80]/10',   borderColor: 'border-[#4ade80]/30',   description: 'Full-featured web platform with modern frontend' },
  { value: 'mobile_app',  label: 'Mobile App',       icon: Smartphone,  color: 'from-[#86efac] to-[#4a7a56]',    bgColor: 'bg-[#86efac]/10',   borderColor: 'border-[#86efac]/30',   description: 'Native iOS & Android applications' },
  { value: 'api',         label: 'API Service',       icon: Zap,         color: 'from-emerald-500 to-teal-600',   bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', description: 'RESTful or GraphQL backend APIs' },
  { value: 'desktop',     label: 'Desktop App',       icon: Box,         color: 'from-[#fbbf24] to-[#d97706]',    bgColor: 'bg-[#fbbf24]/10',   borderColor: 'border-[#fbbf24]/30',   description: 'Cross-platform desktop software' },
  { value: 'other',       label: 'Other',             icon: Cloud,       color: 'from-[#6b9e7a] to-[#4a7a56]',    bgColor: 'bg-[#6b9e7a]/10',   borderColor: 'border-[#6b9e7a]/30',   description: 'Custom project type' },
];

const stepInfo = [
  { number: 1, title: 'Basics', icon: Target },
  { number: 2, title: 'Type',   icon: Layers },
  { number: 3, title: 'Brief',  icon: FileText },
];

export const NewProjectPage: React.FC = () => {
  const navigate                      = useNavigate();
  const [loading, setLoading]         = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData]       = useState({
    name:          '',
    description:   '',
    template_type: 'web_app',
    brief_text:    '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project = await api.createProject(formData);
      if (!project || !project.id) throw new Error('Invalid response from server');
      navigate(`/projects/${project.id}`);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      let message = 'Failed to create project. Please try again.';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        message = 'Server is waking up. Please wait a moment and try again.';
      } else if (!error.response) {
        message = 'Unable to connect to server. Please check your connection.';
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      }
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => { if (currentStep < 3) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-[#0a150e]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/projects')}
              className="inline-flex items-center gap-2 text-sm text-[#6b9e7a] hover:text-[#4ade80] transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Projects
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-[#4ade80] to-[#3d8a55] rounded-2xl shadow-lg shadow-[#4ade80]/25">
                  <TreePine className="w-8 h-8 text-[#0a150e]" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#e8f5e0]">
                    Plant a New Project
                  </h1>
                  <p className="text-[#6b9e7a] mt-1">Set up your project with AI-powered planning</p>
                </div>
              </div>

              {/* Live Preview Badge */}
              {formData.name && (
                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-[#0f1f15] rounded-xl border border-[#1e4a28]">
                  <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
                  <span className="text-sm text-[#6b9e7a]">Preview:</span>
                  <span className="font-semibold text-[#e8f5e0]">{formData.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 bg-[#0f1f15] rounded-2xl p-2 border border-[#1e4a28]/50">
            {stepInfo.map((step, index) => (
              <React.Fragment key={step.number}>
                <button
                  type="button"
                  onClick={() => {
                    if (step.number < currentStep) setCurrentStep(step.number);
                    else if (step.number === 2 && formData.name) setCurrentStep(2);
                    else if (step.number === 3 && formData.name) setCurrentStep(3);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 px-2 sm:px-4 rounded-xl transition-all ${
                    currentStep === step.number
                      ? 'bg-gradient-to-r from-[#4ade80] to-[#3d8a55] text-[#0a150e] shadow-lg shadow-[#4ade80]/25'
                      : currentStep > step.number
                      ? 'bg-[#4ade80]/15 text-[#4ade80]'
                      : 'text-[#6b9e7a] hover:text-[#a8d5a8]'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5 text-[#4ade80]" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline font-medium">{step.title}</span>
                  <span className="sm:hidden font-medium text-sm">{step.number}</span>
                </button>
                {index < stepInfo.length - 1 && (
                  <div className={`hidden sm:block w-8 h-0.5 mx-1 rounded-full transition-colors ${
                    currentStep > step.number ? 'bg-[#4ade80]/50' : 'bg-[#1e4a28]'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form */}
          <div className="bg-[#0f1f15] rounded-3xl border border-[#1e4a28]/50 overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Info */}
              <div className={`transition-all duration-300 ${currentStep === 1 ? 'block' : 'hidden'}`}>
                <div className="p-6 sm:p-8 border-b border-[#1e4a28]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#4ade80]/20 rounded-lg border border-[#4ade80]/30">
                      <Target className="w-5 h-5 text-[#4ade80]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#e8f5e0]">Basic Information</h2>
                  </div>
                  <p className="text-[#6b9e7a] ml-11">Give your project a name and brief description</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#a8d5a8] mb-2">
                      Project Name <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., E-commerce Platform, Healthcare App"
                      required
                      className="w-full h-12 text-lg bg-[#1a3520] border-[#1e4a28] text-[#e8f5e0] placeholder-[#6b9e7a] focus:border-[#4ade80] focus:ring-[#4ade80]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#a8d5a8] mb-2">Short Description</label>
                    <Input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="A brief one-line overview of your project"
                      className="w-full h-12 bg-[#1a3520] border-[#1e4a28] text-[#e8f5e0] placeholder-[#6b9e7a] focus:border-[#4ade80] focus:ring-[#4ade80]/20"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!formData.name}
                      className="w-full h-12 bg-gradient-to-r from-[#4ade80] to-[#3d8a55] hover:from-[#86efac] hover:to-[#4ade80] text-[#0a150e] font-semibold shadow-lg shadow-[#4ade80]/25 disabled:opacity-50 disabled:shadow-none"
                    >
                      Continue to Project Type
                      <TreePine className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2: Project Type */}
              <div className={`transition-all duration-300 ${currentStep === 2 ? 'block' : 'hidden'}`}>
                <div className="p-6 sm:p-8 border-b border-[#1e4a28]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#86efac]/20 rounded-lg border border-[#86efac]/30">
                      <Layers className="w-5 h-5 text-[#86efac]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#e8f5e0]">Project Type</h2>
                  </div>
                  <p className="text-[#6b9e7a] ml-11">What kind of software are you building?</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templateTypes.map((template) => (
                      <button
                        key={template.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, template_type: template.value })}
                        className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                          formData.template_type === template.value
                            ? `${template.borderColor} ${template.bgColor} shadow-md`
                            : 'border-[#1e4a28] bg-[#1a3520] hover:border-[#4ade80]/30 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center shadow-md`}>
                            <template.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#e8f5e0] mb-1">{template.label}</h3>
                            <p className="text-sm text-[#6b9e7a] line-clamp-2">{template.description}</p>
                          </div>
                        </div>
                        {formData.template_type === template.value && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="w-5 h-5 text-[#4ade80]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 border-[#1e4a28] text-[#6b9e7a] hover:border-[#4ade80]/50 hover:text-[#4ade80] bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 h-12 bg-gradient-to-r from-[#4ade80] to-[#3d8a55] hover:from-[#86efac] hover:to-[#4ade80] text-[#0a150e] font-semibold shadow-lg shadow-[#4ade80]/25"
                    >
                      Continue to Brief
                      <TreePine className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 3: Project Brief */}
              <div className={`transition-all duration-300 ${currentStep === 3 ? 'block' : 'hidden'}`}>
                <div className="p-6 sm:p-8 border-b border-[#1e4a28]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-[#e8f5e0]">Project Brief</h2>
                  </div>
                  <p className="text-[#6b9e7a] ml-11">Describe your project vision for AI-powered planning</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#a8d5a8] mb-2">
                      Tell us about your project
                    </label>
                    <textarea
                      value={formData.brief_text}
                      onChange={(e) => setFormData({ ...formData, brief_text: e.target.value })}
                      placeholder="Describe features, user needs, technical requirements, goals, and any specific details that will help our AI generate comprehensive requirements..."
                      rows={8}
                      className="w-full px-4 py-3 bg-[#1a3520] border border-[#1e4a28] rounded-xl text-[#e8f5e0] placeholder-[#6b9e7a] focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 transition-all resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-[#6b9e7a]">Optional but recommended</span>
                      <span className="text-xs text-[#6b9e7a]">{formData.brief_text.length} characters</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-[#4ade80]/10 rounded-xl border border-[#4ade80]/30">
                    <div className="p-1.5 bg-[#4ade80]/20 rounded-lg">
                      <Zap className="w-4 h-4 text-[#4ade80]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-[#4ade80] mb-1">Pro Tip</p>
                      <p className="text-[#6b9e7a]">The more detailed your brief, the better our AI can generate requirements, architecture, and planning documents!</p>
                    </div>
                  </div>

                  {/* Summary Preview */}
                  <div className="p-4 bg-[#1a3520] rounded-xl border border-[#1e4a28]">
                    <h4 className="text-sm font-semibold text-[#a8d5a8] mb-3">Project Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6b9e7a]">Name</span>
                        <span className="font-medium text-[#e8f5e0]">{formData.name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b9e7a]">Type</span>
                        <span className="font-medium text-[#e8f5e0]">
                          {templateTypes.find(t => t.value === formData.template_type)?.label || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b9e7a]">Brief</span>
                        <span className="font-medium text-[#e8f5e0]">
                          {formData.brief_text ? `${formData.brief_text.length} chars` : 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 border-[#1e4a28] text-[#6b9e7a] hover:border-[#4ade80]/50 hover:text-[#4ade80] bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-12 bg-gradient-to-r from-[#4ade80] to-[#3d8a55] hover:from-[#86efac] hover:to-[#4ade80] text-[#0a150e] font-semibold shadow-lg shadow-[#4ade80]/25 disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 mr-2 border-2 border-[#0a150e] border-t-transparent rounded-full animate-spin" />
                          Planting Project...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5 mr-2" />
                          Create Project
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

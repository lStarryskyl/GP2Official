import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, TreePine, Rocket, Zap, Target, Code, Smartphone, Cloud, Box, CheckCircle, Layers, FileText, Sparkles, X } from 'lucide-react';

const templateTypes = [
  { value: 'web_app',     label: 'Web Application', icon: Code,        color: 'from-[var(--blue-400)] to-[var(--blue-600)]',    bgColor: 'bg-[var(--blue-400)]/10',   borderColor: 'border-[var(--blue-400)]/30',   description: 'Full-featured web platform with modern frontend' },
  { value: 'mobile_app',  label: 'Mobile App',       icon: Smartphone,  color: 'from-[var(--blue-300)] to-[#4a7a56]',    bgColor: 'bg-[var(--blue-300)]/10',   borderColor: 'border-[var(--blue-300)]/30',   description: 'Native iOS & Android applications' },
  { value: 'api',         label: 'API Service',       icon: Zap,         color: 'from-blue-600 to-blue-500',   bgColor: 'bg-blue-900/20', borderColor: 'border-blue-500/30', description: 'RESTful or GraphQL backend APIs' },
  { value: 'desktop',     label: 'Desktop App',       icon: Box,         color: 'from-[var(--orange-400)] to-[var(--orange-600)]',    bgColor: 'bg-[var(--orange-400)]/10',   borderColor: 'border-[var(--orange-400)]/30',   description: 'Cross-platform desktop software' },
  { value: 'other',       label: 'Other',             icon: Cloud,       color: 'from-[var(--text-muted)] to-[#4a7a56]',    bgColor: 'bg-[var(--text-muted)]/10',   borderColor: 'border-[var(--text-muted)]/30',   description: 'Custom project type' },
];

const stepInfo = [
  { number: 1, title: 'Basics', icon: Target },
  { number: 2, title: 'Type',   icon: Layers },
  { number: 3, title: 'Brief',  icon: FileText },
];

// Built-in quick-start templates
const builtinTemplates = [
  { id: 'web_app',    label: 'Web Application',  icon: Code,       template_type: 'web_app',    description: 'Full-featured web platform with modern frontend',        brief: 'A modern web application with user authentication, dashboard, and RESTful API backend.' },
  { id: 'mobile_app', label: 'Mobile App',        icon: Smartphone, template_type: 'mobile_app', description: 'Native iOS & Android applications',                      brief: 'A cross-platform mobile app with push notifications, offline support, and cloud sync.' },
  { id: 'api',        label: 'API Service',        icon: Zap,        template_type: 'api',        description: 'RESTful or GraphQL backend APIs',                         brief: 'A scalable API service with authentication, rate limiting, documentation, and monitoring.' },
  { id: 'saas',       label: 'SaaS Platform',      icon: Rocket,     template_type: 'web_app',    description: 'Multi-tenant software-as-a-service platform',             brief: 'A multi-tenant SaaS platform with subscription billing, team management, and analytics.' },
  { id: 'ecommerce',  label: 'E-commerce',         icon: Box,        template_type: 'web_app',    description: 'Online store with products and checkout',                  brief: 'An e-commerce store with product catalog, cart, checkout, payments, and order management.' },
  { id: 'other',      label: 'Custom Project',     icon: Cloud,      template_type: 'other',      description: 'Start from scratch with a custom project type',           brief: '' },
];

export const NewProjectPage: React.FC = () => {
  const navigate                      = useNavigate();
  const [searchParams]                = useSearchParams();
  const [loading, setLoading]         = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [formData, setFormData]       = useState({
    name:          '',
    description:   '',
    template_type: 'web_app',
    brief_text:    '',
  });

  useEffect(() => {
    if (searchParams.get('template') === 'true') {
      setShowTemplatePicker(true);
    }
  }, [searchParams]);

  const applyTemplate = (tpl: typeof builtinTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      template_type: tpl.template_type,
      name: prev.name || tpl.label,
      description: prev.description || tpl.description,
      brief_text: prev.brief_text || tpl.brief,
    }));
    setShowTemplatePicker(false);
  };

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
      if (error.response?.status === 402) {
        if (window.confirm(`${message}\n\nGo to Billing to upgrade now?`)) {
          navigate('/billing');
          return;
        }
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => { if (currentStep < 3) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-[var(--brand-900)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/projects')}
              className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--blue-400)] transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Projects
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-[var(--blue-400)] to-[var(--blue-500)] rounded-2xl shadow-lg shadow-[var(--blue-400)]/25">
                  <TreePine className="w-8 h-8 text-[var(--brand-900)]" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                    Plant a New Project
                  </h1>
                  <p className="text-[var(--text-muted)] mt-1">Set up your project with AI-powered planning</p>
                </div>
              </div>

              {/* Live Preview Badge */}
              {formData.name && (
                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-[var(--brand-850)] rounded-xl border border-[var(--brand-700)]">
                  <div className="w-2 h-2 bg-[var(--blue-400)] rounded-full animate-pulse" />
                  <span className="text-sm text-[var(--text-muted)]">Preview:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{formData.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Template Picker */}
          {showTemplatePicker ? (
            <div className="mb-8 bg-[var(--brand-850)] rounded-2xl border border-[var(--brand-700)]/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[var(--blue-400)]" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Choose a Template</h2>
                </div>
                <button onClick={() => setShowTemplatePicker(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {builtinTemplates.map((tpl) => {
                  const TplIcon = tpl.icon;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="flex flex-col items-start gap-2 p-4 rounded-xl bg-[var(--brand-800)] border border-[var(--brand-700)] hover:border-[var(--blue-400)]/50 hover:bg-[var(--brand-750)] transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[var(--blue-400)]/15 border border-[var(--blue-400)]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TplIcon className="w-4 h-4 text-[var(--blue-400)]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)] text-sm">{tpl.label}</p>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{tpl.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowTemplatePicker(true)}
                className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--blue-400)] transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Start from a template
              </button>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 bg-[var(--brand-850)] rounded-2xl p-2 border border-[var(--brand-700)]/50">
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
                      ? 'bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] text-[var(--brand-900)] shadow-lg shadow-[var(--blue-400)]/25'
                      : currentStep > step.number
                      ? 'bg-[var(--blue-400)]/15 text-[var(--blue-400)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-muted)]'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5 text-[var(--blue-400)]" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline font-medium">{step.title}</span>
                  <span className="sm:hidden font-medium text-sm">{step.number}</span>
                </button>
                {index < stepInfo.length - 1 && (
                  <div className={`hidden sm:block w-8 h-0.5 mx-1 rounded-full transition-colors ${
                    currentStep > step.number ? 'bg-[var(--blue-400)]/50' : 'bg-[var(--brand-700)]'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form */}
          <div className="bg-[var(--brand-850)] rounded-3xl border border-[var(--brand-700)]/50 overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Info */}
              <div className={`transition-all duration-300 ${currentStep === 1 ? 'block' : 'hidden'}`}>
                <div className="p-6 sm:p-8 border-b border-[var(--brand-700)]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[var(--blue-400)]/20 rounded-lg border border-[var(--blue-400)]/30">
                      <Target className="w-5 h-5 text-[var(--blue-400)]" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Basic Information</h2>
                  </div>
                  <p className="text-[var(--text-muted)] ml-11">Give your project a name and brief description</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                      Project Name <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., E-commerce Platform, Healthcare App"
                      required
                      className="w-full h-12 text-lg bg-[var(--brand-750)] border-[var(--brand-700)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--blue-400)] focus:ring-[var(--blue-400)]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Short Description</label>
                    <Input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="A brief one-line overview of your project"
                      className="w-full h-12 bg-[var(--brand-750)] border-[var(--brand-700)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--blue-400)] focus:ring-[var(--blue-400)]/20"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!formData.name}
                      className="w-full h-12 bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] hover:from-[var(--blue-300)] hover:to-[var(--blue-400)] text-[var(--brand-900)] font-semibold shadow-lg shadow-[var(--blue-400)]/25 disabled:opacity-50 disabled:shadow-none"
                    >
                      Continue to Project Type
                      <TreePine className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2: Project Type */}
              <div className={`transition-all duration-300 ${currentStep === 2 ? 'block' : 'hidden'}`}>
                <div className="p-6 sm:p-8 border-b border-[var(--brand-700)]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[var(--blue-300)]/20 rounded-lg border border-[var(--blue-300)]/30">
                      <Layers className="w-5 h-5 text-[var(--blue-300)]" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Project Type</h2>
                  </div>
                  <p className="text-[var(--text-muted)] ml-11">What kind of software are you building?</p>
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
                            : 'border-[var(--brand-700)] bg-[var(--brand-750)] hover:border-[var(--blue-400)]/30 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center shadow-md`}>
                            <template.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-1">{template.label}</h3>
                            <p className="text-sm text-[var(--text-muted)] line-clamp-2">{template.description}</p>
                          </div>
                        </div>
                        {formData.template_type === template.value && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="w-5 h-5 text-[var(--blue-400)]" />
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
                      className="flex-1 h-12 border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)] bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 h-12 bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] hover:from-[var(--blue-300)] hover:to-[var(--blue-400)] text-[var(--brand-900)] font-semibold shadow-lg shadow-[var(--blue-400)]/25"
                    >
                      Continue to Brief
                      <TreePine className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 3: Project Brief */}
              <div className={`transition-all duration-300 ${currentStep === 3 ? 'block' : 'hidden'}`}>
                <div className="p-6 sm:p-8 border-b border-[var(--brand-700)]/30">
                  <div className="flex items-center gap-3 mb-2">
<<<<<<< HEAD
                    <div className="p-2 bg-blue-900/200/20 rounded-lg border border-blue-500/30">
=======
                    <div className="p-2 bg-blue-900/20 rounded-lg border border-blue-500/30">
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Project Brief</h2>
                  </div>
                  <p className="text-[var(--text-muted)] ml-11">Describe your project vision for AI-powered planning</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                      Tell us about your project
                    </label>
                    <textarea
                      value={formData.brief_text}
                      onChange={(e) => setFormData({ ...formData, brief_text: e.target.value })}
                      placeholder="Describe features, user needs, technical requirements, goals, and any specific details that will help our AI generate comprehensive requirements..."
                      rows={8}
                      className="w-full px-4 py-3 bg-[var(--brand-750)] border border-[var(--brand-700)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--blue-400)] focus:ring-2 focus:ring-[var(--blue-400)]/20 transition-all resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-[var(--text-muted)]">Optional but recommended</span>
                      <span className="text-xs text-[var(--text-muted)]">{formData.brief_text.length} characters</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-[var(--blue-400)]/10 rounded-xl border border-[var(--blue-400)]/30">
                    <div className="p-1.5 bg-[var(--blue-400)]/20 rounded-lg">
                      <Zap className="w-4 h-4 text-[var(--blue-400)]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-[var(--blue-400)] mb-1">Pro Tip</p>
                      <p className="text-[var(--text-muted)]">The more detailed your brief, the better our AI can generate requirements, architecture, and planning documents!</p>
                    </div>
                  </div>

                  {/* Summary Preview */}
                  <div className="p-4 bg-[var(--brand-750)] rounded-xl border border-[var(--brand-700)]">
                    <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Project Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Name</span>
                        <span className="font-medium text-[var(--text-primary)]">{formData.name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Type</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {templateTypes.find(t => t.value === formData.template_type)?.label || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Brief</span>
                        <span className="font-medium text-[var(--text-primary)]">
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
                      className="flex-1 h-12 border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)] bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-12 bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] hover:from-[var(--blue-300)] hover:to-[var(--blue-400)] text-[var(--brand-900)] font-semibold shadow-lg shadow-[var(--blue-400)]/25 disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 mr-2 border-2 border-[var(--brand-900)] border-t-transparent rounded-full animate-spin" />
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

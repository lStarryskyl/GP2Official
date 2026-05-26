import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, ArrowRight, ChevronDown, ChevronUp,
  ClipboardList, Search, FileText, CheckCircle2,
  Layers, Code2, GitBranch, DollarSign, AlertTriangle,
  LayoutDashboard, BookOpen, Users, Shield, TrendingUp,
  Clock, Target, CheckSquare, Lightbulb, Database,
  BarChart3, Lock, Globe, Cpu, ArrowLeft,FlaskConical,
} from 'lucide-react';
import { AcornLogo } from '../components/AcornLogo';

// ─── Phase definitions ────────────────────────────────────────────────────────
const PHASES = [
  {
    id: 'planning',
    step: 1,
    icon: ClipboardList,
    color: '#1A6FD4',
    title: 'Project Planning',
    tagline: 'Define scope, goals, and success metrics before writing a single line of code.',
    what: 'Project planning is the foundation of every successful software project. It establishes the why, what, and how — aligning stakeholders around a shared vision before any development begins.',
    why: 'Projects without proper planning are 3× more likely to fail. Planning surfaces risks early, prevents scope creep, and ensures every team member understands their role and the outcome they\'re working toward.',
    acornDoes: [
      'Generates a comprehensive project brief from your description',
      'Defines scope boundaries and out-of-scope items',
      'Identifies key stakeholders and their roles',
      'Produces a high-level milestone roadmap',
      'Estimates overall project complexity and team size',
    ],
    keyArtifacts: ['Project Charter', 'Scope Statement', 'Stakeholder Register', 'High-Level Roadmap', 'Resource Plan'],
    bestPractices: [
      'Involve all key stakeholders in the planning phase — not just technical leads',
      'Define "done" for every deliverable before work starts',
      'Build a realistic buffer (20-30%) into time estimates',
      'Document assumptions and constraints explicitly',
      'Establish a change management process from day one',
    ],
    duration: '1-2 weeks',
    complexity: 'Medium',
    common_mistakes: [
      'Skipping stakeholder alignment and discovering conflicts late',
      'Over-committing to fixed deadlines before understanding scope',
      'Treating the plan as immutable instead of a living document',
    ],
  },
  {
    id: 'feasibility',
    step: 2,
    icon: Search,
    color: '#2d88e8',
    title: 'Feasibility Study',
    tagline: 'Validate that your project is technically, financially, and operationally viable.',
    what: 'A feasibility study objectively evaluates whether a proposed project can be successfully completed given the constraints of budget, time, technology, and organizational capacity.',
    why: 'Building the wrong product is the most expensive mistake in software. Feasibility analysis protects organizations from investing months of effort into projects that are technically impossible, financially unviable, or solving problems the market doesn\'t have.',
    acornDoes: [
      'Performs technical feasibility analysis against current technology landscape',
      'Generates economic feasibility with cost-benefit projections',
      'Assesses operational feasibility (team skills, infrastructure)',
      'Identifies legal and regulatory constraints',
      'Produces a go/no-go recommendation with supporting rationale',
    ],
    keyArtifacts: ['Feasibility Report', 'Cost-Benefit Analysis', 'Technical Assessment', 'Risk Inventory', 'Go/No-Go Decision Matrix'],
    bestPractices: [
      'Be brutally honest — a "no-go" now saves massive cost later',
      'Consult technical experts for complex infrastructure decisions',
      'Model multiple budget scenarios (conservative, base, optimistic)',
      'Validate assumptions with real market or user data',
      'Document feasibility criteria so the decision is auditable',
    ],
    duration: '1-2 weeks',
    complexity: 'High',
    common_mistakes: [
      'Conducting feasibility after major commitments are already made',
      'Only assessing technical feasibility while ignoring financial viability',
      'Letting optimism bias inflate projected benefits',
    ],
  },
  {
    id: 'requirements',
    step: 3,
    icon: FileText,
    color: '#3d8fe0',
    title: 'Requirements Gathering',
    tagline: 'Capture every functional and non-functional requirement with precision.',
    what: 'Requirements gathering is the systematic process of discovering, documenting, and validating what a system must do (functional requirements) and how well it must do it (non-functional requirements like performance, security, and scalability).',
    why: 'The cost of fixing a requirements defect found in production is 100× higher than fixing it during the requirements phase. Clear requirements prevent misunderstandings, reduce rework, and form the basis for accurate testing and acceptance criteria.',
    acornDoes: [
      'Extracts structured requirements from your project description',
      'Categorizes by functional, non-functional, and technical requirements',
      'Assigns priority levels (must-have, should-have, nice-to-have)',
      'Generates acceptance criteria for each requirement',
      'Creates a Requirements Traceability Matrix (RTM)',
    ],
    keyArtifacts: ['Software Requirements Specification (SRS)', 'Use Case Diagrams', 'User Stories', 'Acceptance Criteria', 'Traceability Matrix'],
    bestPractices: [
      'Use the MoSCoW method (Must/Should/Could/Won\'t) for prioritization',
      'Write requirements from the user\'s perspective, not the system\'s',
      'Every requirement should be testable — if you can\'t test it, rewrite it',
      'Version control your requirements document',
      'Conduct formal review sessions with domain experts and end users',
    ],
    duration: '2-4 weeks',
    complexity: 'High',
    common_mistakes: [
      'Writing vague requirements like "the system should be fast"',
      'Gathering requirements only from managers, not actual end users',
      'Failing to document what the system will NOT do',
    ],
  },
  {
    id: 'validation',
    step: 4,
    icon: CheckCircle2,
    color: '#1A6FD4',
    title: 'Validation & Testing Strategy',
    tagline: 'Define how you will verify that what you build matches what was required.',
    what: 'Validation ensures the product being built is the right product (are we building what users actually need?), while verification ensures the product is built correctly (does it meet the specification?). This phase creates the testing strategy that will run throughout development.',
    why: 'Testing as an afterthought is one of the most costly mistakes in software development. Projects that define validation criteria upfront ship 40% fewer bugs and achieve significantly higher user satisfaction scores.',
    acornDoes: [
      'Creates a comprehensive test strategy document',
      'Defines test levels (unit, integration, system, acceptance)',
      'Generates test cases from requirements',
      'Identifies edge cases and boundary conditions',
      'Plans non-functional testing (load, security, usability)',
    ],
    keyArtifacts: ['Test Strategy Document', 'Test Plan', 'Test Cases', 'QA Process Definition', 'Acceptance Test Criteria'],
    bestPractices: [
      'Shift testing left — start planning tests during requirements, not after coding',
      'Automate regression tests from sprint one',
      'Define acceptance criteria in the "Given-When-Then" format',
      'Include non-functional test benchmarks (e.g., page load < 2s)',
      'Plan for security penetration testing before launch',
    ],
    duration: '1-2 weeks',
    complexity: 'Medium',
    common_mistakes: [
      'Treating QA as a final gate rather than a continuous process',
      'Only testing happy paths and ignoring error scenarios',
      'Not involving QA engineers in the design phase',
    ],
  },
  {
    id: 'design',
    step: 5,
    icon: Layers,
    color: '#2d88e8',
    title: 'System Design',
    tagline: 'Architect the technical foundation that everything else is built on.',
    what: 'System design translates requirements into a technical blueprint. It covers architecture patterns, database design, API contracts, security model, infrastructure planning, and the interfaces between all system components.',
    why: 'Poor architecture is one of the leading causes of technical debt. A well-designed system is maintainable, scalable, and secure. The cost of changing fundamental architecture decisions after the system is built is enormous.',
    acornDoes: [
      'Recommends architecture patterns (microservices, monolith, serverless, etc.)',
      'Generates database schema and Entity-Relationship Diagrams',
      'Designs REST API specifications with all endpoints',
      'Produces system context and component diagrams',
      'Defines integration points with external services',
    ],
    keyArtifacts: ['Architecture Decision Records (ADRs)', 'System Context Diagram', 'Database Schema', 'API Specification', 'Infrastructure Plan'],
    bestPractices: [
      'Document every significant architecture decision and its rationale (ADRs)',
      'Design for the scale you expect in 18 months, not today',
      'Apply separation of concerns — each component should have one responsibility',
      'Plan security at the architecture level, not as an add-on',
      'Get architecture reviewed by external engineers before committing',
    ],
    duration: '2-4 weeks',
    complexity: 'Very High',
    common_mistakes: [
      'Over-engineering for scale that will never materialize',
      'Choosing technology based on trends rather than requirements',
      'Ignoring data migration strategy in the design phase',
    ],
  },
  {
    id: 'development',
    step: 6,
    icon: Code2,
    color: '#F97316',
    title: 'Development Phase',
    tagline: 'Build the system with engineering excellence and consistent standards.',
    what: 'The development phase is where the system design is implemented as working software. Modern development follows agile sprints, with continuous integration and continuous delivery (CI/CD) pipelines ensuring code quality at every step.',
    why: 'Development is where plans meet reality. Projects with clear coding standards, code review processes, and automated testing pipelines produce software that is significantly more reliable and easier to maintain.',
    acornDoes: [
      'Generates project scaffolding and folder structure',
      'Produces coding standards and best practice guidelines',
      'Creates CI/CD pipeline configuration templates',
      'Suggests appropriate tech stack based on requirements',
      'Generates API implementation patterns and data models',
    ],
    keyArtifacts: ['Source Code Repository', 'CI/CD Pipeline', 'Code Review Guidelines', 'Tech Stack Documentation', 'Development Runbook'],
    bestPractices: [
      'Write code for the next engineer, not the computer — clarity over cleverness',
      'Every feature starts with a test (TDD or at minimum test-first)',
      'No merge without code review — even senior engineers benefit from review',
      'Keep PRs small (< 400 lines) for effective review',
      'Track technical debt explicitly and allocate time to address it each sprint',
    ],
    duration: '4-24 weeks',
    complexity: 'Very High',
    common_mistakes: [
      'Skipping code review under time pressure',
      'Accumulating technical debt without a repayment plan',
      'Not documenting complex business logic in the code',
    ],
  },
  {
    id: 'tasks',
    step: 7,
    icon: GitBranch,
    color: '#fb9042',
    title: 'Task Management',
    tagline: 'Break down the work into sprint-ready tasks with clear ownership and estimates.',
    what: 'Effective task management breaks large epics into granular, actionable user stories and development tasks. Each task should be completable within one sprint and have a clear definition of done, owner, and time estimate.',
    why: 'Without structured task management, work becomes invisible, estimates are guesses, and progress is unmeasurable. Teams using structured task management deliver projects 35% closer to original estimates.',
    acornDoes: [
      'Breaks requirements into sprint-ready development tasks',
      'Estimates effort in story points and hours',
      'Identifies task dependencies and critical path',
      'Assigns priority and category to each task',
      'Generates a phased delivery roadmap',
    ],
    keyArtifacts: ['Product Backlog', 'Sprint Plans', 'Task Dependency Map', 'Velocity Baseline', 'Delivery Roadmap'],
    bestPractices: [
      'Write tasks as user stories: "As a [user], I want [feature] so that [benefit]"',
      'Never estimate tasks over 8 hours — break them down further',
      'Maintain a prioritized backlog, not a wish list',
      'Track actual vs estimated hours to improve future estimates',
      'Review and refine backlog every sprint, not just at project start',
    ],
    duration: 'Ongoing throughout development',
    complexity: 'Medium',
    common_mistakes: [
      'Tasks that are too vague to estimate or execute without clarification',
      'Not tracking blockers explicitly in the task board',
      'Marking tasks "done" without meeting the definition of done',
    ],
  },
  {
    id: 'cost',
    step: 8,
    icon: DollarSign,
    color: '#F97316',
    title: 'Cost & Benefit Analysis',
    tagline: 'Quantify investment, ROI, and the financial case for every project decision.',
    what: 'Cost and benefit analysis provides a rigorous financial view of the project — what it costs to build, maintain, and operate, versus the quantifiable benefits it delivers through revenue, savings, or strategic value.',
    why: 'Software projects that lack financial analysis frequently exceed budgets by 40-200%. A strong cost-benefit framework enables informed go/no-go decisions, helps prioritize features by ROI, and creates accountability for spending.',
    acornDoes: [
      'Estimates total development cost from task hours and team roles',
      'Models ongoing operational costs (hosting, licenses, support)',
      'Projects benefits: revenue uplift, cost savings, efficiency gains',
      'Calculates ROI, NPV, and payback period',
      'Compares build vs buy vs open-source options',
    ],
    keyArtifacts: ['Cost Breakdown Structure', 'ROI Analysis', 'Budget Forecast', 'Payback Period Model', 'TCO (Total Cost of Ownership)'],
    bestPractices: [
      'Always include ongoing operational costs, not just build cost',
      'Model a conservative, base, and optimistic scenario for benefits',
      'Revisit cost estimates every sprint — reality changes plans',
      'Get sign-off from finance on all major cost assumptions',
      'Track actual spend weekly against the budget forecast',
    ],
    duration: '1 week + ongoing tracking',
    complexity: 'High',
    common_mistakes: [
      'Underestimating post-launch operational and maintenance costs',
      'Calculating benefits without a clear measurement plan',
      'Not accounting for opportunity cost of the team\'s time',
    ],
  },
  {
    id: 'risks',
    step: 9,
    icon: AlertTriangle,
    color: '#fb9042',
    title: 'Risk Analysis',
    tagline: 'Identify, quantify, and mitigate every threat to project success before it strikes.',
    what: 'Risk analysis systematically identifies potential threats to the project — technical, financial, operational, legal, and human — assigns probability and impact scores, and develops mitigation strategies for each.',
    why: 'Unmanaged risks become incidents. Organizations that conduct formal risk analysis experience 60% fewer project failures. Risks identified early cost 10× less to address than risks discovered in production.',
    acornDoes: [
      'Generates a comprehensive risk register from project context',
      'Scores risks by probability × impact for prioritization',
      'Creates mitigation and contingency plans for each risk',
      'Flags security risks using OWASP and STRIDE frameworks',
      'Identifies regulatory and compliance risks',
    ],
    keyArtifacts: ['Risk Register', 'Risk Heat Map', 'Mitigation Plans', 'Contingency Budget', 'Risk Review Schedule'],
    bestPractices: [
      'Review the risk register at every sprint retrospective',
      'Assign a specific owner to every risk',
      'Distinguish between risks (uncertain future events) and issues (problems that have happened)',
      'Build contingency budget (10-20% of project cost) for top risks',
      'Treat security risks with higher impact scores by default',
    ],
    duration: '1 week + ongoing review',
    complexity: 'High',
    common_mistakes: [
      'Creating a risk register and never reviewing it again',
      'Identifying risks without assigning owners or mitigation owners',
      'Ignoring "low probability, catastrophic impact" risks',
    ],
  },
  {
    id: 'testing',
    step: 10,
    icon: FlaskConical,
    color: '#fb9042',
    title: 'Testing & Quality Assurance',
    tagline: 'Generate synthetic test data and audit requirement coverage automatically.',
    what: 'The testing phase uses AI to generate comprehensive test scenarios and synthetic test data from functional requirements. It then performs a semantic coverage audit to identify orphaned requirements that have no corresponding test cases, ensuring complete traceability between what was specified and what is tested.',
    why: 'Projects that defer testing strategy to the end ship 3× more defects. By generating test scenarios directly from requirements, teams catch specification gaps before a single line of code is written. Automated gap analysis ensures nothing falls through the cracks.',
    acornDoes: [
      'Generates positive, negative, edge-case, and boundary test scenarios from requirements',
      'Produces synthetic, privacy-compliant test datasets in JSON and CSV formats',
      'Performs semantic coverage audit comparing requirements against test scenarios',
      'Identifies orphaned requirements with zero test coverage',
      'Provides actionable recommendations to close coverage gaps',
    ],
    keyArtifacts: ['Test Scenario Catalog', 'Synthetic Test Datasets', 'Coverage Audit Report', 'Gap Analysis Matrix', 'Test Recommendations'],
    bestPractices: [
      'Generate test data immediately after requirements are finalized — not after development',
      'Include edge cases for every input field: nulls, max lengths, special characters, type mismatches',
      'Treat orphaned requirements as blocking issues — if it cannot be tested, it cannot be verified',
      'Re-run the coverage audit after every requirements change to catch new gaps',
      'Use the generated datasets as the basis for both manual QA and automated test suites',
    ],
    duration: '3–5 days',
    complexity: 'Medium',
    common_mistakes: [
      'Only testing the happy path and ignoring boundary and negative cases',
      'Writing test cases that paraphrase the requirement instead of truly validating behavior',
      'Not updating test scenarios when requirements change mid-project',
    ],
  },
  {
    id: 'summary',
    step: 11,
    icon: LayoutDashboard,
    color: '#F97316',
    title: 'Project Summary & Handoff',
    tagline: 'Consolidate all outputs into a clear, shareable project summary.',
    what: 'The project summary phase aggregates all artifacts from every SDLC phase into a cohesive handoff document. It captures decisions made, lessons learned, performance against targets, and everything needed for operations and ongoing maintenance.',
    why: 'Projects without proper handoff documentation create knowledge silos. When key engineers leave, systems become unmaintainable. A thorough summary enables teams to maintain and evolve the system confidently.',
    acornDoes: [
      'Consolidates all phase outputs into a unified project document',
      'Generates executive summary for non-technical stakeholders',
      'Creates operational runbook for the support team',
      'Documents key architectural and design decisions',
      'Produces lessons learned and retrospective summary',
    ],
    keyArtifacts: ['Project Summary Report', 'Executive Dashboard', 'Operations Runbook', 'Architecture Decision Log', 'Lessons Learned'],
    bestPractices: [
      'Write the summary for future team members, not the current ones',
      'Include "what we would do differently" for honest institutional learning',
      'Get sign-off from all stakeholders before considering a project closed',
      'Archive all artifacts in a searchable, accessible system',
      'Schedule a 30-day post-launch retrospective to capture real-world learnings',
    ],
    duration: '1 week',
    complexity: 'Low',
    common_mistakes: [
      'Skipping documentation under "launch pressure"',
      'Writing documentation only for technical audiences',
      'Not storing artifacts in a place the future team can find',
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
const SDLCGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>('planning');
  type SectionKey = 'overview' | 'acorn' | 'practices' | 'mistakes';
  const [activeSections, setActiveSections] = useState<Record<string, SectionKey>>({});
  const getActiveSection = (phaseId: string): SectionKey => activeSections[phaseId] ?? 'overview';
  const setActiveSection = (phaseId: string, section: SectionKey) =>
    setActiveSections(prev => ({ ...prev, [phaseId]: section }));

  const card: React.CSSProperties = {
    background: 'rgba(26,46,69,0.5)',
    border: '1px solid rgba(26,111,212,0.2)',
    borderRadius: '14px',
    backdropFilter: 'blur(8px)',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', color: '#E8EDF5', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .sg-nav { padding: 0 16px !important; }
          .sg-nav-brand-divider { display: none !important; }
          .sg-nav-brand-sub { display: none !important; }
          .sg-nav-signin { display: none !important; }
          .sg-nav-cta { padding: 7px 12px !important; font-size: 12px !important; }
          .sg-nav-back-label { display: none !important; }
        }
        @media (max-width: 599px) {
          .sg-hero { padding: 48px 16px 32px !important; }
          .sg-hero-stats { gap: 10px !important; }
          .sg-hero-stat { padding: 10px 14px !important; flex: 1 1 100% !important; }
          .sg-quicknav { padding: 0 16px 32px !important; }
          .sg-quicknav-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .sg-phases { padding: 0 16px 56px !important; }
          .sg-phase-header { padding: 16px !important; gap: 12px !important; }
          .sg-phase-icon { width: 38px !important; height: 38px !important; border-radius: 10px !important; }
          .sg-phase-meta { flex-wrap: wrap !important; gap: 6px !important; }
          .sg-phase-title { font-size: 16px !important; }
          .sg-phase-tagline { font-size: 12px !important; }
          .sg-phase-body { padding: 0 16px 20px !important; }
          .sg-cta { padding: 48px 16px !important; }
          .sg-cta button { width: 100% !important; justify-content: center !important; }
          .sg-footer { padding: 20px 16px !important; flex-direction: column !important; text-align: center !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="sg-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '60px', gap: '12px',
        background: 'rgba(13,27,42,0.92)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(26,111,212,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899AA', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <ArrowLeft size={14} /> <span className="sg-nav-back-label">Back</span>
          </button>
          <div className="sg-nav-brand-divider" style={{ width: '1px', height: '16px', background: 'rgba(26,111,212,0.3)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <AcornLogo height={36} style={{ flexShrink: 0 }} />
            <span className="sg-nav-brand-sub" style={{ color: '#4a6070', fontSize: '13px' }}>/ SDLC Guide</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button className="sg-nav-signin" onClick={() => navigate('/login')} style={{ padding: '7px 16px', background: 'none', border: '1px solid rgba(26,111,212,0.35)', borderRadius: '8px', color: '#8899AA', fontSize: '13px', cursor: 'pointer' }}>
            Sign In
          </button>
          <button className="sg-nav-cta" onClick={() => navigate('/register')} style={{ padding: '7px 16px', background: 'linear-gradient(135deg, #F97316, #cc4900)', border: 'none', borderRadius: '8px', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="sg-hero" style={{ padding: '72px 32px 48px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.3)', borderRadius: '999px', marginBottom: '20px' }}>
          <BookOpen size={13} color="#1A6FD4" />
          <span style={{ fontSize: '12px', color: '#3d8fe0', fontWeight: 600, letterSpacing: '0.06em' }}>COMPLETE SDLC REFERENCE</span>
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 5vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '16px' }}>
          The Complete Software Development<br />
          <span style={{ background: 'linear-gradient(135deg, #1A6FD4, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Life Cycle Guide
          </span>
        </h1>
        <p style={{ color: '#8899AA', fontSize: '17px', lineHeight: 1.7, maxWidth: '640px', margin: '0 auto 32px' }}>
          Everything you need to know about the 11 phases of modern software development — what each phase produces, why it matters, and the best practices that separate successful projects from failed ones.
        </p>
        <div className="sg-hero-stats" style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: Layers, value: '10 Phases', label: 'Fully documented' },
            { icon: CheckSquare, value: '60+', label: 'Best practices' },
            { icon: Target, value: '30+', label: 'Common mistakes' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={value} className="sg-hero-stat" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', ...card }}>
              <Icon size={18} color="#1A6FD4" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{value}</div>
                <div style={{ fontSize: '12px', color: '#8899AA' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick navigation */}
      <section className="sg-quicknav" style={{ padding: '0 32px 48px', maxWidth: '900px', margin: '0 auto' }}>
        <div className="sg-quicknav-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
          {PHASES.map(phase => {
            const Icon = phase.icon;
            return (
              <button key={phase.id}
                onClick={() => { setExpanded(phase.id); document.getElementById(`phase-${phase.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                style={{
                  padding: '10px 14px', ...card, border: `1px solid ${phase.color}25`,
                  display: 'flex', alignItems: 'center', gap: '10px',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  background: expanded === phase.id ? `${phase.color}18` : 'rgba(26,46,69,0.4)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${phase.color}50`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${phase.color}25`; }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `${phase.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={phase.color} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: phase.color, fontWeight: 700 }}>Phase {phase.step}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#C8D5E5' }}>{phase.title.split(' ')[0]}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Phase detail sections */}
      <section className="sg-phases" style={{ padding: '0 32px 80px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {PHASES.map(phase => {
            const Icon = phase.icon;
            const isOpen = expanded === phase.id;

            return (
              <div key={phase.id} id={`phase-${phase.id}`} style={{
                ...card,
                border: `1px solid ${isOpen ? phase.color + '40' : 'rgba(26,111,212,0.15)'}`,
                transition: 'border-color 0.2s',
              }}>
                {/* Accordion header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : phase.id)}
                  className="sg-phase-header"
                  style={{
                    width: '100%', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div className="sg-phase-icon" style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${phase.color}20`, border: `1px solid ${phase.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={phase.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sg-phase-meta" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', color: phase.color, fontWeight: 700, letterSpacing: '0.06em' }}>PHASE {phase.step}</span>
                      <span style={{ fontSize: '11px', color: '#4a6070', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px' }}>{phase.duration}</span>
                      <span style={{ fontSize: '11px', color: '#4a6070', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px' }}>{phase.complexity} complexity</span>
                    </div>
                    <div className="sg-phase-title" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '18px', color: '#E8EDF5' }}>{phase.title}</div>
                    <div className="sg-phase-tagline" style={{ fontSize: '13px', color: '#8899AA', marginTop: '2px' }}>{phase.tagline}</div>
                  </div>
                  <div style={{ color: '#4a6070', flexShrink: 0 }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (() => {
                  const activeSection = getActiveSection(phase.id);
                  return (
                  <div className="sg-phase-body" style={{ padding: '0 24px 24px', borderTop: `1px solid ${phase.color}20` }}>
                    {/* Section tabs */}
                    <div style={{ display: 'flex', gap: '4px', padding: '12px 0', overflowX: 'auto' }}>
                      {(['overview', 'acorn', 'practices', 'mistakes'] as const).map(s => (
                        <button key={s}
                          onClick={() => setActiveSection(phase.id, s)}
                          style={{
                            padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
                            background: activeSection === s ? phase.color : 'rgba(255,255,255,0.05)',
                            color: activeSection === s ? '#fff' : '#8899AA',
                            transition: 'all 0.15s',
                          }}
                        >
                          {s === 'overview' ? 'Overview' : s === 'acorn' ? 'What Acorn Does' : s === 'practices' ? 'Best Practices' : 'Common Mistakes'}
                        </button>
                      ))}
                    </div>

                    {activeSection === 'overview' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#8899AA', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>What It Is</h4>
                          <p style={{ fontSize: '14px', color: '#C8D5E5', lineHeight: 1.7 }}>{phase.what}</p>
                        </div>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#8899AA', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Why It Matters</h4>
                          <p style={{ fontSize: '14px', color: '#C8D5E5', lineHeight: 1.7 }}>{phase.why}</p>
                        </div>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#8899AA', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Key Artifacts Produced</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {phase.keyArtifacts.map(a => (
                              <span key={a} style={{ padding: '5px 12px', background: `${phase.color}14`, border: `1px solid ${phase.color}30`, borderRadius: '8px', fontSize: '12px', color: phase.color, fontWeight: 600 }}>{a}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === 'acorn' && (
                      <div>
                        <p style={{ fontSize: '13px', color: '#8899AA', marginBottom: '14px' }}>When you reach this phase in Acorn, our AI automatically:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {phase.acornDoes.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', background: `${phase.color}0a`, border: `1px solid ${phase.color}25`, borderRadius: '10px' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: phase.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0D1B2A' }}>{i + 1}</span>
                              </div>
                              <p style={{ fontSize: '14px', color: '#C8D5E5', lineHeight: 1.6 }}>{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeSection === 'practices' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {phase.bestPractices.map((p, i) => (
                          <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 16px', background: 'rgba(26,111,212,0.06)', border: '1px solid rgba(26,111,212,0.2)', borderRadius: '10px' }}>
                            <CheckCircle2 size={16} color="#1A6FD4" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '14px', color: '#C8D5E5', lineHeight: 1.6 }}>{p}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeSection === 'mistakes' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {phase.common_mistakes.map((m, i) => (
                          <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                            <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '14px', color: '#C8D5E5', lineHeight: 1.6 }}>{m}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="sg-cta" style={{ padding: '64px 32px', textAlign: 'center', background: 'rgba(26,111,212,0.05)', borderTop: '1px solid rgba(26,111,212,0.15)' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 4vw, 40px)', marginBottom: '14px' }}>
          Stop planning manually. Let Acorn do it.
        </h2>
        <p style={{ color: '#8899AA', fontSize: '16px', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
          Every phase documented above is generated automatically from your project description. In minutes, not weeks.
        </p>
        <button onClick={() => navigate('/register')}
          style={{ padding: '14px 40px', background: 'linear-gradient(135deg, #F97316, #cc4900)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 6px 28px rgba(249,115,22,0.4)' }}>
          <ArrowRight size={18} /> Start Building Free
        </button>
      </section>

      <footer className="sg-footer" style={{ padding: '24px 32px', borderTop: '1px solid rgba(26,111,212,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '5px', background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={11} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '14px' }}>Acorn</span>
        </div>
        <p style={{ color: '#4a6070', fontSize: '12px' }}>© 2025 Acorn · AI-Powered Project Intelligence · All 10 SDLC phases covered</p>
      </footer>
    </div>
  );
};

export default SDLCGuidePage;

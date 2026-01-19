# Acorn - Focused Implementation Plan

## Logo Color Palette (Extracted)

### Primary Colors
- **Orange (Acorn)**: `#F5A623` - Primary brand color, warm accent
- **Blue (Arrow)**: `#4A7BA7` - Secondary brand color, trust and growth
- **Deep Blue**: `#2E5090` - Gradient end, professional
- **Navy (Text)**: `#1B2D45` - Primary text, strong contrast
- **Gradient**: `linear-gradient(135deg, #F5A623 0%, #4A7BA7 50%, #2E5090 100%)`

### Supporting Colors
- **Light Orange**: `#FFB84D` - Hover states, highlights
- **Light Blue**: `#6B9FD1` - Secondary buttons, links
- **Pale Blue**: `#E8F1F8` - Backgrounds, cards
- **Dark Navy**: `#0F1A2E` - Dark mode background
- **White**: `#FFFFFF` - Clean backgrounds
- **Gray Scale**:
  - `#F8F9FA` - Light background
  - `#E9ECEF` - Borders
  - `#6C757D` - Muted text
  - `#343A40` - Dark text

### Semantic Colors
- **Success**: `#28A745` - Completed tasks, success states
- **Warning**: `#FFC107` - Warnings, pending states
- **Error**: `#DC3545` - Errors, critical issues
- **Info**: `#17A2B8` - Information, tips

---

## Feature Implementation Priority

### ✅ Phase 1: Core Features (Week 1-2)

#### 1. Persona + User Story Generation ⭐⭐⭐⭐⭐
**Location**: Requirements Phase
**Purpose**: Generate detailed user personas and user stories from project context

**Backend Implementation**:
```python
# backend/models/persona.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Persona(BaseModel):
    id: str
    project_id: str
    name: str
    role: str
    age_range: str
    background: str
    goals: List[str]
    pain_points: List[str]
    tech_savviness: str  # beginner, intermediate, advanced
    motivations: List[str]
    frustrations: List[str]
    preferred_channels: List[str]
    quote: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime

class UserStory(BaseModel):
    id: str
    project_id: str
    persona_id: Optional[str]
    title: str
    as_a: str  # role
    i_want: str  # action
    so_that: str  # benefit
    acceptance_criteria: List[str]
    priority: str  # low, medium, high, critical
    story_points: Optional[int]
    status: str  # draft, ready, in_progress, done
    linked_requirements: List[str]
    created_at: datetime
    updated_at: datetime

# backend/services/persona_service.py
class PersonaService:
    async def generate_personas(self, project_id: str, context: dict) -> List[Persona]:
        """Generate personas using AI based on project context"""
        prompt = f"""
        Based on this project context:
        - Industry: {context.get('industry')}
        - Target Users: {context.get('target_users')}
        - Project Goals: {context.get('goals')}
        
        Generate 3-5 detailed user personas with:
        - Name, role, age range
        - Background and context
        - Goals and motivations
        - Pain points and frustrations
        - Tech savviness level
        - A memorable quote
        """
        # AI generation logic
        
    async def generate_user_stories(self, project_id: str, personas: List[Persona]) -> List[UserStory]:
        """Generate user stories from personas"""
        # AI generation logic
```

**Database Schema**:
```sql
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    age_range VARCHAR(50),
    background TEXT,
    goals JSONB DEFAULT '[]',
    pain_points JSONB DEFAULT '[]',
    tech_savviness VARCHAR(50),
    motivations JSONB DEFAULT '[]',
    frustrations JSONB DEFAULT '[]',
    preferred_channels JSONB DEFAULT '[]',
    quote TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES personas(id),
    title VARCHAR(500) NOT NULL,
    as_a VARCHAR(255),
    i_want TEXT,
    so_that TEXT,
    acceptance_criteria JSONB DEFAULT '[]',
    priority VARCHAR(50) DEFAULT 'medium',
    story_points INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    linked_requirements JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_personas_project ON personas(project_id);
CREATE INDEX idx_user_stories_project ON user_stories(project_id);
CREATE INDEX idx_user_stories_persona ON user_stories(persona_id);
```

**Frontend Component**:
```tsx
// frontend/src/components/phases/requirements/PersonaGenerator.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PersonaGenerator({ projectId }) {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);

  const generatePersonas = async () => {
    setLoading(true);
    const result = await api.generatePersonas(projectId);
    setPersonas(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-navy-900">User Personas</h2>
        <Button 
          onClick={generatePersonas}
          disabled={loading}
          className="bg-gradient-to-r from-orange-500 to-blue-600"
        >
          {loading ? 'Generating...' : 'Generate Personas'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map(persona => (
          <PersonaCard key={persona.id} persona={persona} />
        ))}
      </div>
    </div>
  );
}
```

#### 2. SRS Audit Feature ⭐⭐⭐⭐⭐
**Location**: Validation Phase
**Purpose**: Audit Software Requirements Specification for completeness, consistency, and quality

**Backend Implementation**:
```python
# backend/models/srs_audit.py
class SRSAuditReport(BaseModel):
    id: str
    project_id: str
    audit_date: datetime
    overall_score: float  # 0-100
    completeness_score: float
    consistency_score: float
    clarity_score: float
    testability_score: float
    findings: List[AuditFinding]
    recommendations: List[str]
    status: str  # draft, in_review, approved

class AuditFinding(BaseModel):
    id: str
    category: str  # completeness, consistency, clarity, testability
    severity: str  # low, medium, high, critical
    requirement_id: Optional[str]
    title: str
    description: str
    recommendation: str
    status: str  # open, resolved, wont_fix

# backend/services/srs_audit_service.py
class SRSAuditService:
    async def audit_requirements(self, project_id: str) -> SRSAuditReport:
        """Comprehensive SRS audit"""
        requirements = await self.req_repo.get_all(project_id)
        
        findings = []
        
        # Check completeness
        findings.extend(await self._check_completeness(requirements))
        
        # Check consistency
        findings.extend(await self._check_consistency(requirements))
        
        # Check clarity
        findings.extend(await self._check_clarity(requirements))
        
        # Check testability
        findings.extend(await self._check_testability(requirements))
        
        # Calculate scores
        scores = self._calculate_scores(findings)
        
        return SRSAuditReport(
            project_id=project_id,
            findings=findings,
            **scores
        )
    
    async def _check_completeness(self, requirements):
        """Check if all necessary requirements are present"""
        findings = []
        
        # Check for functional requirements
        functional = [r for r in requirements if r.type == 'functional']
        if len(functional) < 5:
            findings.append(AuditFinding(
                category='completeness',
                severity='high',
                title='Insufficient Functional Requirements',
                description=f'Only {len(functional)} functional requirements found. Typical projects need 10-50.',
                recommendation='Add more detailed functional requirements covering all user interactions.'
            ))
        
        # Check for non-functional requirements
        non_functional = [r for r in requirements if r.type == 'non_functional']
        if len(non_functional) == 0:
            findings.append(AuditFinding(
                category='completeness',
                severity='critical',
                title='Missing Non-Functional Requirements',
                description='No non-functional requirements (performance, security, scalability) defined.',
                recommendation='Add NFRs for performance, security, scalability, and usability.'
            ))
        
        return findings
    
    async def _check_consistency(self, requirements):
        """Check for contradictions and inconsistencies"""
        findings = []
        
        # Use AI to detect contradictions
        prompt = f"""
        Analyze these requirements for contradictions:
        {[r.title for r in requirements]}
        
        Identify any conflicting requirements.
        """
        # AI analysis
        
        return findings
    
    async def _check_clarity(self, requirements):
        """Check if requirements are clear and unambiguous"""
        findings = []
        
        for req in requirements:
            # Check for ambiguous words
            ambiguous_words = ['maybe', 'possibly', 'might', 'could', 'should']
            if any(word in req.description.lower() for word in ambiguous_words):
                findings.append(AuditFinding(
                    category='clarity',
                    severity='medium',
                    requirement_id=req.id,
                    title=f'Ambiguous Language in "{req.title}"',
                    description='Requirement contains ambiguous words that reduce clarity.',
                    recommendation='Use definitive language: "must", "will", "shall".'
                ))
        
        return findings
    
    async def _check_testability(self, requirements):
        """Check if requirements are testable"""
        findings = []
        
        for req in requirements:
            # Check for measurable criteria
            if not req.acceptance_criteria or len(req.acceptance_criteria) == 0:
                findings.append(AuditFinding(
                    category='testability',
                    severity='high',
                    requirement_id=req.id,
                    title=f'No Acceptance Criteria for "{req.title}"',
                    description='Requirement lacks testable acceptance criteria.',
                    recommendation='Add specific, measurable acceptance criteria.'
                ))
        
        return findings
```

**Database Schema**:
```sql
CREATE TABLE srs_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    audit_date TIMESTAMP DEFAULT NOW(),
    overall_score DECIMAL(5,2),
    completeness_score DECIMAL(5,2),
    consistency_score DECIMAL(5,2),
    clarity_score DECIMAL(5,2),
    testability_score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES srs_audits(id) ON DELETE CASCADE,
    category VARCHAR(50),
    severity VARCHAR(50),
    requirement_id UUID REFERENCES requirements(id),
    title VARCHAR(500),
    description TEXT,
    recommendation TEXT,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Stakeholder Negotiation & Impact Analysis ⭐⭐⭐⭐⭐
**Location**: Validation Phase
**Purpose**: Manage stakeholder feedback, negotiate requirements, analyze impact of changes

**Backend Implementation**:
```python
# backend/models/stakeholder.py
class Stakeholder(BaseModel):
    id: str
    project_id: str
    name: str
    role: str
    organization: str
    influence_level: str  # low, medium, high, critical
    interest_level: str  # low, medium, high
    contact_email: str
    contact_phone: Optional[str]
    preferences: List[str]
    concerns: List[str]
    created_at: datetime

class StakeholderFeedback(BaseModel):
    id: str
    project_id: str
    stakeholder_id: str
    requirement_id: Optional[str]
    feedback_type: str  # approval, concern, change_request, question
    priority: str
    description: str
    proposed_change: Optional[str]
    impact_analysis: Optional[dict]
    status: str  # pending, under_review, accepted, rejected, negotiating
    resolution: Optional[str]
    created_at: datetime

class ImpactAnalysis(BaseModel):
    id: str
    change_request_id: str
    affected_requirements: List[str]
    affected_tasks: List[str]
    effort_estimate: str  # hours
    cost_impact: str  # currency
    schedule_impact: str  # days
    risk_level: str  # low, medium, high
    benefits: List[str]
    drawbacks: List[str]
    recommendation: str  # approve, reject, modify
    created_at: datetime

# backend/services/stakeholder_service.py
class StakeholderService:
    async def analyze_impact(self, change_request_id: str) -> ImpactAnalysis:
        """Analyze impact of proposed change"""
        change = await self.feedback_repo.get(change_request_id)
        
        # Find affected requirements
        affected_reqs = await self._find_affected_requirements(change)
        
        # Find affected tasks
        affected_tasks = await self._find_affected_tasks(affected_reqs)
        
        # Estimate effort
        effort = await self._estimate_effort(affected_reqs, affected_tasks)
        
        # Calculate cost
        cost = effort * hourly_rate
        
        # Estimate schedule impact
        schedule_impact = await self._estimate_schedule_impact(affected_tasks)
        
        # Assess risks
        risk_level = await self._assess_risk(change, affected_reqs)
        
        # Generate recommendation
        recommendation = await self._generate_recommendation(
            effort, cost, schedule_impact, risk_level
        )
        
        return ImpactAnalysis(
            change_request_id=change_request_id,
            affected_requirements=[r.id for r in affected_reqs],
            affected_tasks=[t.id for t in affected_tasks],
            effort_estimate=f"{effort} hours",
            cost_impact=f"${cost}",
            schedule_impact=f"{schedule_impact} days",
            risk_level=risk_level,
            recommendation=recommendation
        )
    
    async def negotiate_requirement(self, feedback_id: str, counter_proposal: str):
        """Facilitate stakeholder negotiation"""
        # Track negotiation history
        # Send notifications
        # Update status
```

**Database Schema**:
```sql
CREATE TABLE stakeholders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    organization VARCHAR(255),
    influence_level VARCHAR(50),
    interest_level VARCHAR(50),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    preferences JSONB DEFAULT '[]',
    concerns JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stakeholder_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stakeholder_id UUID REFERENCES stakeholders(id),
    requirement_id UUID REFERENCES requirements(id),
    feedback_type VARCHAR(50),
    priority VARCHAR(50),
    description TEXT,
    proposed_change TEXT,
    impact_analysis JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    resolution TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE impact_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_request_id UUID REFERENCES stakeholder_feedback(id),
    affected_requirements JSONB DEFAULT '[]',
    affected_tasks JSONB DEFAULT '[]',
    effort_estimate VARCHAR(100),
    cost_impact VARCHAR(100),
    schedule_impact VARCHAR(100),
    risk_level VARCHAR(50),
    benefits JSONB DEFAULT '[]',
    drawbacks JSONB DEFAULT '[]',
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. Fake Payment Gateway ⭐⭐⭐⭐
**Purpose**: Simulate subscription and payment flows for demo/testing

**Backend Implementation**:
```python
# backend/models/subscription.py
class Subscription(BaseModel):
    id: str
    user_id: str
    organization: str
    plan: str  # free, pro, enterprise
    status: str  # active, cancelled, expired, trial
    billing_cycle: str  # monthly, yearly
    price: float
    currency: str
    trial_ends_at: Optional[datetime]
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    created_at: datetime

class PaymentMethod(BaseModel):
    id: str
    user_id: str
    type: str  # card, bank_account
    last4: str
    brand: str  # visa, mastercard, amex
    exp_month: int
    exp_year: int
    is_default: bool

class Invoice(BaseModel):
    id: str
    subscription_id: str
    amount: float
    currency: str
    status: str  # draft, open, paid, void
    due_date: datetime
    paid_at: Optional[datetime]
    invoice_pdf_url: Optional[str]

# backend/services/fake_payment_service.py
class FakePaymentService:
    """Simulated payment gateway for demo purposes"""
    
    async def create_subscription(self, user_id: str, plan: str) -> Subscription:
        """Create a fake subscription"""
        plans = {
            'free': {'price': 0, 'features': ['5 projects', 'Basic AI']},
            'pro': {'price': 29, 'features': ['Unlimited projects', 'Advanced AI', 'Export']},
            'enterprise': {'price': 99, 'features': ['Everything', 'Priority support', 'Custom AI']}
        }
        
        plan_details = plans.get(plan, plans['free'])
        
        return Subscription(
            id=str(uuid.uuid4()),
            user_id=user_id,
            plan=plan,
            status='active',
            price=plan_details['price'],
            currency='USD',
            billing_cycle='monthly',
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
    
    async def process_payment(self, amount: float, payment_method_id: str) -> dict:
        """Simulate payment processing"""
        # Always succeed in demo mode
        await asyncio.sleep(1)  # Simulate processing
        
        return {
            'success': True,
            'transaction_id': f"fake_txn_{uuid.uuid4().hex[:12]}",
            'amount': amount,
            'status': 'succeeded'
        }
    
    async def add_payment_method(self, user_id: str, card_details: dict) -> PaymentMethod:
        """Add fake payment method"""
        return PaymentMethod(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type='card',
            last4=card_details.get('number', '4242')[-4:],
            brand=card_details.get('brand', 'visa'),
            exp_month=card_details.get('exp_month', 12),
            exp_year=card_details.get('exp_year', 2025),
            is_default=True
        )
```

**Frontend Component**:
```tsx
// frontend/src/components/billing/PricingPlans.tsx
export function PricingPlans() {
  const plans = [
    {
      name: 'Free',
      price: 0,
      features: ['5 projects', 'Basic AI', 'Community support'],
      cta: 'Get Started',
      gradient: 'from-gray-400 to-gray-600'
    },
    {
      name: 'Pro',
      price: 29,
      features: ['Unlimited projects', 'Advanced AI', 'Export PDF/DOCX', 'Priority support'],
      cta: 'Upgrade to Pro',
      gradient: 'from-orange-500 to-blue-600',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 99,
      features: ['Everything in Pro', 'Custom AI models', 'Dedicated support', 'SLA guarantee'],
      cta: 'Contact Sales',
      gradient: 'from-blue-600 to-navy-900'
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8 p-8">
      {plans.map(plan => (
        <Card 
          key={plan.name}
          className={`relative ${plan.popular ? 'ring-2 ring-orange-500' : ''}`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-orange-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
          )}
          <div className="p-6">
            <h3 className="text-2xl font-bold text-navy-900">{plan.name}</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
                ${plan.price}
              </span>
              <span className="ml-2 text-gray-600">/month</span>
            </div>
            <ul className="mt-6 space-y-4">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-center">
                  <CheckIcon className="text-green-500 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className={`w-full mt-8 bg-gradient-to-r ${plan.gradient}`}
              onClick={() => handleSubscribe(plan.name)}
            >
              {plan.cta}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

#### 5. New AI Provider Support ⭐⭐⭐⭐
**Purpose**: Add support for additional AI providers (Claude, OpenAI, local models)

**Backend Implementation**:
```python
# backend/services/ai_providers/base_provider.py
from abc import ABC, abstractmethod

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_text(self, prompt: str, **kwargs) -> str:
        pass
    
    @abstractmethod
    async def generate_structured(self, prompt: str, schema: dict) -> dict:
        pass

# backend/services/ai_providers/claude_provider.py
import anthropic

class ClaudeProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        message = self.client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=kwargs.get('max_tokens', 4096),
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text

# backend/services/ai_providers/openai_provider.py
from openai import AsyncOpenAI

class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        response = await self.client.chat.completions.create(
            model=kwargs.get('model', 'gpt-4-turbo-preview'),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get('max_tokens', 4096)
        )
        return response.choices[0].message.content

# backend/services/ai_providers/ollama_provider.py
import httpx

class OllamaProvider(BaseAIProvider):
    """Local AI using Ollama"""
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": kwargs.get('model', 'llama2'),
                    "prompt": prompt,
                    "stream": False
                }
            )
            return response.json()['response']

# backend/services/ai_service.py
class AIService:
    def __init__(self):
        self.providers = {
            'gemini': GeminiProvider(settings.gemini_api_key),
            'claude': ClaudeProvider(settings.claude_api_key),
            'openai': OpenAIProvider(settings.openai_api_key),
            'ollama': OllamaProvider(),
            'stub': StubProvider()
        }
    
    async def generate(self, prompt: str, provider: str = None) -> str:
        provider = provider or settings.llm_provider
        ai_provider = self.providers.get(provider)
        
        if not ai_provider:
            raise ValueError(f"Unknown provider: {provider}")
        
        return await ai_provider.generate_text(prompt)
```

**Configuration**:
```python
# backend/config.py additions
class Settings(BaseSettings):
    # ... existing settings ...
    
    # AI Providers
    claude_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    ollama_base_url: str = "http://localhost:11434"
    
    # AI Model Selection
    ai_provider_priority: List[str] = ["gemini", "claude", "openai", "ollama", "stub"]
```

---

## ✅ Phase 2: UI/UX Refactor with Acorn Branding (Week 3-4)

### Design System Implementation

**Create Design Tokens**:
```typescript
// frontend/src/design-system/tokens.ts
export const colors = {
  // Brand Colors
  orange: {
    50: '#FFF5E6',
    100: '#FFE8CC',
    200: '#FFD199',
    300: '#FFB84D',
    400: '#F5A623', // Primary
    500: '#E69500',
    600: '#CC7A00',
    700: '#995C00',
    800: '#663D00',
    900: '#331F00',
  },
  blue: {
    50: '#E8F1F8',
    100: '#D1E3F1',
    200: '#A3C7E3',
    300: '#6B9FD1',
    400: '#4A7BA7', // Secondary
    500: '#2E5090', // Deep Blue
    600: '#234073',
    700: '#1A3056',
    800: '#112039',
    900: '#09101D',
  },
  navy: {
    50: '#E6E9EC',
    100: '#CCD3D9',
    200: '#99A7B3',
    300: '#667B8D',
    400: '#334F67',
    500: '#1B2D45', // Primary Text
    600: '#162437',
    700: '#0F1A2E', // Dark Mode BG
    800: '#0B1220',
    900: '#060910',
  },
  
  // Semantic Colors
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
  
  // Neutrals
  gray: {
    50: '#F8F9FA',
    100: '#E9ECEF',
    200: '#DEE2E6',
    300: '#CED4DA',
    400: '#ADB5BD',
    500: '#6C757D',
    600: '#495057',
    700: '#343A40',
    800: '#212529',
    900: '#0F1419',
  },
  
  white: '#FFFFFF',
  black: '#000000',
};

export const gradients = {
  primary: 'linear-gradient(135deg, #F5A623 0%, #4A7BA7 50%, #2E5090 100%)',
  orange: 'linear-gradient(135deg, #F5A623 0%, #FFB84D 100%)',
  blue: 'linear-gradient(135deg, #4A7BA7 0%, #2E5090 100%)',
  navy: 'linear-gradient(135deg, #1B2D45 0%, #0F1A2E 100%)',
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  acorn: '0 10px 30px rgba(245, 166, 35, 0.3)', // Orange glow
  arrow: '0 10px 30px rgba(74, 123, 167, 0.3)', // Blue glow
};
```

**Update Tailwind Config**:
```javascript
// frontend/tailwind.config.js
import { colors, gradients, typography, spacing, borderRadius, shadows } from './src/design-system/tokens';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        orange: colors.orange,
        blue: colors.blue,
        navy: colors.navy,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
      },
      backgroundImage: {
        'gradient-primary': gradients.primary,
        'gradient-orange': gradients.orange,
        'gradient-blue': gradients.blue,
        'gradient-navy': gradients.navy,
      },
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      spacing,
      borderRadius,
      boxShadow: shadows,
    },
  },
  plugins: [],
};
```

### Logo Integration

**Save Logo**:
```bash
# Save the logo image to:
frontend/public/logo.svg
frontend/public/logo-light.svg  # For dark backgrounds
frontend/public/logo-icon.svg   # Icon only (acorn)
frontend/public/favicon.ico
```

**Logo Component**:
```tsx
// frontend/src/components/ui/Logo.tsx
interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
  className?: string;
}

export function Logo({ variant = 'full', size = 'md', theme = 'light', className }: LogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
  };

  const logoSrc = variant === 'icon' 
    ? '/logo-icon.svg'
    : theme === 'dark' 
      ? '/logo-light.svg' 
      : '/logo.svg';

  return (
    <img 
      src={logoSrc} 
      alt="Acorn" 
      className={`${sizes[size]} ${className}`}
    />
  );
}
```

### Page-by-Page UI Refactor

**1. Landing Page**:
```tsx
// frontend/src/pages/Landing.tsx
export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-orange-50">
      {/* Hero Section */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <Logo size="lg" />
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-navy-700 hover:text-orange-500">
              Sign In
            </Link>
            <Button className="bg-gradient-primary text-white">
              Get Started Free
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-extrabold text-navy-900 mb-6">
            Plant the Seeds of
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {' '}Perfect Projects
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered software planning that grows with your team.
            From concept to deployment in 8 structured phases.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-gradient-primary shadow-acorn">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-orange-500 text-orange-600">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          {features.map(feature => (
            <Card key={feature.title} className="p-6 hover:shadow-acorn transition-shadow">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
```

**2. Authentication Pages**:
```tsx
// frontend/src/pages/auth/Login.tsx
export function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-blue-900 to-orange-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Logo size="xl" theme="light" className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-navy-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to continue growing your projects</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Email
            </label>
            <Input 
              type="email" 
              placeholder="you@example.com"
              className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Password
            </label>
            <Input 
              type="password"
              className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary shadow-acorn"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-orange-600 hover:text-orange-700 font-semibold">
              Sign up free
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
```

**3. Dashboard**:
```tsx
// frontend/src/pages/Dashboard.tsx
export function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          
          <div className="flex items-center gap-6">
            <Button variant="ghost" className="text-navy-700">
              <BellIcon className="w-5 h-5" />
            </Button>
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Active Projects"
            value="12"
            change="+2 this week"
            icon={ProjectIcon}
            gradient="from-orange-500 to-orange-600"
          />
          <StatCard 
            title="Completed Tasks"
            value="156"
            change="+23 this week"
            icon={CheckIcon}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard 
            title="Team Members"
            value="8"
            change="2 pending invites"
            icon={UsersIcon}
            gradient="from-navy-600 to-navy-700"
          />
          <StatCard 
            title="Success Rate"
            value="94%"
            change="+5% this month"
            icon={TrendingUpIcon}
            gradient="from-green-500 to-green-600"
          />
        </div>

        {/* Projects Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-navy-900">Your Projects</h2>
            <Button className="bg-gradient-primary">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**4. Phase Pages** (Apply to all 8 phases):
```tsx
// frontend/src/components/phases/PhaseLayout.tsx
export function PhaseLayout({ phase, children }) {
  const phaseColors = {
    planning: 'from-orange-500 to-orange-600',
    feasibility: 'from-blue-500 to-blue-600',
    requirements: 'from-navy-600 to-navy-700',
    validation: 'from-green-500 to-green-600',
    design: 'from-purple-500 to-purple-600',
    development: 'from-indigo-500 to-indigo-600',
    tasks: 'from-pink-500 to-pink-600',
    summary: 'from-gray-600 to-gray-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Phase Header */}
      <div className={`bg-gradient-to-r ${phaseColors[phase.key]} text-white py-8`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Logo variant="icon" size="md" theme="dark" />
            <ChevronRightIcon className="w-5 h-5" />
            <span className="text-sm opacity-80">Phase {phase.number}</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">{phase.title}</h1>
          <p className="text-lg opacity-90">{phase.description}</p>
        </div>
      </div>

      {/* Phase Content */}
      <div className="container mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}
```

**5. Profile Page**:
```tsx
// frontend/src/pages/Profile.tsx
export function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Profile Header */}
        <Card className="p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar size="xl" src={user.avatar} />
              <button className="absolute bottom-0 right-0 bg-gradient-primary p-2 rounded-full shadow-lg">
                <CameraIcon className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-navy-900">{user.name}</h1>
              <p className="text-gray-600 mt-1">{user.role}</p>
              
              <div className="flex items-center gap-4 mt-4">
                <Badge className="bg-gradient-primary text-white">
                  {user.subscription}
                </Badge>
                <span className="text-sm text-gray-600">
                  Member since {formatDate(user.createdAt)}
                </span>
              </div>
            </div>

            <Button variant="outline" className="border-orange-500 text-orange-600">
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Profile Sections */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <PersonalInfoSection />
            <SecuritySection />
            <PreferencesSection />
          </div>
          
          <div className="space-y-8">
            <SubscriptionCard />
            <ActivitySummary />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Phase 3: Export Functionality (Week 5)

### PDF Export
```python
# backend/services/export_service.py
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from io import BytesIO

class PDFExportService:
    async def export_project_pdf(self, project_id: str) -> BytesIO:
        """Export complete project to PDF"""
        project = await self.project_repo.get(project_id)
        requirements = await self.req_repo.get_all(project_id)
        tasks = await self.task_repo.get_all(project_id)
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles with Acorn colors
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1B2D45'),
            spaceAfter=30,
        )
        
        # Add logo
        logo_path = 'path/to/logo.png'
        logo = Image(logo_path, width=2*inch, height=0.5*inch)
        story.append(logo)
        story.append(Spacer(1, 0.5*inch))
        
        # Title
        story.append(Paragraph(project.name, title_style))
        story.append(Paragraph(project.description, styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Requirements Section
        story.append(Paragraph("Requirements", styles['Heading2']))
        req_data = [['ID', 'Title', 'Type', 'Priority', 'Status']]
        for req in requirements:
            req_data.append([
                req.id[:8],
                req.title,
                req.type,
                req.priority,
                req.status
            ])
        
        req_table = Table(req_data)
        req_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F5A623')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(req_table)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

### DOCX Export
```python
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

class DOCXExportService:
    async def export_project_docx(self, project_id: str) -> BytesIO:
        """Export complete project to DOCX"""
        project = await self.project_repo.get(project_id)
        requirements = await self.req_repo.get_all(project_id)
        
        doc = Document()
        
        # Add logo
        doc.add_picture('path/to/logo.png', width=Inches(2))
        
        # Title
        title = doc.add_heading(project.name, 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title.runs[0]
        title_run.font.color.rgb = RGBColor(27, 45, 69)  # Navy
        
        # Description
        doc.add_paragraph(project.description)
        
        # Requirements
        doc.add_heading('Requirements', level=1)
        table = doc.add_table(rows=1, cols=5)
        table.style = 'Light Grid Accent 1'
        
        # Header row
        hdr_cells = table.rows[0].cells
        hdr_cells[0].text = 'ID'
        hdr_cells[1].text = 'Title'
        hdr_cells[2].text = 'Type'
        hdr_cells[3].text = 'Priority'
        hdr_cells[4].text = 'Status'
        
        # Data rows
        for req in requirements:
            row_cells = table.add_row().cells
            row_cells[0].text = req.id[:8]
            row_cells[1].text = req.title
            row_cells[2].text = req.type
            row_cells[3].text = req.priority
            row_cells[4].text = req.status
        
        # Save to buffer
        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer
```

**API Endpoints**:
```python
# backend/routes/export.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.get("/projects/{project_id}/export/pdf")
async def export_pdf(project_id: str):
    """Export project as PDF"""
    pdf_buffer = await export_service.export_project_pdf(project_id)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=project_{project_id}.pdf"
        }
    )

@router.get("/projects/{project_id}/export/docx")
async def export_docx(project_id: str):
    """Export project as DOCX"""
    docx_buffer = await export_service.export_project_docx(project_id)
    
    return StreamingResponse(
        docx_buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=project_{project_id}.docx"
        }
    )
```

---

## Implementation Timeline

### Week 1-2: Core Features
- ✅ Persona + User Story generation
- ✅ SRS Audit feature
- ✅ Stakeholder Negotiation
- ✅ Fake Payment Gateway
- ✅ New AI Providers

### Week 3-4: UI/UX Refactor
- ✅ Design system with Acorn colors
- ✅ Logo integration everywhere
- ✅ Landing page redesign
- ✅ Auth pages redesign
- ✅ Dashboard redesign
- ✅ All 8 phase pages redesign
- ✅ Profile page redesign

### Week 5: Export & Polish
- ✅ PDF export functionality
- ✅ DOCX export functionality
- ✅ Final testing and bug fixes
- ✅ Performance optimization
- ✅ Documentation updates

---

## Next Steps

1. **Save logo files** to `frontend/public/`
2. **Install dependencies**:
   ```bash
   # Backend
   pip install reportlab python-docx anthropic openai
   
   # Frontend
   npm install @radix-ui/react-avatar @radix-ui/react-badge
   ```
3. **Create database migrations** for new tables
4. **Implement features** in priority order
5. **Test thoroughly** with Acorn branding
6. **Deploy** to production

This plan removes all integration features and focuses on the core functionality you requested with beautiful Acorn-branded UX throughout the entire application.

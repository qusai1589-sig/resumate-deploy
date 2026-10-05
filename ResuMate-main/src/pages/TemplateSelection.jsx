import { useState } from 'react';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  FileText,
  SlidersHorizontal,
  Code2,
  GraduationCap,
} from 'lucide-react';

import './TemplateSelection.css';

/* =========================================================
   TEMPLATE PREVIEW COMPONENTS
   ========================================================= */

function ModernPreview() {
  return (
    <div className="preview-modern-paper">
      <div className="modern-preview-header">
        <div>
          <div className="preview-name">Alex Morgan</div>
          <div className="preview-role">Computer Engineer</div>
        </div>
        <div className="modern-preview-circle">AM</div>
      </div>

      <div className="preview-contact-row">
        <span>alex@email.com</span>
        <span>+91 98765</span>
      </div>

      <div className="modern-preview-columns">
        <div>
          <PreviewSection title="Experience" />
          <PreviewLines count={4} />

          <PreviewSection title="Projects" />
          <PreviewLines count={3} />
        </div>

        <div className="modern-side">
          <PreviewSection title="Skills" />
          <div className="preview-skill-pill">React</div>
          <div className="preview-skill-pill">Java</div>
          <div className="preview-skill-pill">SQL</div>

          <PreviewSection title="Education" />
          <PreviewLines count={2} />
        </div>
      </div>
    </div>
  );
}

function ProfessionalPreview() {
  return (
    <div className="preview-professional-paper">
      <div className="professional-header">
        <div className="preview-name">ALEX MORGAN</div>
        <div className="preview-role">SOFTWARE ENGINEER</div>
        <div className="professional-contact">
          Mumbai • +91 98765 • alex@email.com
        </div>
      </div>

      <PreviewSection title="Professional Summary" />
      <PreviewLines count={3} />

      <PreviewSection title="Experience" />
      <div className="professional-job">
        <div className="job-heading">
          <span>Software Engineer</span>
          <small>2024–Present</small>
        </div>
        <PreviewLines count={2} />
      </div>

      <PreviewSection title="Education" />
      <PreviewLines count={2} />

      <PreviewSection title="Skills" />
      <PreviewLines count={2} />
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="preview-minimal-paper">
      <div className="minimal-name">Alex Morgan</div>
      <div className="minimal-role">Computer Engineering Student</div>

      <div className="minimal-contact">
        Mumbai | email@email.com | linkedin.com
      </div>

      <div className="minimal-divider" />

      <PreviewSection title="PROFILE" />
      <PreviewLines count={3} />

      <PreviewSection title="EDUCATION" />
      <PreviewLines count={2} />

      <PreviewSection title="EXPERIENCE" />
      <PreviewLines count={3} />

      <PreviewSection title="SKILLS" />
      <PreviewLines count={2} />
    </div>
  );
}

function CreativePreview() {
  return (
    <div className="preview-creative-paper">
      <div className="creative-top">
        <div className="creative-avatar">AM</div>
        <div>
          <div className="creative-name">Alex Morgan</div>
          <div className="creative-role">Creative Technologist</div>
        </div>
      </div>

      <div className="creative-body">
        <div className="creative-sidebar">
          <PreviewSection title="Contact" />
          <PreviewLines count={3} />

          <PreviewSection title="Skills" />
          <div className="creative-dot-row">
            <span />
            <span />
            <span />
          </div>
          <div className="creative-dot-row">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="creative-main">
          <PreviewSection title="About Me" />
          <PreviewLines count={3} />

          <PreviewSection title="Experience" />
          <PreviewLines count={4} />

          <PreviewSection title="Projects" />
          <PreviewLines count={3} />
        </div>
      </div>
    </div>
  );
}

function ExecutivePreview() {
  return (
    <div className="preview-executive-paper">
      <div className="executive-banner">
        <div className="executive-name">ALEX MORGAN</div>
        <div className="executive-title">SENIOR TECHNOLOGY PROFESSIONAL</div>
      </div>

      <div className="executive-content">
        <div className="executive-contact">
          MUMBAI • INDIA • EMAIL • PHONE
        </div>

        <PreviewSection title="Executive Profile" />
        <PreviewLines count={3} />

        <div className="executive-two-col">
          <div>
            <PreviewSection title="Leadership" />
            <PreviewLines count={4} />
          </div>

          <div>
            <PreviewSection title="Expertise" />
            <PreviewLines count={4} />
          </div>
        </div>

        <PreviewSection title="Career History" />
        <PreviewLines count={4} />
      </div>
    </div>
  );
}

function TechPreview() {
  return (
    <div className="preview-tech-paper">
      <div className="tech-sidebar">
        <div className="tech-avatar">&lt;/&gt;</div>
        <div className="tech-side-name">Alex</div>

        <div className="tech-side-label">STACK</div>
        <div className="tech-chip">React</div>
        <div className="tech-chip">Node</div>
        <div className="tech-chip">SQL</div>
        <div className="tech-chip">Python</div>
      </div>

      <div className="tech-main">
        <div className="tech-main-name">Alex Morgan</div>
        <div className="tech-main-role">
          Full Stack Developer
        </div>

        <PreviewSection title="Projects" />
        <PreviewLines count={4} />

        <PreviewSection title="Experience" />
        <PreviewLines count={3} />

        <PreviewSection title="Education" />
        <PreviewLines count={2} />
      </div>
    </div>
  );
}

function StudentPreview() {
  return (
    <div className="preview-student-paper">
      <div className="student-heading">
        <div className="student-icon">
          <GraduationCap size={17} />
        </div>
        <div>
          <div className="student-name">Alex Morgan</div>
          <div className="student-role">
            Computer Engineering Student
          </div>
        </div>
      </div>

      <div className="student-contact">
        Mumbai • Email • LinkedIn • GitHub
      </div>

      <div className="student-highlight">
        <span>CGPA</span>
        <strong>9.5</strong>
      </div>

      <PreviewSection title="Education" />
      <PreviewLines count={3} />

      <PreviewSection title="Projects" />
      <PreviewLines count={4} />

      <PreviewSection title="Achievements" />
      <PreviewLines count={2} />
    </div>
  );
}

function AcademicPreview() {
  return (
    <div className="preview-academic-paper">
      <div className="academic-header">
        <div className="academic-name">Alex Morgan</div>
        <div className="academic-subtitle">
          Research & Computer Engineering
        </div>
        <div className="academic-contact">
          Mumbai, India | email@email.com
        </div>
      </div>

      <div className="academic-line" />

      <PreviewSection title="Education" />
      <PreviewLines count={3} />

      <PreviewSection title="Research Interests" />
      <PreviewLines count={3} />

      <PreviewSection title="Publications & Projects" />
      <PreviewLines count={4} />

      <PreviewSection title="Academic Achievements" />
      <PreviewLines count={2} />
    </div>
  );
}

function DeveloperPreview() {
  return (
    <div className="preview-developer-paper">
      <div className="developer-terminal">
        <div className="terminal-dots">
          <span />
          <span />
          <span />
        </div>
        <span>resume.js</span>
      </div>

      <div className="developer-header">
        <Code2 size={22} />
        <div>
          <div className="developer-name">
            Alex Morgan
          </div>
          <div className="developer-role">
            Software Developer
          </div>
        </div>
      </div>

      <div className="developer-grid">
        <div>
          <PreviewSection title="Projects" />
          <PreviewLines count={4} />

          <PreviewSection title="Experience" />
          <PreviewLines count={3} />
        </div>

        <div className="developer-right">
          <PreviewSection title="Tech Stack" />
          <div className="code-pill">JS</div>
          <div className="code-pill">React</div>
          <div className="code-pill">Python</div>
          <div className="code-pill">SQL</div>

          <PreviewSection title="GitHub" />
          <PreviewLines count={2} />
        </div>
      </div>
    </div>
  );
}

function CorporatePreview() {
  return (
    <div className="preview-corporate-paper">
      <div className="corporate-top">
        <div>
          <div className="corporate-name">Alex Morgan</div>
          <div className="corporate-role">
            Business Technology Analyst
          </div>
        </div>

        <div className="corporate-contact">
          MUMBAI<br />
          +91 98765<br />
          EMAIL
        </div>
      </div>

      <div className="corporate-blue-line" />

      <PreviewSection title="Professional Summary" />
      <PreviewLines count={3} />

      <PreviewSection title="Professional Experience" />
      <PreviewLines count={4} />

      <PreviewSection title="Core Competencies" />
      <div className="corporate-skills">
        <span>Leadership</span>
        <span>Analytics</span>
        <span>Strategy</span>
      </div>

      <PreviewSection title="Education" />
      <PreviewLines count={2} />
    </div>
  );
}

function ClassicPreview() {
  return (
    <div className="preview-classic-paper">
      <div className="classic-header">
        <div className="classic-name">Alex Morgan</div>
        <div className="classic-contact">
          Mumbai, India • email@email.com • Phone
        </div>
      </div>

      <div className="classic-rule" />

      <PreviewSection title="OBJECTIVE" />
      <PreviewLines count={3} />

      <PreviewSection title="EDUCATION" />
      <PreviewLines count={3} />

      <PreviewSection title="EXPERIENCE" />
      <PreviewLines count={4} />

      <PreviewSection title="SKILLS" />
      <PreviewLines count={2} />
    </div>
  );
}

function ElegantPreview() {
  return (
    <div className="preview-elegant-paper">
      <div className="elegant-left">
        <div className="elegant-monogram">AM</div>
        <div className="elegant-vertical-line" />
      </div>

      <div className="elegant-main">
        <div className="elegant-name">Alex Morgan</div>
        <div className="elegant-role">
          Computer Engineering Professional
        </div>

        <div className="elegant-contact">
          Mumbai • India • Email • LinkedIn
        </div>

        <PreviewSection title="Profile" />
        <PreviewLines count={3} />

        <PreviewSection title="Experience" />
        <PreviewLines count={4} />

        <PreviewSection title="Education" />
        <PreviewLines count={2} />
      </div>
    </div>
  );
}

function PortfolioPreview() {
  return (
    <div className="preview-portfolio-paper">
      <div className="portfolio-hero">
        <div className="portfolio-avatar">
          AM
        </div>
        <div>
          <div className="portfolio-name">
            Alex Morgan
          </div>
          <div className="portfolio-role">
            Designer • Developer • Creator
          </div>
        </div>
      </div>

      <div className="portfolio-intro">
        Building digital experiences through technology
        and creativity.
      </div>

      <div className="portfolio-projects">
        <div className="portfolio-project">
          <div className="project-color-block" />
          <strong>Project One</strong>
          <span>Web App</span>
        </div>

        <div className="portfolio-project">
          <div className="project-color-block second" />
          <strong>Project Two</strong>
          <span>AI Product</span>
        </div>
      </div>

      <PreviewSection title="Experience" />
      <PreviewLines count={3} />

      <PreviewSection title="Skills" />
      <PreviewLines count={2} />
    </div>
  );
}

function ATSSimplePreview() {
  return (
    <div className="preview-ats-paper">
      <div className="ats-name">ALEX MORGAN</div>
      <div className="ats-contact">
        Mumbai, India | Email | Phone | LinkedIn
      </div>

      <div className="ats-rule" />

      <PreviewSection title="SUMMARY" />
      <PreviewLines count={3} />

      <PreviewSection title="EDUCATION" />
      <PreviewLines count={3} />

      <PreviewSection title="EXPERIENCE" />
      <PreviewLines count={4} />

      <PreviewSection title="SKILLS" />
      <PreviewLines count={2} />

      <PreviewSection title="CERTIFICATIONS" />
      <PreviewLines count={2} />
    </div>
  );
}

/* =========================================================
   SHARED MINI PREVIEW HELPERS
   ========================================================= */

function PreviewSection({ title }) {
  return (
    <div className="preview-section-title">
      {title}
    </div>
  );
}

function PreviewLines({ count = 3 }) {
  return (
    <div className="preview-lines">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`preview-line ${
            index === 0
              ? 'long'
              : index === 1
                ? 'medium'
                : ''
          }`}
        />
      ))}
    </div>
  );
}

/* =========================================================
   MAIN TEMPLATE SELECTION
   ========================================================= */

export default function TemplateSelection({
  onBackToDashboard,
  onContinue,
}) {
  const [selectedTemplate, setSelectedTemplate] =
    useState('modern');

  const [resumeType, setResumeType] = useState('all');
  const [layout, setLayout] = useState('all');
  const [columns, setColumns] = useState('all');

  const templates = [
    /* =========================
       EXISTING 6 TEMPLATES
       ========================= */

    {
      id: 'modern',
      name: 'Modern',
      description:
        'Clean and stylish for students & freshers',
      tag: 'POPULAR',
      accent: 'purple',
      type: 'fresher',
      layout: 'modern',
      columns: 'two',
    },

    {
      id: 'professional',
      name: 'Professional',
      description:
        'Classic layout for corporate careers',
      tag: 'CORPORATE',
      accent: 'blue',
      type: 'professional',
      layout: 'classic',
      columns: 'single',
    },

    {
      id: 'minimal',
      name: 'Minimal',
      description:
        'Simple, clean and highly ATS-friendly',
      tag: 'ATS FRIENDLY',
      accent: 'black',
      type: 'ats',
      layout: 'minimal',
      columns: 'single',
    },

    {
      id: 'creative',
      name: 'Creative',
      description:
        'Stand out with a modern visual layout',
      tag: 'CREATIVE',
      accent: 'pink',
      type: 'creative',
      layout: 'modern',
      columns: 'two',
    },

    {
      id: 'executive',
      name: 'Executive',
      description:
        'Premium design for experienced professionals',
      tag: 'PREMIUM',
      accent: 'gold',
      type: 'executive',
      layout: 'classic',
      columns: 'two',
    },

    {
      id: 'tech',
      name: 'Tech',
      description:
        'Designed for developers & tech careers',
      tag: 'TECH',
      accent: 'green',
      type: 'developer',
      layout: 'modern',
      columns: 'two',
    },

    /* =========================
       NEW 8 TEMPLATES
       ========================= */

    {
      id: 'student',
      name: 'Student',
      description:
        'Designed for students, freshers & campus opportunities',
      tag: 'STUDENT',
      accent: 'purple',
      type: 'student',
      layout: 'modern',
      columns: 'two',
    },

    {
      id: 'academic',
      name: 'Academic',
      description:
        'Focused layout for education, research & academics',
      tag: 'ACADEMIC',
      accent: 'blue',
      type: 'academic',
      layout: 'classic',
      columns: 'single',
    },

    {
      id: 'developer',
      name: 'Developer',
      description:
        'Project and skills focused for software developers',
      tag: 'DEVELOPER',
      accent: 'green',
      type: 'developer',
      layout: 'modern',
      columns: 'single',
    },

    {
      id: 'corporate',
      name: 'Corporate',
      description:
        'Professional structure for business careers',
      tag: 'CORPORATE',
      accent: 'blue',
      type: 'corporate',
      layout: 'classic',
      columns: 'single',
    },

    {
      id: 'classic',
      name: 'Classic',
      description:
        'Traditional resume design that keeps things simple',
      tag: 'CLASSIC',
      accent: 'black',
      type: 'classic',
      layout: 'classic',
      columns: 'single',
    },

    {
      id: 'elegant',
      name: 'Elegant',
      description:
        'Refined and balanced design for professional profiles',
      tag: 'ELEGANT',
      accent: 'gold',
      type: 'elegant',
      layout: 'classic',
      columns: 'two',
    },

    {
      id: 'portfolio',
      name: 'Portfolio',
      description:
        'Visual layout for projects, creative work & portfolios',
      tag: 'PORTFOLIO',
      accent: 'pink',
      type: 'portfolio',
      layout: 'modern',
      columns: 'two',
    },

    {
      id: 'ats-simple',
      name: 'ATS Simple',
      description:
        'Straightforward format optimized for ATS readability',
      tag: 'ATS',
      accent: 'black',
      type: 'ats',
      layout: 'minimal',
      columns: 'single',
    },
  ];

  const filteredTemplates = templates.filter(
    (template) => {
      const matchesType =
        resumeType === 'all' ||
        template.type === resumeType;

      const matchesLayout =
        layout === 'all' ||
        template.layout === layout;

      const matchesColumns =
        columns === 'all' ||
        template.columns === columns;

      return (
        matchesType &&
        matchesLayout &&
        matchesColumns
      );
    }
  );

  const handleContinue = () => {
    onContinue(selectedTemplate);
  };

  const renderTemplatePreview = (template) => {
    switch (template.id) {
      case 'modern':
        return <ModernPreview />;

      case 'professional':
        return <ProfessionalPreview />;

      case 'minimal':
        return <MinimalPreview />;

      case 'creative':
        return <CreativePreview />;

      case 'executive':
        return <ExecutivePreview />;

      case 'tech':
        return <TechPreview />;

      case 'student':
        return <StudentPreview />;

      case 'academic':
        return <AcademicPreview />;

      case 'developer':
        return <DeveloperPreview />;

      case 'corporate':
        return <CorporatePreview />;

      case 'classic':
        return <ClassicPreview />;

      case 'elegant':
        return <ElegantPreview />;

      case 'portfolio':
        return <PortfolioPreview />;

      case 'ats-simple':
        return <ATSSimplePreview />;

      default:
        return <ModernPreview />;
    }
  };

  return (
    <div className="template-page">
      {/* NAVBAR */}
      <nav className="template-navbar">
        <button
          className="template-back-btn"
          onClick={onBackToDashboard}
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>

        <div className="template-logo">
          <div className="template-logo-icon">
            <Sparkles size={19} />
          </div>

          <span>ResuMate</span>

          <div className="template-ai-badge">
            <Sparkles size={11} />
            AI
          </div>
        </div>

        <div className="template-navbar-spacer" />
      </nav>

      {/* MAIN */}
      <main className="template-main">
        {/* HEADER */}
        <div className="template-header">
          <div className="template-eyebrow">
            <Sparkles size={13} />
            RESUME TEMPLATES
          </div>

          <h1>
            Choose your <span>resume template</span>
          </h1>

          <p>
            Pick a design that matches your career goals.
            You can change your template anytime.
          </p>
        </div>

        {/* FILTER BAR */}
        <div className="template-filter-bar">
          <div className="template-filter-heading">
            <SlidersHorizontal size={17} />
            <span>Customize your search</span>
          </div>

          {/* RESUME TYPE */}
          <div className="template-filter-group">
            <label htmlFor="resume-type">
              Resume Type
            </label>

            <select
              id="resume-type"
              value={resumeType}
              onChange={(e) =>
                setResumeType(e.target.value)
              }
            >
              <option value="all">
                All Types
              </option>

              <option value="student">
                Student
              </option>

              <option value="fresher">
                Fresher
              </option>

              <option value="professional">
                Professional
              </option>

              <option value="corporate">
                Corporate
              </option>

              <option value="academic">
                Academic
              </option>

              <option value="ats">
                ATS Friendly
              </option>

              <option value="creative">
                Creative
              </option>

              <option value="executive">
                Executive
              </option>

              <option value="developer">
                Developer / Tech
              </option>

              <option value="classic">
                Classic
              </option>

              <option value="elegant">
                Elegant
              </option>

              <option value="portfolio">
                Portfolio
              </option>
            </select>
          </div>

          {/* LAYOUT */}
          <div className="template-filter-group">
            <label htmlFor="resume-layout">
              Layout
            </label>

            <select
              id="resume-layout"
              value={layout}
              onChange={(e) =>
                setLayout(e.target.value)
              }
            >
              <option value="all">
                All Layouts
              </option>

              <option value="modern">
                Modern
              </option>

              <option value="classic">
                Classic
              </option>

              <option value="minimal">
                Minimal
              </option>
            </select>
          </div>

          {/* COLUMNS */}
          <div className="template-filter-group">
            <label htmlFor="resume-columns">
              Columns
            </label>

            <select
              id="resume-columns"
              value={columns}
              onChange={(e) =>
                setColumns(e.target.value)
              }
            >
              <option value="all">
                All Columns
              </option>

              <option value="single">
                Single Column
              </option>

              <option value="two">
                Two Columns
              </option>
            </select>
          </div>
        </div>

        {/* TEMPLATE COUNT */}
        <div className="template-results-count">
          Showing{' '}
          <strong>
            {filteredTemplates.length}
          </strong>{' '}
          template
          {filteredTemplates.length !== 1
            ? 's'
            : ''}
        </div>

        {/* TEMPLATE GRID */}
        <div className="template-grid">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`template-card ${
                selectedTemplate === template.id
                  ? 'selected'
                  : ''
              }`}
              onClick={() =>
                setSelectedTemplate(template.id)
              }
            >
              {/* PREVIEW */}
              <div
                className={`template-preview template-preview-${template.accent} preview-${template.id}`}
              >
                {renderTemplatePreview(template)}

                {/* SELECTED CHECK */}
                {selectedTemplate === template.id && (
                  <div className="template-selected-check">
                    <Check size={16} />
                  </div>
                )}
              </div>

              {/* CARD INFO */}
              <div className="template-card-info">
                <div className="template-card-top">
                  <h2>
                    {template.name}
                  </h2>

                  <span className="template-tag">
                    {template.tag}
                  </span>
                </div>

                <p>
                  {template.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* NO RESULTS */}
        {filteredTemplates.length === 0 && (
          <div className="template-no-results">
            <FileText size={28} />

            <h3>
              No templates found
            </h3>

            <p>
              Try changing your filters to see more
              templates.
            </p>

            <button
              type="button"
              onClick={() => {
                setResumeType('all');
                setLayout('all');
                setColumns('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* BOTTOM */}
        <div className="template-bottom">
          <div className="template-tip">
            <FileText size={17} />

            <div>
              <strong>
                You can change your template later
              </strong>

              <span>
                Your information will stay saved.
              </span>
            </div>
          </div>

          <button
            className="template-continue-btn"
            onClick={handleContinue}
          >
            Continue with{' '}
            <strong>
              {
                templates.find(
                  (template) =>
                    template.id === selectedTemplate
                )?.name
              }
            </strong>

            <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
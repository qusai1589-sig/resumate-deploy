import {
  ArrowRight,
  Sparkles,
  CheckCircle,
  ShieldCheck,
  Zap,
  MousePointer2,
} from 'lucide-react';

import './Hero.css';

export default function Hero({ onCreateResume, onExploreTemplates }) {
  return (
    <header className="hero-section" id="hero">
      <div className="container">
        <div className="hero-grid">

          {/* Left Hero Content — KEEP AS IT IS */}
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={15} className="hero-badge-icon" />
              <span>Next-Gen AI Resume Platform</span>
            </div>

            <h1 className="hero-title">
              Build a Resume That <br />
              <span className="hero-title-highlight">
                Gets You Noticed
              </span>
            </h1>

            <p className="hero-description">
              Create a professional, ATS-friendly resume in minutes with smart
              tools designed to help you stand out.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={onCreateResume}
              >
                <span>Create My Resume</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={onExploreTemplates}
              >
                Explore Templates
              </button>
            </div>

            <div className="hero-trust-row">
              <div className="trust-item">
                <CheckCircle size={16} className="trust-check" />
                <span>No Credit Card Needed</span>
              </div>

              <div className="trust-item">
                <CheckCircle size={16} className="trust-check" />
                <span>ATS-Friendly Formatting</span>
              </div>

              <div className="trust-item">
                <CheckCircle size={16} className="trust-check" />
                <span>Instant PDF Export</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual — ANIMATED RESUME */}
          <div className="hero-visual">
            <div className="mockup-wrapper animated-resume-wrapper">

              <div className="mockup-glow" />

              {/* ATS Badge */}
              <div className="floating-badge badge-top-right">
                <div className="floating-icon-box">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <div className="floating-label">
                    ATS Score
                  </div>

                  <div className="floating-val">
                    98/100 • Excellent
                  </div>
                </div>
              </div>

              {/* AI Badge */}
              <div className="floating-badge badge-bottom-left">
                <div className="floating-icon-box">
                  <Zap size={20} />
                </div>

                <div>
                  <div className="floating-label">
                    AI Optimization
                  </div>

                  <div className="floating-val">
                    Metrics Auto-Enriched
                  </div>
                </div>
              </div>

              {/* Resume */}
              <div className="resume-mockup-card animated-resume-card">

                {/* Dummy Profile Photo */}
                <div className="mockup-profile-row">
                  <div className="dummy-profile-photo">
                    <div className="dummy-head" />
                    <div className="dummy-body" />
                  </div>

                  <div className="mockup-header profile-header-content">
                    <div className="mockup-candidate-name animated-name">
                      Alex Morgan
                    </div>

                    <div className="mockup-candidate-role animated-role">
                      Software Engineer & Frontend Specialist
                    </div>

                    <div className="mockup-contact-pills">
                      <span>Austin, TX</span>
                      <span>•</span>
                      <span>alex.morgan@techmail.io</span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="mockup-section">
                  <div className="mockup-section-title">
                    Professional Summary
                  </div>

                  <p className="mockup-summary-text">
                    Innovative developer with 3+ years architecting
                    high-performance React web applications. Proven record
                    increasing conversion by 28% and decreasing latency
                    through modern state design.
                  </p>
                </div>

                {/* Experience */}
                <div className="mockup-section">
                  <div className="mockup-section-title">
                    Experience
                  </div>

                  <div className="mockup-item-header">
                    <span className="mockup-item-title">
                      Frontend Developer
                    </span>

                    <span className="mockup-item-date">
                      2023 - Present
                    </span>
                  </div>

                  <div className="mockup-item-company">
                    CloudScale Technologies
                  </div>

                  <ul className="mockup-bullet-list">
                    <li>
                      Engineered responsive component library used by 12+ agile
                      product squads.
                    </li>

                    <li>
                      Integrated real-time analytics reducing telemetry
                      response overhead by 34%.
                    </li>
                  </ul>
                </div>

                {/* Skills */}
                <div
                  className="mockup-section animated-skills-section"
                  style={{ marginBottom: 0 }}
                >
                  <div className="mockup-section-title">
                    Core Skills
                  </div>

                  <div className="mockup-skills-grid">
                    <span className="mockup-skill-chip highlight">
                      React.js
                    </span>

                    <span className="mockup-skill-chip highlight">
                      JavaScript
                    </span>

                    <span className="mockup-skill-chip animated-new-skill">
                      Python
                    </span>

                    <span className="mockup-skill-chip">
                      TypeScript
                    </span>

                    <span className="mockup-skill-chip highlight">
                      Vite
                    </span>

                    <span className="mockup-skill-chip">
                      REST APIs
                    </span>
                   </div>

  <div className="ai-edit-highlight">
    <span>AI is improving this section...</span>
  </div>

  <div className="ai-edit-check">
    ✓ Updated
  </div>

  <div className="animated-resume-cursor">
    <MousePointer2 size={22} />
  </div>
</div>

                {/* AI Editing Highlight */}
                <div className="ai-edit-highlight">
                  <Sparkles size={13} />
                  <span>AI improving your resume...</span>
                </div>

                {/* Animated Cursor */}
                <div className="animated-resume-cursor">
                  <MousePointer2 size={25} />
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
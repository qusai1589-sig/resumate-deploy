import { useState } from 'react';
import { Bot, Sparkles, FileCheck, FileSearch, Wand2, FileText, CheckCircle2 } from 'lucide-react';
import { aiFeaturesData } from '../../data/aiFeaturesData';
import useScrollReveal from '../../hooks/useScrollReveal';
import './AIFeatureSection.css';

const ICON_MAP = {
  Bot: Bot,
  Sparkles: Sparkles,
  FileCheck: FileCheck,
  FileSearch: FileSearch
};

export default function AIFeatureSection() {
  const [activeTabId, setActiveTabId] = useState('ai-generator');
  const sectionRef = useScrollReveal();

  return (
    <section className="section ai-section" id="ai-features" ref={sectionRef}>
      <div className="container">
        <div className="section-header reveal-init">
          <div className="section-tag">
            <Sparkles size={14} />
            <span>ResuMate Intelligence</span>
          </div>
          <h2 className="section-title">
            Intelligent Tools Engineered to Give You the Edge
          </h2>
          <p className="section-subtitle">
            Harness modern artificial intelligence to construct, refine, and stress-test your resume
            against modern recruitment pipelines.
          </p>
        </div>

        <div className="ai-showcase-container">
          {/* Left Feature Tabs */}
          <div className="ai-tabs-list">
            {aiFeaturesData.map((feature) => {
              const IconComponent = ICON_MAP[feature.iconName] || Sparkles;
              const isActive = activeTabId === feature.id;

              return (
                <button
                  type="button"
                  key={feature.id}
                  className={`ai-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTabId(feature.id)}
                >
                  <div className="ai-tab-icon">
                    <IconComponent size={22} />
                  </div>
                  <div className="ai-tab-content">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Live Interactive Mock Console */}
          <div className="ai-preview-console">
            <div className="console-header">
              <div className="console-dots">
                <span className="console-dot dot-red" />
                <span className="console-dot dot-yellow" />
                <span className="console-dot dot-green" />
              </div>
              <div className="console-status">
                <span className="console-status-indicator" />
                <span>AI Engine Ready</span>
              </div>
            </div>

            {/* Dynamic View for Tab 1: AI Generator */}
            {activeTabId === 'ai-generator' && (
              <div className="mock-generator-view">
                <div className="mock-prompt-box">
                  <div className="mock-prompt-label">User Target Role</div>
                  <div>&quot;Frontend Developer (React / JavaScript), Entry-to-Mid Level&quot;</div>
                </div>

                <div className="mock-result-box">
                  <div className="mock-result-badge">
                    <Wand2 size={12} />
                    <span>Auto-Generated Summary</span>
                  </div>
                  <p className="mock-result-text">
                    &quot;Passionate Frontend Engineer proficient in modern JavaScript, React component hierarchies,
                    and clean state management. Adept at transforming complex UX wireframes into accessible,
                    high-converting web applications.&quot;
                  </p>
                </div>
              </div>
            )}

            {/* Dynamic View for Tab 2: Improve Resume Content */}
            {activeTabId === 'improve-content' && (
              <div className="mock-compare-view">
                <div className="compare-card before">
                  <div className="compare-label">Draft Bullet (Passive)</div>
                  <div className="compare-text">
                    &quot;I helped build parts of the customer portal and fixed responsive bugs.&quot;
                  </div>
                </div>

                <div className="compare-card after">
                  <div className="compare-label">AI Enhanced (Action-Oriented + Metrics)</div>
                  <div className="compare-text">
                    &quot;Architected modular React components for the customer portal and eliminated 40+ UI bottlenecks,
                    improving cross-device page speed by 35%.&quot;
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic View for Tab 3: Certificate Extraction */}
            {activeTabId === 'cert-extraction' && (
              <div className="mock-cert-view">
                <div className="cert-file-badge">
                  <FileText size={20} color="#38bdf8" />
                  <div>
                    <strong>AWS_Cloud_Practitioner_Certificate.pdf</strong>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Scanned in 0.4 seconds</div>
                  </div>
                </div>

                <div className="cert-extracted-grid">
                  <div className="cert-extract-card">
                    <div className="cert-extract-label">Issuer & Year</div>
                    <div className="cert-extract-val">Amazon Web Services (2025)</div>
                  </div>
                  <div className="cert-extract-card">
                    <div className="cert-extract-label">Parsed Skills</div>
                    <div className="cert-extract-val">Cloud, IAM, S3, EC2</div>
                  </div>
                  <div className="cert-extract-card">
                    <div className="cert-extract-label">Credential ID</div>
                    <div className="cert-extract-val">AWS-9938-VERIFIED</div>
                  </div>
                  <div className="cert-extract-card">
                    <div className="cert-extract-label">Resume Placement</div>
                    <div className="cert-extract-val">Certifications & Skills</div>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic View for Tab 4: ATS Resume Checker */}
            {activeTabId === 'ats-checker' && (
              <div className="mock-ats-view">
                <div className="ats-score-row">
                  <div className="ats-score-circle">
                    <div className="ats-score-circle-inner">
                      96%
                    </div>
                  </div>
                  <div className="ats-summary">
                    <h4>High ATS Compliance</h4>
                    <p>Matches 94% of keywords for standard modern frontend engineering roles.</p>
                  </div>
                </div>

                <ul className="ats-checklist">
                  <li className="ats-check-item">
                    <CheckCircle2 size={16} className="ats-check-icon" />
                    <span>Single-column standard section hierarchy (Passed)</span>
                  </li>
                  <li className="ats-check-item">
                    <CheckCircle2 size={16} className="ats-check-icon" />
                    <span>No unreadable icons or complex tables in experience block (Passed)</span>
                  </li>
                  <li className="ats-check-item">
                    <CheckCircle2 size={16} className="ats-check-icon" />
                    <span>14 Industry Keywords detected in skills & achievements (Passed)</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

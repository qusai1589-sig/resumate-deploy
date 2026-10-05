import { UserCheck, LayoutGrid, Wand2, Download, Milestone } from 'lucide-react';
import { stepsData } from '../../data/stepsData';
import useScrollReveal from '../../hooks/useScrollReveal';
import './HowItWorks.css';

const ICON_MAP = {
  UserCheck: UserCheck,
  LayoutGrid: LayoutGrid,
  Wand2: Wand2,
  Download: Download
};

export default function HowItWorks() {
  const sectionRef = useScrollReveal();

  return (
    <section className="section how-it-works-section" id="how-it-works" ref={sectionRef}>
      <div className="container">
        <div className="section-header reveal-init">
          <div className="section-tag">
            <Milestone size={14} />
            <span>Workflow</span>
          </div>
          <h2 className="section-title">
            Build Your Job-Ready Resume in 4 Simple Steps
          </h2>
          <p className="section-subtitle">
            From entering your background details to getting an ATS-optimized, high-resolution resume ready for employer applications.
          </p>
        </div>

        <div className="steps-container">
          {stepsData.map((step, idx) => {
            const IconComponent = ICON_MAP[step.iconName] || Milestone;
            return (
              <div 
                className={`step-card reveal-init stagger-${idx + 1}`} 
                key={step.step}
              >
                <div className="step-header">
                  <span className="step-number">{step.step}</span>
                  <div className="step-icon-bubble">
                    <IconComponent size={20} />
                  </div>
                </div>

                <div className="step-badge">{step.badge}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

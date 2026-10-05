import { ArrowRight, CheckCircle2 } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';
import './CTA.css';

export default function CTA({ onCreateResume }) {
  const sectionRef = useScrollReveal();

  return (
    <section className="cta-section" aria-label="Call to Action" ref={sectionRef}>
      <div className="container">
        <div className="cta-banner reveal-init">
          <div className="cta-content">
            <h2 className="cta-title">
              Ready to build your professional resume?
            </h2>
            <p className="cta-subtitle">
              Create a resume that represents your skills, achievements, and potential.
            </p>

            <div>
              <button 
                type="button" 
                className="cta-btn-white"
                onClick={onCreateResume}
              >
                <span>Create My Resume</span>
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="cta-badges-row">
              <div className="cta-badge-item">
                <CheckCircle2 size={16} color="#4ade80" />
                <span>Free to Start</span>
              </div>
              <div className="cta-badge-item">
                <CheckCircle2 size={16} color="#4ade80" />
                <span>No Credit Card Required</span>
              </div>
              <div className="cta-badge-item">
                <CheckCircle2 size={16} color="#4ade80" />
                <span>Instant PDF Download</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

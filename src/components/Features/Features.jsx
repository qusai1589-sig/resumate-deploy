import FeatureCard from './FeatureCard';
import { featuresData } from '../../data/featuresData';
import { Layers } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';
import './Features.css';

export default function Features() {
  const sectionRef = useScrollReveal();

  return (
    <section className="section features-section" id="features" ref={sectionRef}>
      <div className="container">
        <div className="section-header reveal-init">
          <div className="section-tag">
            <Layers size={14} />
            <span>Core Capabilities</span>
          </div>
          <h2 className="section-title">
            Everything You Need to Build a Better Resume
          </h2>
          <p className="section-subtitle">
            Smart tools tailored for university students, career shifters, and driven professionals.
            Craft a standout resume with zero design friction.
          </p>
        </div>

        <div className="features-grid">
          {featuresData.map((feature, idx) => (
            <div key={feature.id} className={`reveal-init stagger-${(idx % 6) + 1}`}>
              <FeatureCard feature={feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

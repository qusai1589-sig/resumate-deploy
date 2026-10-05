import TemplateCard from './TemplateCard';
import { templatesData } from '../../data/templatesData';
import { Sparkles } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';
import './Templates.css';

export default function Templates({ onPreviewTemplate, onUseTemplate }) {
  const sectionRef = useScrollReveal();

  return (
    <section className="section templates-section" id="templates" ref={sectionRef}>
      <div className="container">
        <div className="section-header reveal-init">
          <div className="section-tag">
            <Sparkles size={14} />
            <span>Curated Layouts</span>
          </div>
          <h2 className="section-title">
            Choose a Resume That Matches You
          </h2>
          <p className="section-subtitle">
            Whether you need modern tech flair, executive elegance, or minimalist ATS perfection,
            our templates make sure your experience shines.
          </p>
        </div>

        <div className="templates-grid">
          {templatesData.map((template, idx) => (
            <div key={template.id} className={`reveal-init stagger-${idx + 1}`}>
              <TemplateCard
                template={template}
                onPreview={onPreviewTemplate}
                onUseTemplate={onUseTemplate}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Eye, ArrowRight } from 'lucide-react';

export default function TemplateCard({ template, onPreview, onUseTemplate }) {
  const { preview } = template;

  return (
    <div className="template-card">
      {/* Realistic Mini Resume Viewport */}
      <div className="template-preview-viewport">
        <div className="mini-resume-paper">
          <div className={`mini-header ${template.id}`}>
            <div className="mini-name">{preview.name}</div>
            <div className="mini-role">{preview.title}</div>
          </div>

          <div className="mini-body">
            <div>
              <div className="mini-section-heading">Summary</div>
              <div className="mini-text-line" />
              <div className="mini-text-line short" />
            </div>

            <div>
              <div className="mini-section-heading">Experience</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontWeight: 'bold' }}>
                <span>{preview.experience[0].role}</span>
                <span style={{ color: '#94a3b8' }}>{preview.experience[0].period}</span>
              </div>
              <div className="mini-text-line" />
              <div className="mini-text-line medium" />
            </div>

            <div>
              <div className="mini-section-heading">Skills</div>
              <div className="mini-tag-list">
                {preview.skills.slice(0, 4).map((skill, idx) => (
                  <span key={idx} className="mini-tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hover Overlay with Quick Actions */}
        <div className="template-overlay">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => onPreview(template)}
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => onUseTemplate(template)}
          >
            <span>Use Template</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Card Info */}
      <div className="template-info">
        <div className="template-header-row">
          <h3 className="template-name">{template.name}</h3>
          <span className="template-badge">{template.badge}</span>
        </div>
        <p className="template-desc">{template.description}</p>

        <div className="template-actions">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => onPreview(template)}
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => onUseTemplate(template)}
          >
            <span>Use Template</span>
          </button>
        </div>
      </div>
    </div>
  );
}

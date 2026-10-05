import { X, ArrowRight } from 'lucide-react';
import { ResumePreview } from '../../screens/ResumeBuilder';
import './Modal.css';

const createPreviewResume = (template) => {
  const preview = template.preview;

  return {
    personal: {
      name: preview.name || 'Alex Rivera',
      title: preview.title || 'Software Engineer',
      email: 'alex@example.com',
      phone: '+91 98765 43210',
      location:
        preview.contact?.split('•')[0]?.trim() || 'Mumbai, India',
      linkedin: 'linkedin.com/in/alexrivera',
      github: 'github.com/alexrivera',
      website: 'alexrivera.dev',
    },

    summary:
      preview.summary ||
      'Motivated professional with a strong interest in software development, problem solving and building practical solutions.',

    education: [
      {
        degree:
          preview.education || 'B.E. Computer Engineering',
        institution: 'State University',
        year: '2024 – 2028',
        details: 'CGPA: 9.50',
      },
    ],

    experience:
      preview.experience?.map((item) => ({
        role: item.role,
        company: item.company,
        period: item.period,
        location: '',
        description:
          'Worked on impactful projects, collaborated with the team and contributed to building user-focused solutions.',
      })) || [
        {
          role: 'Software Engineer',
          company: 'NovaTech Solutions',
          period: '2023 - Present',
          location: '',
          description:
            'Worked on software development projects and contributed to building scalable applications.',
        },
      ],

    projects: [
      {
        name: 'AI Resume Builder',
        technologies:
          preview.skills?.slice(0, 4).join(' • ') ||
          'React • JavaScript • AI',
        description:
          'Developed an AI-powered resume builder that helps users create professional and ATS-friendly resumes.',
      },
    ],

    skills:
      preview.skills || [
        'React',
        'JavaScript',
        'Python',
        'Node.js',
      ],

    achievements: [
      'Participated in Smart India Hackathon',
      'Completed technical workshops and certifications',
    ],
  };
};

export default function TemplateModal({
  template,
  onClose,
  onSelect,
}) {
  if (!template) return null;

  const previewResume = createPreviewResume(template);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-content template-preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">
              {template.name}
            </h3>

            <span className="modal-badge">
              {template.category}
            </span>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.925rem',
              marginBottom: '1rem',
            }}
          >
            {template.tagline}
          </p>

          {/* Actual Resume Builder Template */}
          <div className="landing-template-preview">
            <ResumePreview
              resume={previewResume}
              selectedTemplate={template.id}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onSelect(template);
            }}
          >
            <span>Use This Template</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
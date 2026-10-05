import { useState } from 'react';
import { X, UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import './Modal.css';

export default function CertificateModal({ isOpen, onClose }) {
  const [uploadState, setUploadState] = useState('idle'); // idle | analyzing | extracted
  const [selectedFileName, setSelectedFileName] = useState(null);

  if (!isOpen) return null;

  const handleSimulatedUpload = (filename) => {
    setSelectedFileName(filename || 'AWS_Certified_Practitioner.pdf');
    setUploadState('analyzing');
    setTimeout(() => {
      setUploadState('extracted');
    }, 1200);
  };

  const handleReset = () => {
    setUploadState('idle');
    setSelectedFileName(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">Certificate Information Extraction</h3>
            <span className="modal-badge">Feature Preview</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {uploadState === 'idle' && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Test our upcoming OCR vision parser. Click the sample upload below to experience how ResuMate extracts credentials and skills for your resume.
              </p>

              <div 
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-subtle)'
                }}
                onClick={() => handleSimulatedUpload('Google_UX_Design_Certificate.pdf')}
              >
                <UploadCloud size={40} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Click to simulate certificate upload
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  (Sample: Google UX Design Certificate.pdf)
                </p>
              </div>
            </div>
          )}

          {uploadState === 'analyzing' && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Analyzing Certificate Credentials...
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Scanning document structure, extracting issuer, validation hash, and competencies.
              </p>
            </div>
          )}

          {uploadState === 'extracted' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <CheckCircle2 size={24} color="var(--success)" />
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>Credentials Extracted Successfully!</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedFileName}</div>
                </div>
              </div>

              <div className="detailed-preview-box">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div className="dp-section-title" style={{ marginTop: 0 }}>Certificate Name</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      Google UX Design Professional Certificate
                    </div>
                  </div>
                  <div>
                    <div className="dp-section-title" style={{ marginTop: 0 }}>Issuing Body</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      Coursera & Google
                    </div>
                  </div>
                </div>

                <div className="dp-section-title">Verified Skills Mapped</div>
                <div className="dp-skills-wrap">
                  <span className="dp-skill-tag" style={{ background: '#eef2ff', color: 'var(--primary)' }}>Figma</span>
                  <span className="dp-skill-tag" style={{ background: '#eef2ff', color: 'var(--primary)' }}>Wireframing</span>
                  <span className="dp-skill-tag" style={{ background: '#eef2ff', color: 'var(--primary)' }}>User Research</span>
                  <span className="dp-skill-tag" style={{ background: '#eef2ff', color: 'var(--primary)' }}>Usability Testing</span>
                  <span className="dp-skill-tag" style={{ background: '#eef2ff', color: 'var(--primary)' }}>Design Systems</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {uploadState === 'extracted' ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={handleReset}>
                Try Another
              </button>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

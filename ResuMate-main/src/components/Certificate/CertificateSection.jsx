import { Award, Upload, CheckCircle2, FileUp } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';
import './CertificateSection.css';

export default function CertificateSection({ onUploadCertificate }) {
  const sectionRef = useScrollReveal();

  return (
    <section className="section cert-section" id="certificate" ref={sectionRef}>
      <div className="container">
        <div className="cert-card-container reveal-init">
          {/* Left Content */}
          <div className="cert-left-content">
            <div className="cert-section-tag">
              <Award size={15} />
              <span>Smart Verification Feature</span>
            </div>

            <h2 className="cert-heading">
              Turn Your Certificates Into Resume-Ready Achievements
            </h2>

            <p className="cert-description">
              Earned a certification from Coursera, Udemy, Google, or AWS? Soon, you won’t have to manually copy-paste credentials. 
              Upload your certificate, and ResuMate&apos;s intelligent OCR vision will automatically extract your issuing authority, completion date, and verified tech skills.
            </p>

            <ul className="cert-features-list">
              <li className="cert-feature-item">
                <CheckCircle2 size={18} className="cert-feature-check" />
                <span>Instant extraction of credential IDs, issuers, and completion dates</span>
              </li>
              <li className="cert-feature-item">
                <CheckCircle2 size={18} className="cert-feature-check" />
                <span>Auto-maps technical competencies straight into your Skills & Projects sections</span>
              </li>
              <li className="cert-feature-item">
                <CheckCircle2 size={18} className="cert-feature-check" />
                <span>Guarantees verified formatting compliant with ATS screening bots</span>
              </li>
            </ul>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-primary btn-lg"
                onClick={onUploadCertificate}
              >
                <Upload size={18} />
                <span>Upload Certificate</span>
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-lg"
                onClick={onUploadCertificate}
              >
                <Award size={18} />
                <span>Open Certificate Vault</span>
              </button>
            </div>
          </div>

          {/* Right Mock Dropzone */}
          <div className="cert-right-preview">
            <div 
              className="mock-upload-box"
              onClick={onUploadCertificate}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onUploadCertificate()}
            >
              <div className="upload-icon-circle">
                <FileUp size={28} />
              </div>
              <div className="upload-main-text">
                Drop your certificate file here
              </div>
              <div className="upload-sub-text">
                Supports PDF, PNG, or JPG (up to 10MB)
              </div>
              <div className="supported-badge-row">
                <span className="supported-pill">Coursera</span>
                <span className="supported-pill">AWS</span>
                <span className="supported-pill">Udemy</span>
                <span className="supported-pill">Google</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

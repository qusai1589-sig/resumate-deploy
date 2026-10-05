import { useState, useRef, useEffect } from 'react';

import {
  X,
  Award,
  Upload,
  Download,
  Eye,
  Plus,
  CheckCircle,
  Sparkles,
  FileText,
} from 'lucide-react';

import apiClient from '../../services/apiClient';
import DocumentPreview from '../Documents/DocumentPreview';
import { getDocumentForResume, uploadDocuments, combineDocumentsForResume } from '../../services/documentService';

import './CertificateVault.css';

export default function CertificateVaultModal({
  isOpen,
  onClose,
  onUseInResume
}) {
  const [certificates, setCertificates] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [combinedResult, setCombinedResult] = useState(null);
  const [activeTab, setActiveTab] = useState('vault');
  const [selectedCert, setSelectedCert] = useState(null);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const deletingId = null;

  // Upload & OCR state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStep, setUploadStep] = useState('idle');
  const uploadProgress = 0;
  const [ocrStage, setOcrStage] = useState(1);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [extractedData, setExtractedData] = useState(null);

  const fileInputRef = useRef(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null);
  const mapDocument = (doc) => ({
    ...doc, title: doc.file_name, issuer: doc.document_type || 'Document',
    issueDate: doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '',
    credentialId: doc.id, category: doc.document_type || 'Document', skills: doc.resume_data?.skills || [],
    status: doc.status, previewGradient: 'linear-gradient(135deg, #0284c7, #0f172a)', iconType: 'award',
  });
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    apiClient.get('/documents').then(data => {
      if (active) setCertificates(data.documents.map(mapDocument));
    }).catch(error => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen]);
  const handleDownload = async (cert) => {
    setError('');
    try { await apiClient.download(cert); } catch (error) { setError(error.message); }
  };
  if (!isOpen) return null;

  // Handles opening and closing detail modal
  const openDetailModal = (cert) => {
    setSelectedCert(cert);
    setIsDetailClosing(false);
  };

  const closeDetailModal = () => {
    setIsDetailClosing(true);

    setTimeout(() => {
      setSelectedCert(null);
      setIsDetailClosing(false);
    }, 200);
  };

  const handleUseInResume = async (e, cert) => {
    e.stopPropagation();
    if (analyzingId) return;
    setError(''); setAnalyzingId(cert.id);
    try {
      onUseInResume(await getDocumentForResume(cert));
      setSelectedCert(null);
    } catch (error) { setError(error.message); }
    finally { setAnalyzingId(null); }
  };

  const toggleSelection = id => {
    setCombinedResult(null); setError('');
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 5 ? [...current, id] : current);
  };
  const handleCombine = async () => {
    if (analyzingId) return;
    setError(''); setCombinedResult(null); setAnalyzingId('combined');
    try {
      const selected = selectedIds.map(id => certificates.find(cert => cert.id === id)).filter(Boolean);
      setCombinedResult(await combineDocumentsForResume(selected));
    } catch (error) { setError(error.message); }
    finally { setAnalyzingId(null); }
  };

  const startUploadProcess = async (files) => {
    if (!files?.length || uploadStep === 'scanning' || analyzingId) return;
    setError('');
    if (files.length > 5 || Array.from(files).some(file => file.size > 10 * 1024 * 1024)) {
      setError('Select at most 5 files, each no larger than 10 MB.'); return;
    }
    setUploadedFileName(Array.from(files).map(file => file.name).join(', '));
    setUploadStep('scanning'); setOcrStage(2);
    try {
      const result = await uploadDocuments(files);
      if (result.failures.length) setError(result.failures.map(item => `${item.filename}: ${item.error}`).join('; '));
      setCertificates(result.documents.map(mapDocument));
      setSelectedIds(result.uploaded.map(document => document.id)); setCombinedResult(null);
      const processed = result.uploaded[0];
      if (processed) {
        setExtractedData(mapDocument(processed));
        setUploadStep('success'); setOcrStage(4);
      } else setUploadStep('idle');
    } catch (error) { setError(error.message); setUploadStep('idle'); }
  };
  const handleSaveExtractedToVault = () => {
    setActiveTab('vault'); setUploadStep('idle'); setExtractedData(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;

    startUploadProcess(files);
  };

  return (
    <div
      className="vault-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="vault-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="vault-header">
          <div className="vault-title-row">
            <div className="vault-title-icon">
              <Award size={22} />
            </div>

            <div>
              <h3 className="vault-title">
                Certificate Vault
              </h3>

              <p className="vault-subtitle">
                Store, scan, and link your documents
                directly into your resume
              </p>
            </div>
          </div>

          <div className="vault-header-actions">
            <div className="vault-nav-tabs">
              <button
                type="button"
                className={`vault-tab-btn ${
                  activeTab === 'upload' ? 'active' : ''
                }`}
                onClick={() => setActiveTab('upload')}
              >
                <Plus
                  size={14}
                  style={{
                    display: 'inline',
                    marginRight: '4px',
                    verticalAlign: 'middle'
                  }}
                />

                Add New Certificate
              </button>
            </div>

            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close certificate vault"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="vault-body">
          {error && <p role="alert">{error}</p>}
          {loading && <p role="status">Loading your documents…</p>}
          {analyzingId && <p role="status">Reading the document and preparing your resume…</p>}

          {/* TAB 1: VAULT GRID */}
          {activeTab === 'vault' && (
            <div>
              {certificates.length > 0 && <div className="vault-multi-select">
                <p>Select 2–5 certificates to combine their information into one resume summary.</p>
                <div className="vault-multi-actions">
                  <span>{selectedIds.length} selected</span>
                  <button type="button" className="btn btn-primary" disabled={selectedIds.length < 2 || !!analyzingId} onClick={handleCombine}><Sparkles size={16} />{analyzingId === 'combined' ? 'Combining…' : 'Generate Combined Summary'}</button>
                  <button type="button" className="btn btn-secondary" disabled={!!analyzingId || !selectedIds.length} onClick={() => { setSelectedIds([]); setCombinedResult(null); }}>Clear Selection</button>
                </div>
              </div>}
              {combinedResult && <div className="vault-combined-result">
                <h4>Combined Summary</h4>
                <p>{combinedResult.resume_summary}</p>
                <p className="vault-combined-note">Information from all {combinedResult.source_document_ids.length} documents will fill the appropriate resume sections.</p>
                <button type="button" className="btn btn-primary" onClick={() => onUseInResume(combinedResult)}>Choose Template & Use Combined Information</button>
              </div>}
              {certificates.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1rem'
                  }}
                >
                  <Award
                    size={48}
                    color="#94a3b8"
                    style={{ margin: '0 auto 1rem' }}
                  />

                  <h4
                    style={{
                      fontSize: '1.1rem',
                      color: 'var(--text-main)',
                      marginBottom: '0.5rem'
                    }}
                  >
                    No certificates in your vault yet
                  </h4>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      marginBottom: '1.25rem'
                    }}
                  >
                    Upload your first course or degree
                    certificate to automatically extract
                    skills from your documents.
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveTab('upload')}
                  >
                    <Upload size={14} />
                    <span>Upload Certificate</span>
                  </button>
                </div>
              ) : (
                <div className="cert-vault-grid">
                  {certificates.map((cert, index) => {
                    const isDeleting =
                      deletingId === cert.id;

                    return (
                      <div
                        key={cert.id}
                        className={`cert-vault-card stagger-${
                          (index % 6) + 1
                        } ${
                          isDeleting ? 'deleting' : ''
                        }`}
                        style={{
                          animation: `fadeSlideUp 0.35s var(--ease-spring) ${
                            index * 0.08
                          }s both`
                        }}
                      >
                        <label className="vault-select-certificate">
                          <input type="checkbox" checked={selectedIds.includes(cert.id)} disabled={!!analyzingId || (selectedIds.length >= 5 && !selectedIds.includes(cert.id))} onChange={() => toggleSelection(cert.id)} />
                          <span>Select {cert.file_name}</span>
                        </label>
                        {/* Preview Header */}
                        <div
                          className="cert-card-preview-thumb"
                          style={{
                            background:
                              cert.previewGradient
                          }}
                        >
                          <DocumentPreview document={cert} compact />
                        </div>

                        {/* Details */}
                        <div className="cert-card-content">
                          <h4
                            className="cert-card-title"
                            title={cert.title}
                          >
                            {cert.title}
                          </h4>

                          <div className="cert-card-issuer">
                            {cert.issuer} • {cert.issueDate}
                          </div>

                          <div className="cert-card-skills-row">
                            {cert.skills
                              .slice(0, 3)
                              .map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="cert-card-skill-tag"
                                >
                                  {skill}
                                </span>
                              ))}

                            {cert.skills.length > 3 && (
                              <span className="cert-card-skill-tag">
                                +{cert.skills.length - 3}
                              </span>
                            )}
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="cert-card-actions">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() =>
                                openDetailModal(cert)
                              }
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={!!analyzingId}
                              onClick={(e) =>
                                handleUseInResume(
                                  e,
                                  cert
                                )
                              }
                            >
                              <span>Use</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() =>
                                handleDownload(cert)
                              }
                              title="Download Document"
                              aria-label={`Download ${cert.title}`}
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD & AI/OCR PIPELINE */}
          {activeTab === 'upload' && (
            <div>

              {/* Upload Idle State */}
              {uploadStep === 'idle' && (
                <div
                  className={`vault-dropzone ${
                    isDragOver ? 'drag-over' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    fileInputRef.current?.click()
                  }
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        startUploadProcess(e.target.files);
                      }
                    }}
                    accept=".pdf,.png,.jpg,.jpeg"
                  />

                  <div className="dropzone-icon-circle">
                    <Upload size={28} />
                  </div>

                  <div>
                    <h4 className="dropzone-title">
                      Drag & drop your certificate here
                    </h4>

                    <p className="dropzone-subtext">
                      PDF, PNG, JPG, JPEG, WebP — up to 5 files, 10 MB each
                    </p>
                  </div>


                </div>
              )}

              {/* Progress State */}
              {uploadStep === 'uploading' && (
                <div className="upload-progress-container">
                  <div className="progress-header">
                    <span>
                      Uploading Certificate...
                    </span>

                    <span>
                      {uploadProgress}%
                    </span>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${uploadProgress}%`
                      }}
                    />
                  </div>

                  <div className="progress-status-text">
                    <FileText
                      size={15}
                      color="var(--primary)"
                    />

                    <span>
                      {uploadedFileName}
                    </span>
                  </div>
                </div>
              )}

              {/* OCR Scanning State */}
              {uploadStep === 'scanning' && (
                <div className="ocr-pipeline-container">

                  {/* Step Indicators */}
                  <div className="pipeline-steps-bar">
                    <div
                      className={`pipeline-step-node ${
                        ocrStage >= 1
                          ? 'completed'
                          : ''
                      }`}
                    >
                      <div className="step-node-bubble">
                        {ocrStage > 1 ? (
                          <CheckCircle size={16} />
                        ) : (
                          '1'
                        )}
                      </div>

                      <span className="step-node-label">
                        Certificate
                      </span>
                    </div>

                    <div
                      className={`pipeline-step-node ${
                        ocrStage === 2
                          ? 'active'
                          : ocrStage > 2
                          ? 'completed'
                          : ''
                      }`}
                    >
                      <div className="step-node-bubble">
                        {ocrStage > 2 ? (
                          <CheckCircle size={16} />
                        ) : (
                          '2'
                        )}
                      </div>

                      <span className="step-node-label">
                        Scanning
                      </span>
                    </div>

                    <div
                      className={`pipeline-step-node ${
                        ocrStage === 3
                          ? 'active'
                          : ocrStage > 3
                          ? 'completed'
                          : ''
                      }`}
                    >
                      <div className="step-node-bubble">
                        {ocrStage > 3 ? (
                          <CheckCircle size={16} />
                        ) : (
                          '3'
                        )}
                      </div>

                      <span className="step-node-label">
                        Extracting
                      </span>
                    </div>

                    <div
                      className={`pipeline-step-node ${
                        ocrStage === 4
                          ? 'completed'
                          : ''
                      }`}
                    >
                      <div className="step-node-bubble">
                        4
                      </div>

                      <span className="step-node-label">
                        Extracted
                      </span>
                    </div>
                  </div>

                  {/* Laser Scanning Visual Preview */}
                  <div className="scanner-preview-box">
                    <div className="scan-laser-line" />

                    <div className="scan-document-mock">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}
                      >
                        <Award
                          size={18}
                          color="#38bdf8"
                        />

                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                        >
                          {uploadedFileName}
                        </span>
                      </div>

                      <div className="scan-doc-line" />
                      <div className="scan-doc-line medium" />
                      <div className="scan-doc-line short" />

                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#94a3b8',
                          marginTop: '6px'
                        }}
                      >
                        {ocrStage === 2
                          ? 'Scanning certificate text & document structure...'
                          : 'Extracting information from your document…'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {uploadStep === 'success' && extractedData && (
                <div className="extraction-success-card">
                  <h4>Document uploaded</h4>
                  <p>Your original document is saved in your private vault. Use it to fill your resume, then review and edit the information.</p>
                  <DocumentPreview key={extractedData.id} document={extractedData} />
                  <div className="detail-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleSaveExtractedToVault}>Back to Vault</button>
                    {selectedIds.length > 1 && <button type="button" className="btn btn-primary" disabled={!!analyzingId} onClick={() => { setActiveTab('vault'); handleCombine(); }}>Combine Uploaded Certificates</button>}
                    <button type="button" className="btn btn-primary" disabled={!!analyzingId} onClick={e => handleUseInResume(e, extractedData)}>
                      <Sparkles size={15} />{analyzingId ? 'Reading document…' : 'Use in Resume'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Certificate Detail Modal */}
      {selectedCert && (
        <div
          className="cert-detail-backdrop"
          onClick={closeDetailModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`cert-detail-dialog ${
              isDetailClosing ? 'closing' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-header">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background:
                      'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Award size={18} />
                </div>

                <h4 className="detail-title">
                  {selectedCert.category}
                </h4>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeDetailModal}
                aria-label="Close detail modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="detail-body">
              <h3>{selectedCert.file_name}</h3>
              <DocumentPreview key={selectedCert.id} document={selectedCert} />
              {error && <p role="alert">{error}</p>}
              {analyzingId && <p role="status">Reading the document and preparing editable resume information…</p>}
            </div>

            <div className="detail-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  handleDownload(selectedCert)
                }
                title="Download this document"
              >
                <Download size={16} />

                <span
                  style={{
                    fontSize: '0.8rem',
                    marginLeft: '6px'
                  }}
                >
                  Download
                </span>
              </button>

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={closeDetailModal}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!!analyzingId}
                  onClick={(e) =>
                    handleUseInResume(
                      e,
                      selectedCert
                    )
                  }
                >
                  <Sparkles size={14} />

                  <span>
                    Use in Resume
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
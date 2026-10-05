import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';

export default function DocumentPreview({ document, compact = false }) {
  const [preview, setPreview] = useState({ url: '', error: '', loading: true });
  useEffect(() => {
    let active = true;
    let objectURL;
    if (!document?.id) return;
    apiClient.request(`/documents/${document.id}/file`, { blob: true }).then(blob => {
      objectURL = URL.createObjectURL(blob);
      if (active) setPreview({ url: objectURL, error: '', loading: false });
      else URL.revokeObjectURL(objectURL);
    }).catch(error => { if (active) setPreview({ url: '', error: error.message, loading: false }); });
    return () => { active = false; if (objectURL) URL.revokeObjectURL(objectURL); };
  }, [document?.id]);
  if (preview.error) return <p role="alert" className="document-preview-message">{preview.error}</p>;
  if (!preview.url) return <p role="status" className="document-preview-message">Loading document…</p>;
  if (document.mime_type === 'application/pdf') {
    if (compact) return <span className="document-preview-message">PDF document — select View to open</span>;
    return <iframe className="document-pdf-preview" src={preview.url} title={`Preview of ${document.file_name}`} />;
  }
  return <img className={`document-image-preview ${compact ? 'compact' : ''}`} src={preview.url} alt={document.file_name || 'Uploaded certificate'} />;
}

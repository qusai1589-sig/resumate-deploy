import { FileText, Plus, ArrowLeft } from 'lucide-react';
import './YourResumes.css';
export default function YourResumes({ resumes, onOpen, onCreate, onBack }) {
  return <main className="your-resumes-page">
    <button className="btn btn-secondary" onClick={onBack}><ArrowLeft size={16} />Dashboard</button>
    <div className="your-resumes-heading"><div><h1>Your Resumes</h1><p>Saved in this browser for your account.</p></div><button className="btn btn-primary" onClick={onCreate}><Plus size={16} />Create Resume</button></div>
    {resumes.length ? <div className="saved-resume-grid">{resumes.map(entry => <article key={entry.id} className="saved-resume-card">
      <FileText size={28} /><h2>{entry.title}</h2><p>{entry.template} template</p><p>Saved {new Date(entry.updated_at).toLocaleString()}</p>
      <button className="btn btn-primary" onClick={() => onOpen(entry)}>Open & Edit</button>
    </article>)}</div> : <div className="saved-resume-empty"><FileText size={40} /><h2>No saved resumes yet</h2><p>Create a resume or use a certificate, then choose Save in the resume builder.</p></div>}
  </main>;
}

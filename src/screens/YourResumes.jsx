import { FileText, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import './YourResumes.css';
export default function YourResumes({ resumes, onOpen, onCreate, onBack, embedded = false, onViewAll }) {
  const Container = embedded ? 'section' : 'main';
  const Heading = embedded ? 'h2' : 'h1';
  const visible = embedded ? resumes.slice(0, 3) : resumes;
  return <Container className={embedded ? 'dashboard-resume-library dashboard-section' : 'your-resumes-page'} aria-label="My Resumes">
    {!embedded && <button className="btn btn-secondary" onClick={onBack}><ArrowLeft size={16} />Dashboard</button>}
    <div className="your-resumes-heading"><div><Heading>My Resumes <span className="resume-library-count">{resumes.length}</span></Heading><p>Your saved resumes, ready to open and edit. Saved in this browser for your account.</p></div><div className="resume-library-actions">{embedded && <button className="btn btn-secondary" onClick={onViewAll}>View all resumes<ArrowRight size={16} /></button>}<button className="btn btn-primary" onClick={onCreate}><Plus size={16} />Create Resume</button></div></div>
    {visible.length ? <div className="saved-resume-grid">{visible.map(entry => <article key={entry.id} className="saved-resume-card">
      <div className="saved-resume-icon"><FileText size={26} /></div><h3>{entry.title}</h3><p>{entry.template} template</p><p>Saved {new Date(entry.updated_at).toLocaleString()}</p>
      <button className="btn btn-primary" onClick={() => onOpen(entry)}>Open & Edit<ArrowRight size={16} /></button>
    </article>)}</div> : <div className="saved-resume-empty"><FileText size={40} /><h3>No saved resumes yet</h3><p>Create a resume or use a certificate, then choose Save in the resume builder.</p><button className="btn btn-primary" onClick={onCreate}><Plus size={16} />Create Your First Resume</button></div>}
  </Container>;
}

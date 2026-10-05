import { useEffect, useRef, useState } from 'react';
import { Home, FileText, Award, LayoutDashboard, LogOut } from 'lucide-react';
import './AccountMenu.css';

export default function AccountMenu({ user, onHome, onResumes, onDashboard, onVault, onLogout }) {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const initial = Array.from(name.trim())[0]?.toUpperCase() || 'U';
  useEffect(() => {
    if (!open) return;
    const closeOutside = event => { if (!container.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', closeOutside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const choose = action => { setOpen(false); action?.(); };
  return <div className="account-menu" ref={container}>
    <button className="account-avatar" ref={trigger} type="button" aria-label={`Account menu for ${name}`} aria-expanded={open} aria-controls="account-options" onClick={() => setOpen(value => !value)}>{initial}</button>
    {open && <div className="account-dropdown" id="account-options">
      <div className="account-details"><strong>{name}</strong><span>{user?.email}</span></div>
      <button type="button" onClick={() => choose(onResumes)}><FileText size={16} />Your Resumes</button>
      <button type="button" onClick={() => choose(onHome)}><Home size={16} />Home Page</button>
      <button type="button" onClick={() => choose(onDashboard)}><LayoutDashboard size={16} />Dashboard</button>
      <button type="button" onClick={() => choose(onVault)}><Award size={16} />Certificate Vault</button>
      <button className="account-logout" type="button" onClick={() => choose(onLogout)}><LogOut size={16} />Logout</button>
    </div>}
  </div>;
}

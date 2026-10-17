import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, Bot, Check, ChevronDown, ImagePlus, LoaderCircle, MessageCircle, RefreshCw, Settings2, ShieldCheck, Sparkles, X } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { prepareChatAvatar } from '../../services/chatProfile';
import './AIChatbot.css';

const defaultProfile = { name: 'ResuMate', avatar: null };
const suggestions = ['Help me write a professional summary', 'Improve a resume bullet point', 'How can I improve my ATS readiness?'];
function Avatar({ profile, small = false }) {
  return <span className={`chat-avatar ${small ? 'chat-avatar-small' : ''}`}>{profile.avatar ? <img src={profile.avatar} alt="" /> : <Bot size={small ? 17 : 23} strokeWidth={1.7} />}</span>;
}
export default function AIChatbot({ user, isOpen, onToggle }) {
  const [turns, setTurns] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [draft, setDraft] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const profileLock = useRef(false);
  const alive = useRef(true);
  const end = useRef(null);
  const field = useRef(null);
  const launcher = useRef(null);
  const outboxKey = `resumate.chat.pending.${user.id}`;
  const outbox = () => {
    try { return JSON.parse(localStorage.getItem(outboxKey) || 'null'); } catch { return null; }
  };
  useEffect(() => {
    alive.current = true;
    let active = true;
    apiClient.request('/chat', { expectedUserId: user.id }).then(data => {
      if (!active) return;
      let pending;
      try { pending = JSON.parse(localStorage.getItem(outboxKey) || 'null'); } catch { /* Storage unavailable. */ }
      setTurns(pending && !data.turns.some(turn => turn.id === pending.id) ? [...data.turns, pending] : data.turns);
      setOffset(data.nextOffset); setReady(true);
    }).catch(error => { if (active) setError(error.message); });
    apiClient.request('/chat/profile', { expectedUserId: user.id }).then(data => {
      if (!active) return;
      setProfile(data.profile); setDraft(data.profile); setProfileReady(true);
    }).catch(error => { if (active) setProfileError(error.message); });
    return () => { active = false; alive.current = false; };
  }, [outboxKey, user.id]);
  useEffect(() => { if (isOpen && !editing) end.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, busy, isOpen, editing]);
  useEffect(() => { if (isOpen && !editing) field.current?.focus(); }, [isOpen, editing, ready]);
  function close() { onToggle(); launcher.current?.focus(); }
  async function loadHistory(older = false) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const data = await apiClient.request(`/chat${older ? `?offset=${offset}` : ''}`, { expectedUserId: user.id });
      if (!alive.current) return;
      const pending = outbox();
      setTurns(current => older ? [...data.turns.filter(turn => !current.some(item => item.id === turn.id)), ...current] : pending && !data.turns.some(turn => turn.id === pending.id) ? [...data.turns, pending] : data.turns);
      setOffset(data.nextOffset); setReady(true);
    } catch (error) { if (alive.current) setError(error.message); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  async function openSettings() {
    setDraft(profile); setNotice(''); setEditing(true);
    if (profileReady) return;
    setProfileBusy(true); setProfileError('');
    try {
      const data = await apiClient.request('/chat/profile', { expectedUserId: user.id });
      if (alive.current) { setProfile(data.profile); setDraft(data.profile); setProfileReady(true); }
    } catch (error) { if (alive.current) setProfileError(error.message); }
    finally { if (alive.current) setProfileBusy(false); }
  }
  async function choosePicture(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || profileLock.current) return;
    profileLock.current = true; setProfileBusy(true); setProfileError('');
    try { const avatar = await prepareChatAvatar(file); if (alive.current) setDraft(current => ({ ...current, avatar })); }
    catch (error) { if (alive.current) setProfileError(error.message); }
    finally { profileLock.current = false; if (alive.current) setProfileBusy(false); }
  }
  async function saveProfile(event) {
    event.preventDefault();
    if (profileLock.current || !profileReady) return;
    profileLock.current = true; setProfileBusy(true); setProfileError('');
    try {
      const data = await apiClient.request('/chat/profile', { method: 'POST', body: draft, expectedUserId: user.id });
      if (alive.current) { setProfile(data.profile); setEditing(false); setNotice('Assistant profile saved to your account.'); }
    } catch (error) { if (alive.current) setProfileError(error.message); }
    finally { profileLock.current = false; if (alive.current) setProfileBusy(false); }
  }
  async function send(existing, suggested) {
    if (lock.current || !ready || (!existing && turns.some(turn => !turn.reply))) return;
    const content = existing?.content || suggested || input.trim();
    if (!content) return;
    const turn = existing || { id: crypto.randomUUID(), content, reply: null, created_at: new Date().toISOString() };
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { localStorage.setItem(outboxKey, JSON.stringify(turn)); } catch { /* The server still saves the question. */ }
    if (!existing) { setTurns(current => [...current, turn]); setInput(''); }
    try {
      const data = await apiClient.request('/chat', { method: 'POST', body: { id: turn.id, content: turn.content }, expectedUserId: user.id });
      try { if (outbox()?.id === turn.id) localStorage.removeItem(outboxKey); } catch { /* Reply is saved on the server. */ }
      if (alive.current) setTurns(current => current.map(item => item.id === turn.id ? data.turn : item));
    } catch (error) { if (alive.current) setError(error.message); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  const blocked = busy || !ready || turns.some(turn => !turn.reply);
  return <>
    <button ref={launcher} className="chat-launcher" onClick={onToggle} aria-expanded={isOpen} aria-controls="saved-chat"><Avatar profile={profile} small /><span>{isOpen ? 'Close assistant' : `Ask ${profile.name}`}</span>{isOpen ? <ChevronDown size={17} /> : <Sparkles size={16} />}</button>
    {isOpen && <section className="saved-chat" id="saved-chat" role="dialog" aria-label={`${profile.name}, your resume assistant`} onKeyDown={event => { if (event.key === 'Escape') close(); }}>
      <header className="chat-header"><Avatar profile={profile} /><div className="chat-header-copy"><strong>{profile.name}</strong><small>Your personal resume assistant</small></div><button className="chat-icon-button" onClick={openSettings} aria-label="Customize assistant" title="Customize assistant"><Settings2 size={18} /></button><button className="chat-icon-button" onClick={close} aria-label="Close chat"><X size={19} /></button></header>
      {editing ? <form className="chat-profile-editor" onSubmit={saveProfile}>
        <button type="button" className="chat-text-button" onClick={() => setEditing(false)}><ArrowLeft size={15} /> Back to conversation</button>
        <div className="chat-profile-heading"><span className="chat-eyebrow">MAKE IT YOURS</span><h2>A familiar face.<br />A name you choose.</h2><p>Personalize your assistant. Your style follows you on every device.</p></div>
        <div className="chat-avatar-editor"><Avatar profile={draft} /><label className="chat-upload"><ImagePlus size={16} /> Choose photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePicture} disabled={profileBusy || !profileReady} /></label>{draft.avatar && <button type="button" className="chat-text-button" disabled={profileBusy} onClick={() => setDraft(current => ({ ...current, avatar: null }))}>Remove</button>}</div>
        <span className="chat-image-hint">PNG, JPG or WebP · up to 5 MB · cropped to a square</span>
        <label className="chat-name-label" htmlFor="assistant-name">Assistant name</label><input id="assistant-name" className="chat-name-input" value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} maxLength={40} required disabled={profileBusy || !profileReady} autoComplete="off" />
        <p className="chat-setting-note"><ShieldCheck size={15} /> Saved privately to your account.</p>
        {profileError && <p className="chat-error" role="alert">{profileError}</p>}
        <button className="chat-save-profile" disabled={profileBusy || !profileReady || !draft.name.trim()}>{profileBusy ? <LoaderCircle size={17} className="chat-spinner" /> : <Check size={17} />} Save assistant</button>
      </form> : <>
        <div className="chat-account-strip"><ShieldCheck size={13} /><span>Private conversation · {user.email}</span></div>
        <div className="chat-transcript" role="log" aria-live="polite" aria-label="Conversation">
          {!ready && !error && <p className="chat-status"><LoaderCircle size={16} className="chat-spinner" /> Bringing back your conversation…</p>}
          {ready && !turns.length && <div className="chat-welcome"><span className="chat-welcome-icon"><Sparkles size={26} /></span><span className="chat-eyebrow">A LITTLE GUIDANCE, A BIG NEXT STEP</span><h2>Let’s shape<br />your next chapter.</h2><p>I’m {profile.name}. Bring your questions, rough drafts, or a little career uncertainty. We’ll work through it together.</p><div className="chat-suggestions">{suggestions.map(text => <button key={text} disabled={blocked} onClick={() => send(null, text)}><MessageCircle size={15} /><span>{text}</span><ArrowUp size={15} /></button>)}</div></div>}
          {offset !== null && <button className="chat-load-older" disabled={busy} onClick={() => loadHistory(true)}>Load older messages</button>}
          {turns.map(turn => <div className="chat-turn" key={turn.id}><div className="chat-message-label chat-user-label">You</div><p className="chat-question">{turn.content}</p>{turn.reply ? <><div className="chat-message-label"><Avatar profile={profile} small /><span>{profile.name}</span></div><p className="chat-reply">{turn.reply}</p></> : !busy && <div className="chat-pending"><span>Your question is waiting for a reply.</span><button onClick={() => send(turn)}><RefreshCw size={13} /> Retry reply</button></div>}</div>)}
          {busy && <p className="chat-status" role="status"><LoaderCircle size={16} className="chat-spinner" /> {profile.name} is working on it…</p>}
          <div ref={end} />
        </div>
        {error && <p className="chat-error" role="alert">{error}</p>}
        {notice && <p className="chat-notice" role="status"><Check size={13} />{notice}</p>}
        <div className="chat-composer-wrap"><form className="chat-composer" onSubmit={event => { event.preventDefault(); send(); }}><textarea ref={field} aria-label="Your message" placeholder={`Message ${profile.name}…`} maxLength={6000} value={input} onChange={event => setInput(event.target.value)} disabled={blocked} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} /><button aria-label="Send message" disabled={blocked || !input.trim()}><ArrowUp size={21} /></button></form><div className="chat-footer"><span>Saved to your account</span><button disabled={busy} onClick={() => loadHistory()} aria-label="Refresh saved conversation" title="Refresh saved conversation"><RefreshCw size={13} /> Sync</button></div></div>
      </>}
    </section>}
  </>;
}

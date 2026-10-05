import { useState } from 'react';

import {
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Rocket,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

import './Login.css';
import { authenticate, googleLogin, getAuthClient } from '../services/authService';

export default function Login({
  onContinueToDashboard,
  authMode = 'signup',
  onSwitchMode,
}) {
  const isSignIn = authMode === 'signin';
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const runAuth = async () => {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      if (await authenticate(authMode, email, password, fullName)) onContinueToDashboard();
      else { setStep(4); setMessage('Check your email to confirm your account, then sign in.'); }
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const handleGoogle = async () => {
    setBusy(true); setMessage('');
    try { await googleLogin(); } catch (error) { setMessage(error.message); setBusy(false); }
  };

  const [step, setStep] = useState(1);

  const [profile, setProfile] = useState('');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [forgotPasswordMessage, setForgotPasswordMessage] =
    useState('');

  const profiles = [
    {
      id: 'student',
      title: 'Student',
      description: 'Build your resume while studying',
      icon: GraduationCap,
    },
    {
      id: 'fresher',
      title: 'Fresher',
      description: 'Start your career with confidence',
      icon: Rocket,
    },
    {
      id: 'professional',
      title: 'Professional',
      description: 'Take your career to the next level',
      icon: Briefcase,
    },
  ];

  /* =====================================================
     SIGN UP FLOW
  ===================================================== */

  const handleSignupNext = () => {
    if (step === 1 && !profile) return;

    if (step === 2 && !email) return;

    if (step === 3) { runAuth(); return; }

    setStep((currentStep) => currentStep + 1);
  };

  const handleSignupBack = () => {
    setStep((currentStep) =>
      Math.max(1, currentStep - 1)
    );
  };

  /* =====================================================
     SIGN IN FLOW
  ===================================================== */

  const handleSignIn = runAuth;
  const handleForgotPassword = async () => {
    if (!email) { setForgotPasswordMessage('Enter your email address first.'); return; }
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setForgotPasswordMessage('Check your email for password reset instructions.');
    } catch (error) { setForgotPasswordMessage(error.message); }
  };

  return (
    <div className="login-page">

      {/* Background decoration */}
      <div className="login-bg-shape login-bg-shape-one"></div>

      <div className="login-bg-shape login-bg-shape-two"></div>

      {/* Navbar */}
      <nav className="login-navbar">

        <div className="login-logo">

          <div className="login-logo-icon">
            <Sparkles size={20} />
          </div>

          <span>ResuMate</span>

          <div className="login-ai-badge">

            <Sparkles size={11} />

            AI

          </div>

        </div>

      </nav>

      {/* Main */}
      <main className="login-main">
        {message && <p role="status">{message}</p>}
        {busy && <p role="status">Connecting…</p>}

        {/* =================================================
            SIGN IN
        ================================================= */}

        {isSignIn ? (
          <>

            <div className="login-card">

              <div className="login-step">

                <div className="login-icon-wrapper">
                  <Sparkles size={24} />
                </div>

                <p className="login-eyebrow">
                  WELCOME BACK
                </p>

                <h1>
                  Sign in to your
                  <span> ResuMate account</span>
                </h1>

                <p className="login-description">
                  Access your saved resumes, templates and
                  Certificate Vault.
                </p>

                {/* EMAIL */}

                <div className="login-field">

                  <label htmlFor="signin-email">
                    Email address
                  </label>

                  <input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                  />

                </div>

                {/* PASSWORD */}

                <div className="login-field">

                  <label htmlFor="signin-password">
                    Password
                  </label>

                  <div className="password-input-wrapper">

                    <input
                      id="signin-password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (visible) => !visible
                        )
                      }
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                </div>

                {/* FORGOT PASSWORD */}

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    alignSelf: 'flex-end',
                    border: 'none',
                    background: 'transparent',
                    color: '#6c4df6',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    marginTop: '-4px',
                  }}
                >
                  Forgot password?
                </button>

                {forgotPasswordMessage && (
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      marginTop: '0.6rem',
                      textAlign: 'center',
                    }}
                  >
                    {forgotPasswordMessage}
                  </p>
                )}

                {/* SIGN IN BUTTON */}

                <button
                  type="button"
                  className="login-primary-btn"
                  disabled={busy} onClick={handleSignIn}
                >
                  Sign In
                  <ArrowRight size={18} />
                </button>

                {/* CREATE ACCOUNT */}

                <p
                  style={{
                    textAlign: 'center',
                    marginTop: '1.2rem',
                    fontSize: '0.85rem',
                    color: '#64748b',
                  }}
                >
                  Don't have an account?{' '}

                  <button
                    type="button"
                    onClick={onSwitchMode}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#6c4df6',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Create Account
                  </button>

                </p>

              </div>

            </div>

            <p className="login-footer">

              By continuing, you agree to ResuMate's Terms
              and Privacy Policy.

            </p>

          </>
        ) : (

          /* =================================================
             SIGN UP
          ================================================= */

          <>

            {/* Progress */}

            {step <= 3 && (
              <div className="login-progress">

                <div
                  className={`login-progress-line ${
                    step >= 2
                      ? 'active'
                      : ''
                  }`}
                />

                <div
                  className={`login-progress-line ${
                    step >= 3
                      ? 'active'
                      : ''
                  }`}
                />

              </div>
            )}

            <div className="login-card">

              {/* STEP 1 — PROFILE */}

              {step === 1 && (

                <div className="login-step">

                  <div className="login-icon-wrapper">
                    <Sparkles size={24} />
                  </div>

                  <p className="login-eyebrow">
                    CREATE YOUR ACCOUNT
                  </p>

                  <h1>
                    Let's build your
                    <span> future</span>
                  </h1>

                  <p className="login-description">
                    Tell us a little about yourself so we
                    can personalize your resume-building
                    experience.
                  </p>

                  <div className="profile-options">

                    {profiles.map((item) => {

                      const Icon = item.icon;

                      return (

                        <button
                          key={item.id}
                          type="button"
                          className={`profile-option ${
                            profile === item.id
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() =>
                            setProfile(item.id)
                          }
                        >

                          <div className="profile-icon">

                            <Icon size={23} />

                          </div>

                          <div className="profile-text">

                            <strong>
                              {item.title}
                            </strong>

                            <span>
                              {item.description}
                            </span>

                          </div>

                          {profile === item.id && (

                            <CheckCircle2
                              className="profile-check"
                              size={20}
                            />

                          )}

                        </button>

                      );

                    })}

                  </div>

                  <button
                    type="button"
                    className="login-primary-btn"
                    disabled={busy} onClick={handleSignupNext}
                  >
                    Continue
                    <ArrowRight size={18} />
                  </button>

                </div>

              )}

              {/* STEP 2 — EMAIL */}

              {step === 2 && (

                <div className="login-step">

                  <div className="login-icon-wrapper">
                    <Sparkles size={24} />
                  </div>

                  <p className="login-eyebrow">
                    STEP 2 OF 3
                  </p>

                  <h1>
                    What's your
                    <span> email?</span>
                  </h1>

                  <p className="login-description">
                    We'll use this email to save your
                    resumes and keep your account secure.
                  </p>

                  <div className="login-field">
                    <label htmlFor="signup-name">Full name</label>
                    <input id="signup-name" type="text" autoComplete="name" maxLength={120} placeholder="Your full name" value={fullName} onChange={event => setFullName(event.target.value)} />
                  </div>

                  <div className="login-field">

                    <label htmlFor="signup-email">
                      Email address
                    </label>

                    <input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                    />

                  </div>

                  <button
                    type="button"
                    className="login-primary-btn"
                    disabled={busy} onClick={handleSignupNext}
                  >
                    Continue
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    className="login-back-btn"
                    onClick={handleSignupBack}
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>

                </div>

              )}

              {/* STEP 3 — PASSWORD */}

              {step === 3 && (

                <div className="login-step">

                  <div className="login-icon-wrapper">
                    <Sparkles size={24} />
                  </div>

                  <p className="login-eyebrow">
                    STEP 3 OF 3
                  </p>

                  <h1>
                    Create your
                    <span> password</span>
                  </h1>

                  <p className="login-description">
                    Choose a password so you can return
                    to your ResuMate account later.
                  </p>

                  <div className="login-field">

                    <label htmlFor="signup-password">
                      Password
                    </label>

                    <div className="password-input-wrapper">

                      <input
                        id="signup-password"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) =>
                          setPassword(
                            event.target.value
                          )
                        }
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowPassword(
                            (visible) => !visible
                          )
                        }
                        aria-label={
                          showPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                  <button
                    type="button"
                    className="login-primary-btn"
                    disabled={busy} onClick={handleSignupNext}
                  >
                    Create Account
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    className="login-back-btn"
                    onClick={handleSignupBack}
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>

                </div>

              )}

              {/* SUCCESS */}

              {step === 4 && (

                <div className="login-step login-success">

                  <div className="success-icon">
                    <CheckCircle2 size={46} />
                  </div>

                  <p className="login-eyebrow">
                    ACCOUNT CREATED
                  </p>

                  <h1>
                    Welcome to
                    <span> ResuMate!</span>
                  </h1>

                  <p className="login-description">
                    Check your email to confirm your account, then sign in to open your vault.
                  </p>

                  <button
                    type="button"
                    className="login-primary-btn"
                    onClick={onSwitchMode}
                  >
                    Continue to Sign In
                    <ArrowRight size={18} />
                  </button>

                </div>

              )}

            </div>

            {step <= 3 && (

              <p className="login-footer">

                By continuing, you agree to ResuMate's Terms
                and Privacy Policy.

              </p>

            )}

          </>

        )}

        {(isSignIn || step !== 4) && <div className="login-google-section">
          <div className="login-google-divider"><span>or continue with</span></div>
          <button type="button" className="login-google-btn" disabled={busy} onClick={handleGoogle}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.88-1.73 2.99-4.28 2.99-7.36Z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.22-2.51c-.89.6-2.02.96-3.39.96-2.61 0-4.82-1.76-5.61-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.39 13.92A6 6 0 0 1 6.08 12c0-.67.11-1.31.31-1.92V7.49H3.07A10 10 0 0 0 2 12c0 1.61.39 3.13 1.07 4.51l3.32-2.59Z" />
              <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.32 2.59C7.18 7.72 9.39 5.96 12 5.96Z" />
            </svg>
            Continue with Google
          </button>
        </div>}
      </main>
    </div>
  );
}
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Mail,
  Smartphone,
  Chrome,
  ShieldCheck,
  LoaderCircle
} from "lucide-react";

import {
  observeAuth,
  signInGoogle,
  requestEmailOtp,
  confirmEmailOtp,
  requestPhoneOtp,
  confirmPhoneOtp,
  logout
} from "./api/auth";

import {
  getStudentProfile
} from "./api/profile";

import Onboarding from "./components/Onboarding";
import IntelligenceDashboard from "./components/IntelligenceDashboard";

const features = [
  "Explore educational pathways",
  "Discover institutions and opportunities",
  "Build your personal academic roadmap"
];

function LoadingScreen({ message }) {
  return (
    <main className="dashboard">
      <div className="welcome">
        <LoaderCircle className="spin" size={30} />
        <p>{message}</p>
      </div>
    </main>
  );
}

function ProfileError({ onRetry, onLogout }) {
  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">W</span>
          WAYMARK
        </a>

        <button className="icon-button" onClick={onLogout}>
          Sign out
        </button>
      </header>

      <section className="welcome">
        <span className="eyebrow">PROFILE SYNCHRONIZATION</span>
        <h1>We couldn't load your profile.</h1>
        <p>
          Your sign-in succeeded, but your student profile
          could not be retrieved. Check your connection and retry.
        </p>

        <button className="primary-button" onClick={onRetry}>
          <ArrowRight size={17} />
          Try again
        </button>
      </section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [mode, setMode] = useState("email");
  const [step, setStep] = useState("identify");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearMessages = useCallback(() => {
    setError("");
    setMessage("");
  }, []);

  const loadProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      setProfileError("");
      return;
    }

    setProfileLoading(true);
    setProfileError("");

    try {
      const existing = await getStudentProfile(currentUser.uid);

      if (existing) {
        setProfile(existing);
      } else {
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email || null,
          phoneNumber: currentUser.phoneNumber || null,
          displayName: currentUser.displayName || null,
          photoURL: currentUser.photoURL || null,
          onboardingCompleted: false
        });
      }
    } catch (err) {
      console.error("WAYMARK profile loading failed:", err);
      setProfileError(
        err?.message || "Unable to load your student profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = observeAuth(async (currentUser) => {
      if (!active) return;

      setUser(currentUser);
      setProfile(null);
      setProfileError("");

      if (!currentUser) {
        setProfileLoading(false);
        setAuthReady(true);
        return;
      }

      setProfileLoading(true);

      try {
        const existing = await getStudentProfile(currentUser.uid);

        if (!active) return;

        if (existing) {
          setProfile(existing);
        } else {
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || null,
            phoneNumber: currentUser.phoneNumber || null,
            displayName: currentUser.displayName || null,
            photoURL: currentUser.photoURL || null,
            onboardingCompleted: false
          });
        }
      } catch (err) {
        console.error("WAYMARK profile loading failed:", err);

        if (active) {
          setProfileError(
            err?.message || "Unable to load your student profile."
          );
        }
      } finally {
        if (active) {
          setProfileLoading(false);
          setAuthReady(true);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function execute(action) {
    setLoading(true);
    clearMessages();

    try {
      await action();
    } catch (err) {
      console.error("WAYMARK authentication error:", err);
      setError(
        err?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function sendEmailCode() {
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    execute(async () => {
      await requestEmailOtp(email.trim());
      setStep("verify");
      setMessage("Verification code sent to your email.");
    });
  }

  function verifyEmailCode() {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit verification code.");
      return;
    }

    execute(() => confirmEmailOtp(email, code));
  }

  function sendPhoneCode() {
    const normalizedPhone = phone.replace(/\s/g, "");

    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setError("Enter a valid phone number with country code.");
      return;
    }

    execute(async () => {
      await requestPhoneOtp(normalizedPhone);
      setStep("verify");
      setMessage("SMS verification code sent.");
    });
  }

  function verifyPhoneCode() {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit verification code.");
      return;
    }

    execute(() => confirmPhoneOtp(code));
  }

  function googleLogin() {
    execute(() => signInGoogle());
  }

  async function signOutUser() {
    try {
      await logout();
      setProfile(null);
      setProfileError("");
      setStep("identify");
      setCode("");
      clearMessages();
    } catch (err) {
      console.error("Sign out failed:", err);
      setError("Unable to sign out. Please try again.");
    }
  }

  function changeMode(nextMode) {
    clearMessages();
    setMode(nextMode);
    setStep("identify");
    setCode("");
  }

  async function retryProfile() {
    if (!user) return;
    await loadProfile(user);
  }

  if (!authReady) {
    return <LoadingScreen message="Connecting to WAYMARK..." />;
  }

  if (user) {
    if (profileLoading) {
      return <LoadingScreen message="Loading your student profile..." />;
    }

    if (profileError) {
      return (
        <ProfileError
          onRetry={retryProfile}
          onLogout={signOutUser}
        />
      );
    }

    if (!profile) {
      return <LoadingScreen message="Preparing your profile..." />;
    }

    if (!profile.onboardingCompleted) {
      return (
        <Onboarding
          user={user}
          onComplete={setProfile}
        />
      );
    }

    return (
      <IntelligenceDashboard
        user={user}
        profile={profile}
        onLogout={signOutUser}
      />
    );
  }

  return (
    <main className="auth-layout">
      <section className="intro-panel">
        <a className="brand" href="/">
          <span className="brand-mark">W</span>
          WAYMARK
        </a>

        <div className="intro-content">
          <span className="eyebrow">EDUCATION. WITHOUT LIMITS.</span>

          <h1>
            Your future has
            <br />
            <span>more than one</span>
            <br />
            direction.
          </h1>

          <p>
            Discover possibilities, understand pathways,
            and make your next educational decision
            with confidence.
          </p>

          <div className="feature-list">
            {features.map((feature) => (
              <div key={feature}>
                <ShieldCheck size={17} />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <footer>
          © 2026 WAYMARK. Building better directions.
        </footer>
      </section>

      <section className="form-panel">
        <div className="auth-card">
          <div className="mobile-brand brand">
            <span className="brand-mark">W</span>
            WAYMARK
          </div>

          <div className="form-heading">
            <span className="eyebrow">YOUR JOURNEY BEGINS</span>

            <h2>
              {step === "identify"
                ? "Welcome aboard."
                : "Verify your identity."}
            </h2>

            <p>
              {step === "identify"
                ? "Sign in or create your WAYMARK account."
                : `Enter the code sent to ${
                    mode === "email" ? email : phone
                  }.`}
            </p>
          </div>

          {step === "identify" && (
            <>
              <div className="auth-tabs">
                <button
                  type="button"
                  className={mode === "email" ? "active" : ""}
                  onClick={() => changeMode("email")}
                >
                  <Mail size={16} />
                  Email
                </button>

                <button
                  type="button"
                  className={mode === "phone" ? "active" : ""}
                  onClick={() => changeMode("phone")}
                >
                  <Smartphone size={16} />
                  Phone
                </button>
              </div>

              {mode === "email" ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendEmailCode();
                  }}
                >
                  <label htmlFor="email">Email address</label>

                  <div className="input-wrap">
                    <Mail size={18} />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                  >
                    {loading && <LoaderCircle className="spin" />}
                    Send verification code
                    {!loading && <ArrowRight size={17} />}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendPhoneCode();
                  }}
                >
                  <label htmlFor="phone">Phone number</label>

                  <div className="input-wrap">
                    <Smartphone size={18} />
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                  >
                    {loading && <LoaderCircle className="spin" />}
                    Send SMS code
                    {!loading && <ArrowRight size={17} />}
                  </button>
                </form>
              )}

              <div className="separator">
                <span>OR CONTINUE WITH</span>
              </div>

              <button
                type="button"
                className="google-button"
                onClick={googleLogin}
                disabled={loading}
              >
                <Chrome size={19} />
                Continue with Google
              </button>
            </>
          )}

          {step === "verify" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                mode === "email"
                  ? verifyEmailCode()
                  : verifyPhoneCode();
              }}
            >
              <label htmlFor="code">
                Six-digit verification code
              </label>

              <div className="input-wrap code-input">
                <ShieldCheck size={18} />
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, ""))
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading && <LoaderCircle className="spin" />}
                Verify and continue
                {!loading && <ArrowRight size={17} />}
              </button>

              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setStep("identify");
                  setCode("");
                  clearMessages();
                }}
              >
                <ArrowLeft size={15} />
                Change {mode === "email" ? "email" : "phone number"}
              </button>
            </form>
          )}

          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="notice success" role="status">
              {message}
            </div>
          )}

          <div id="recaptcha-container" />

          <div className="security-note">
            <ShieldCheck size={16} />
            <span>
              Secure authentication powered by Firebase.
              Your information stays protected.
            </span>
          </div>

          <p className="terms">
            By continuing, you agree to WAYMARK's Terms
            and Privacy Policy.
          </p>
        </div>
      </section>
    </main>
  );
}
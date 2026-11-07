
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Mail,
  Smartphone,
  Chrome,
  ShieldCheck,
  Compass,
  GraduationCap,
  Sparkles,
  LogOut,
  LoaderCircle
} from "lucide-react";

import { db } from "./api/firebase";

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
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

const features = [
  "Explore thousands of educational pathways",
  "Discover institutions and opportunities",
  "Build your personal academic roadmap"
];

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState("email");
  const [step, setStep] = useState("identify");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return observeAuth(async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(userRef);

        const userData = {
          uid: currentUser.uid,
          email: currentUser.email || null,
          phoneNumber: currentUser.phoneNumber || null,
          displayName: currentUser.displayName || null,
          photoURL: currentUser.photoURL || null,
          lastLoginAt: serverTimestamp()
        };

        if (!snapshot.exists()) {
          userData.createdAt = serverTimestamp();
        }

        await setDoc(userRef, userData, { merge: true });

        const updated = await getDoc(userRef);
        setProfile(updated.data());
      } catch (err) {
        console.error("Profile sync failed:", err);
        setError("Signed in, but profile synchronization failed.");
      }
    });
  }, []);

  function clearMessages() {
    setError("");
    setMessage("");
  }

  async function execute(action, successMessage) {
    setLoading(true);
    clearMessages();

    try {
      await action();
      if (successMessage) setMessage(successMessage);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function sendEmailCode() {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    execute(async () => {
      await requestEmailOtp(email);
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
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError("Enter a valid phone number with country code.");
      return;
    }

    execute(async () => {
      await requestPhoneOtp(phone);
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

  function signOutUser() {
    execute(async () => {
      await logout();
      setStep("identify");
      setCode("");
      setMessage("");
    });
  }

  function changeMode(nextMode) {
    clearMessages();
    setMode(nextMode);
    setStep("identify");
    setCode("");
  }

  if (user) {
    return (
      <main className="dashboard">
        <header className="topbar">
          <a className="brand" href="/">
            <span className="brand-mark">W</span>
            WAYMARK
          </a>

          <button className="icon-button" onClick={signOutUser}>
            <LogOut size={17} />
            Sign out
          </button>
        </header>

        <section className="welcome">
          <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>
          <h1>
            Welcome to <span>WAYMARK.</span>
          </h1>
          <p>
            Your identity is verified. Now let's discover
            where your education can take you.
          </p>

          <div className="profile-panel">
            {user.photoURL && (
              <img
                className="avatar"
                src={user.photoURL}
                alt=""
              />
            )}

            <div>
              <strong>{user.displayName || "Student"}</strong>
              <p>{user.email || user.phoneNumber}</p>
              <small>
                {profile ? "Profile synchronized" : "Loading profile..."}
              </small>
            </div>
            <ShieldCheck className="verified-icon" />
          </div>

          <div className="dashboard-links">
            <article>
              <Compass />
              <h3>Discover</h3>
              <p>Explore education opportunities.</p>
            </article>

            <article>
              <GraduationCap />
              <h3>My education</h3>
              <p>Build your academic roadmap.</p>
            </article>

            <article>
              <Sparkles />
              <h3>Guidance</h3>
              <p>Make informed decisions.</p>
            </article>
          </div>

          <p className="coming-note">
            Your WAYMARK workspace is being prepared.
          </p>
        </section>
      </main>
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
                  className={mode === "email" ? "active" : ""}
                  onClick={() => changeMode("email")}
                >
                  <Mail size={16} />
                  Email
                </button>

                <button
                  className={mode === "phone" ? "active" : ""}
                  onClick={() => changeMode("phone")}
                >
                  <Smartphone size={16} />
                  Phone
                </button>
              </div>

              {mode === "email" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
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
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button className="primary-button" disabled={loading}>
                    {loading ? <LoaderCircle className="spin" /> : null}
                    Send verification code
                    {!loading && <ArrowRight size={17} />}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
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
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <button className="primary-button" disabled={loading}>
                    {loading ? <LoaderCircle className="spin" /> : null}
                    Send SMS code
                    {!loading && <ArrowRight size={17} />}
                  </button>
                </form>
              )}

              <div className="separator">
                <span>OR CONTINUE WITH</span>
              </div>

              <button
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
              onSubmit={(e) => {
                e.preventDefault();

                mode === "email"
                  ? verifyEmailCode()
                  : verifyPhoneCode();
              }}
            >
              <label htmlFor="code">Six-digit verification code</label>

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
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, ""))
                  }
                  required
                />
              </div>

              <button className="primary-button" disabled={loading}>
                {loading ? <LoaderCircle className="spin" /> : null}
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

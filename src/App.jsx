
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
  LoaderCircle,
  MapPin,
  Target,
  BookOpen,
  RefreshCw
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

import Onboarding from "./components/Onboarding";

const features = [
  "Explore educational pathways",
  "Discover institutions and opportunities",
  "Build your personal academic roadmap"
];

async function syncUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  const userData = {
    uid: user.uid,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    lastLoginAt: serverTimestamp()
  };

  if (!snapshot.exists()) {
    userData.createdAt = serverTimestamp();
  }

  await setDoc(userRef, userData, { merge: true });

  const updated = await getDoc(userRef);
  return updated.data();
}

function LoadingScreen({ message = "Preparing your WAYMARK experience..." }) {
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
          <LogOut size={17} />
          Sign out
        </button>
      </header>

      <section className="welcome">
        <span className="eyebrow">PROFILE SYNCHRONIZATION</span>
        <h1>Something went wrong.</h1>
        <p>
          Your account is authenticated, but we couldn't load
          your student profile.
        </p>

        <button className="primary-button" onClick={onRetry}>
          <RefreshCw size={17} />
          Try again
        </button>
      </section>
    </main>
  );
}

function StudentDashboard({ user, profile, onLogout }) {
  const name =
    profile?.displayName ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "Student";

  const educationLevel = profile?.educationLevel
    ? profile.educationLevel.replaceAll("-", " ")
    : "Not specified";

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">W</span>
          WAYMARK
        </a>

        <button
          className="icon-button"
          onClick={onLogout}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </header>

      <section className="welcome">
        <span className="eyebrow">YOUR EDUCATION. YOUR DIRECTION.</span>

        <h1>
          Welcome, <span>{name}.</span>
        </h1>

        <p>
          Your next opportunity starts with understanding
          what's possible.
        </p>

        <div className="profile-panel">
          {user.photoURL ? (
            <img
              className="avatar"
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="avatar avatar-placeholder">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="profile-details">
            <strong>{name}</strong>
            <p>{user.email || user.phoneNumber || "WAYMARK student"}</p>
            <small>Student profile synchronized</small>
          </div>

          <ShieldCheck className="verified-icon" />
        </div>

        <div className="dashboard-links">
          <article>
            <Compass />
            <h3>Explore</h3>
            <p>Discover educational possibilities and pathways.</p>
          </article>

          <article>
            <GraduationCap />
            <h3>Education</h3>
            <p>Understand your academic position and next steps.</p>
          </article>

          <article>
            <Sparkles />
            <h3>Guidance</h3>
            <p>Make informed decisions about your future.</p>
          </article>
        </div>

        <section className="student-overview">
          <div className="section-heading">
            <span className="eyebrow">YOUR STUDENT IDENTITY</span>
            <h2>Your academic profile</h2>
          </div>

          <div className="overview-grid">
            <article>
              <GraduationCap size={20} />
              <span>Education level</span>
              <strong>{educationLevel}</strong>
            </article>

            <article>
              <BookOpen size={20} />
              <span>Interests</span>
              <strong>{profile.interests?.length || 0} selected</strong>
            </article>

            <article>
              <Target size={20} />
              <span>Goals</span>
              <strong>{profile.goals?.length || 0} selected</strong>
            </article>

            <article>
              <MapPin size={20} />
              <span>Preferred locations</span>
              <strong>{profile.preferredStates?.length || 0} selected</strong>
            </article>
          </div>

          {profile.stream && (
            <p className="profile-extra">
              <strong>Academic stream:</strong> {profile.stream}
            </p>
          )}

          {profile.interests?.length > 0 && (
            <div className="profile-extra">
              <strong>Your interests</strong>
              <p>{profile.interests.join(" · ")}</p>
            </div>
          )}

          {profile.goals?.length > 0 && (
            <div className="profile-extra">
              <strong>Your goals</strong>
              <p>{profile.goals.join(" · ")}</p>
            </div>
          )}

          {profile.preferredStates?.length > 0 && (
            <div className="profile-extra">
              <strong>Preferred states</strong>
              <p>{profile.preferredStates.join(" · ")}</p>
            </div>
          )}
        </section>

        <section className="catalogue-status">
          <span className="eyebrow">WAYMARK INTELLIGENCE</span>
          <h2>Discover what comes next.</h2>
          <p>
            Your student profile is ready. Verified courses,
            institutions, scholarships and opportunities will
            appear as the official catalogue is populated.
          </p>
          <small>
            WAYMARK only treats records marked as verified
            as confirmed educational information.
          </small>
        </section>
      </section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  const [mode, setMode] = useState("email");
  const [step, setStep] = useState("identify");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const unsubscribe = observeAuth(async (currentUser) => {
      if (!active) return;

      setUser(currentUser);
      setProfile(null);
      setProfileError(false);

      if (!currentUser) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        const studentProfile = await syncUserProfile(currentUser);

        if (!active) return;

        setProfile(studentProfile);
      } catch (err) {
        console.error("Profile synchronization failed:", err);

        if (active) {
          setProfileError(true);
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  function clearMessages() {
    setError("");
    setMessage("");
  }

  async function execute(action) {
    setLoading(true);
    clearMessages();

    try {
      await action();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
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
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError("Enter a valid phone number with country code.");
      return;
    }

    execute(async () => {
      await requestPhoneOtp(phone.trim());
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
    await execute(async () => {
      await logout();

      setProfile(null);
      setCode("");
      setStep("identify");
      clearMessages();
    });
  }

  function changeMode(nextMode) {
    clearMessages();
    setMode(nextMode);
    setStep("identify");
    setCode("");
  }

  async function retryProfileSync() {
    if (!user) return;

    setProfileLoading(true);
    setProfileError(false);

    try {
      const studentProfile = await syncUserProfile(user);
      setProfile(studentProfile);
    } catch (err) {
      console.error("Profile retry failed:", err);
      setProfileError(true);
    } finally {
      setProfileLoading(false);
    }
  }

  // Authenticated application

  if (user) {
    if (profileLoading) {
      return <LoadingScreen />;
    }

    if (profileError || !profile) {
      return (
        <ProfileError
          onRetry={retryProfileSync}
          onLogout={signOutUser}
        />
      );
    }

    if (!profile.onboardingCompleted) {
      return (
        <Onboarding
          user={user}
          onComplete={(savedProfile) => {
            setProfile(savedProfile);
            clearMessages();
          }}
        />
      );
    }

    return (
      <StudentDashboard
        user={user}
        profile={profile}
        onLogout={signOutUser}
      />
    );
  }

  // Authentication application

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

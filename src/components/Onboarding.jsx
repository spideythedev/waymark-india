
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GraduationCap,
  Compass,
  MapPin,
  Sparkles,
  LoaderCircle
} from "lucide-react";

import {
  STUDENT_LEVELS,
  STUDENT_STREAMS,
  STUDENT_INTERESTS,
  STUDENT_GOALS,
  INDIAN_STATES
} from "../data/full-data";

import { saveStudentProfile } from "../api/profile";

const initialForm = {
  educationLevel: "",
  classStandard: "",
  stream: "",
  interests: [],
  goals: [],
  preferredStates: [],
  preferredLanguage: "English"
};

function Choice({ active, children, onClick }) {
  return (
    <button
      type="button"
      className={`choice ${active ? "selected" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
      {active && <Check size={15} />}
    </button>
  );
}

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function toggle(key, value, limit) {
    setForm((current) => {
      const values = current[key];

      if (values.includes(value)) {
        return {
          ...current,
          [key]: values.filter((item) => item !== value)
        };
      }

      if (limit && values.length >= limit) {
        return current;
      }

      return {
        ...current,
        [key]: [...values, value]
      };
    });
  }

  function next() {
    setError("");

    if (step === 0 && !form.educationLevel) {
      setError("Please select your current education level.");
      return;
    }

    if (
      step === 1 &&
      (!form.interests.length || !form.goals.length)
    ) {
      setError("Choose at least one interest and one goal.");
      return;
    }

    setStep((current) => Math.min(current + 1, 2));
  }

  async function finish() {
    if (!form.preferredStates.length) {
      setError("Select at least one preferred study location.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const saved = await saveStudentProfile(user.uid, form);
      onComplete(saved);
    } catch (err) {
      console.error(err);
      setError(
        "We couldn't save your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step + 1) / 3) * 100;

  return (
    <main className="onboarding-layout">
      <header className="onboarding-header">
        <a className="brand" href="/">
          <span className="brand-mark">W</span>
          WAYMARK
        </a>

        <span className="step-counter">
          STEP 0{step + 1} / 03
        </span>
      </header>

      <div className="onboarding-progress">
        <div style={{ width: `${progress}%` }} />
      </div>

      <section className="onboarding-content">
        <div className="onboarding-icon">
          {step === 0 && <GraduationCap size={26} />}
          {step === 1 && <Compass size={26} />}
          {step === 2 && <MapPin size={26} />}
        </div>

        <span className="eyebrow">
          {step === 0 && "ACADEMIC IDENTITY"}
          {step === 1 && "YOUR AMBITIONS"}
          {step === 2 && "YOUR PREFERENCES"}
        </span>

        <h1>
          {step === 0 && <>Where are you <span>right now?</span></>}
          {step === 1 && <>What makes you <span>curious?</span></>}
          {step === 2 && <>Where would you like <span>to go?</span></>}
        </h1>

        <p className="onboarding-description">
          {step === 0 &&
            "Tell us about your current academic stage. We'll use this to identify relevant pathways."}
          {step === 1 &&
            "Your interests aren't restrictions. Choose what excites you, even if you're still exploring."}
          {step === 2 &&
            "Choose the Indian states or territories where you'd consider studying."}
        </p>

        {step === 0 && (
          <div className="onboarding-section">
            <h3>Current education level</h3>

            <div className="choice-grid">
              {STUDENT_LEVELS.map((item) => (
                <Choice
                  key={item.id}
                  active={form.educationLevel === item.id}
                  onClick={() => {
                    update("educationLevel", item.id);
                    update("classStandard", "");
                    update("stream", "");
                  }}
                >
                  {item.label}
                </Choice>
              ))}
            </div>

            {["class-11", "class-12"].includes(form.educationLevel) && (
              <div className="field-group">
                <label>Academic stream</label>

                <div className="choice-grid">
                  {STUDENT_STREAMS.map((item) => (
                    <Choice
                      key={item.id}
                      active={form.stream === item.id}
                      onClick={() => update("stream", item.id)}
                    >
                      {item.label}
                    </Choice>
                  ))}
                </div>
              </div>
            )}

            {["undergraduate", "postgraduate", "diploma"].includes(
              form.educationLevel
            ) && (
              <div className="field-group">
                <label htmlFor="classStandard">
                  Course or current year (optional)
                </label>

                <input
                  id="classStandard"
                  className="onboarding-input"
                  placeholder="e.g. B.Sc Computer Science, Year 2"
                  value={form.classStandard}
                  onChange={(e) =>
                    update("classStandard", e.target.value)
                  }
                  maxLength={100}
                />
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-section">
            <h3>Areas that interest you</h3>
            <p className="section-hint">
              Choose up to 8. You can change these later.
            </p>

            <div className="choice-grid">
              {STUDENT_INTERESTS.map((item) => (
                <Choice
                  key={item}
                  active={form.interests.includes(item)}
                  onClick={() => toggle("interests", item, 8)}
                >
                  {item}
                </Choice>
              ))}
            </div>

            <div className="field-group">
              <h3>What are you working towards?</h3>

              <div className="choice-grid">
                {STUDENT_GOALS.map((item) => (
                  <Choice
                    key={item}
                    active={form.goals.includes(item)}
                    onClick={() => toggle("goals", item, 5)}
                  >
                    {item}
                  </Choice>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-section">
            <h3>Preferred study locations</h3>
            <p className="section-hint">
              Select up to 5 states or territories.
            </p>

            <div className="choice-grid state-grid">
              {INDIAN_STATES.map((state) => (
                <Choice
                  key={state}
                  active={form.preferredStates.includes(state)}
                  onClick={() => toggle("preferredStates", state, 5)}
                >
                  {state}
                </Choice>
              ))}
            </div>

            <div className="field-group">
              <label htmlFor="language">
                Preferred guidance language
              </label>

              <select
                id="language"
                className="onboarding-input"
                value={form.preferredLanguage}
                onChange={(e) =>
                  update("preferredLanguage", e.target.value)
                }
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Kannada">Kannada</option>
                <option value="Bengali">Bengali</option>
                <option value="Marathi">Marathi</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}

        <div className="onboarding-actions">
          {step > 0 && (
            <button
              type="button"
              className="back-button"
              onClick={() => {
                setError("");
                setStep((current) => current - 1);
              }}
              disabled={loading}
            >
              <ArrowLeft size={17} />
              Back
            </button>
          )}

          {step < 2 ? (
            <button
              type="button"
              className="primary-button"
              onClick={next}
            >
              Continue
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={finish}
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle className="spin" />
              ) : (
                <Sparkles size={17} />
              )}
              {loading ? "Saving profile..." : "Create my WAYMARK profile"}
            </button>
          )}
        </div>

        <p className="onboarding-footnote">
          Your answers can be updated anytime. Your preferences
          help personalize discovery; they don't restrict your options.
        </p>
      </section>
    </main>
  );
}


import { useEffect, useMemo, useState } from "react";

import {
  ArrowUpRight,
  BookOpen,
  Building2,
  GraduationCap,
  Landmark,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  LoaderCircle
} from "lucide-react";

import { loadDashboardCatalogue } from "../api/catalogue";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "courses", label: "Courses" },
  { id: "institutions", label: "Institutions" },
  { id: "scholarships", label: "Scholarships" },
  { id: "entranceExams", label: "Entrance exams" }
];

const TYPE_DETAILS = {
  courses: {
    label: "Course",
    icon: BookOpen
  },
  institutions: {
    label: "Institution",
    icon: Building2
  },
  scholarships: {
    label: "Scholarship",
    icon: Landmark
  },
  entranceExams: {
    label: "Entrance examination",
    icon: GraduationCap
  }
};

function getTitle(record) {
  return (
    record.title ||
    record.name ||
    record.examName ||
    "Untitled record"
  );
}

function getDescription(record) {
  return (
    record.description ||
    record.summary ||
    record.shortDescription ||
    "No description has been provided for this record."
  );
}

function getSource(record) {
  return record.sourceName || record.provider || record.authority || "";
}

function RecordCard({ record }) {
  const details = TYPE_DETAILS[record.type] || {
    label: "Record",
    icon: BookOpen
  };

  const Icon = details.icon;

  const externalUrl = record.officialUrl || record.sourceUrl;

  return (
    <article className="catalogue-card">
      <div className="catalogue-card-top">
        <span className="catalogue-type">
          <Icon size={15} />
          {details.label}
        </span>

        <span className="verified-label">
          <ShieldCheck size={14} />
          Verified
        </span>
      </div>

      <h3>{getTitle(record)}</h3>

      <p className="catalogue-description">
        {getDescription(record)}
      </p>

      {getSource(record) && (
        <p className="catalogue-provider">
          {getSource(record)}
        </p>
      )}

      {record.location && (
        <p className="catalogue-provider">
          <MapPin size={14} />
          {record.location}
        </p>
      )}

      {externalUrl ? (
        <a
          className="catalogue-link"
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Official information
          <ArrowUpRight size={16} />
        </a>
      ) : (
        <span className="catalogue-no-link">
          Official link not provided
        </span>
      )}
    </article>
  );
}

function EmptyCatalogue({ filter, search }) {
  if (search) {
    return (
      <div className="catalogue-empty">
        <Search size={26} />
        <h3>No matching records</h3>
        <p>
          No verified records matched "{search}".
          Try another search term.
        </p>
      </div>
    );
  }

  return (
    <div className="catalogue-empty">
      <GraduationCap size={30} />
      <h3>No verified records yet</h3>
      <p>
        {filter === "all"
          ? "The educational catalogue is waiting for verified records from official sources."
          : `There are currently no verified ${FILTERS.find((item) => item.id === filter)?.label.toLowerCase()} records.`}
      </p>
    </div>
  );
}

export default function IntelligenceDashboard({
  user,
  profile,
  onLogout
}) {
  const [records, setRecords] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function refreshCatalogue() {
    setLoading(true);
    setLoadError("");

    try {
      const result = await loadDashboardCatalogue();
      setRecords(result.records);
    } catch (error) {
      console.error("Catalogue loading failed:", error);
      setLoadError(
        "Unable to load the educational catalogue. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshCatalogue();
  }, []);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesType =
        activeFilter === "all" || record.type === activeFilter;

      const searchableText = [
        getTitle(record),
        getDescription(record),
        getSource(record),
        record.category,
        record.location
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesType && searchableText.includes(term);
    });
  }, [records, activeFilter, search]);

  const name =
    profile.displayName ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "Student";

  const totalInterests = profile.interests?.length || 0;
  const totalGoals = profile.goals?.length || 0;

  const counts = useMemo(() => {
    return records.reduce(
      (result, record) => {
        result[record.type] = (result[record.type] || 0) + 1;
        return result;
      },
      {}
    );
  }, [records]);

  return (
    <main className="intelligence-dashboard">
      <header className="intelligence-topbar">
        <a className="brand" href="/">
          <span className="brand-mark">W</span>
          WAYMARK
        </a>

        <div className="topbar-actions">
          <span className="topbar-user">
            {name}
          </span>

          <button
            type="button"
            className="icon-button"
            onClick={onLogout}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      <section className="intelligence-content">
        <div className="dashboard-hero">
          <span className="eyebrow">
            <Sparkles size={14} />
            YOUR EDUCATION INTELLIGENCE
          </span>

          <h1>
            Find your <span>direction.</span>
          </h1>

          <p>
            Explore verified educational opportunities
            and understand the possibilities ahead.
          </p>
        </div>

        <section className="student-summary">
          <div className="student-summary-heading">
            <div>
              <span className="eyebrow">YOUR PROFILE</span>
              <h2>{name}</h2>
              <p>
                {profile.educationLevel?.replaceAll("-", " ") ||
                  "Education level not specified"}
              </p>
            </div>

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
          </div>

          <div className="student-summary-stats">
            <div>
              <GraduationCap size={18} />
              <strong>{totalInterests}</strong>
              <span>Interests</span>
            </div>

            <div>
              <Target size={18} />
              <strong>{totalGoals}</strong>
              <span>Goals</span>
            </div>

            <div>
              <MapPin size={18} />
              <strong>{profile.preferredStates?.length || 0}</strong>
              <span>Preferred states</span>
            </div>
          </div>
        </section>

        <section className="catalogue-section">
          <div className="catalogue-heading">
            <div>
              <span className="eyebrow">OFFICIAL KNOWLEDGE BASE</span>
              <h2>Explore opportunities.</h2>
              <p>
                Information from records reviewed and verified by WAYMARK.
              </p>
            </div>

            <button
              type="button"
              className="refresh-button"
              onClick={refreshCatalogue}
              disabled={loading}
              aria-label="Refresh catalogue"
            >
              {loading ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <RefreshCw size={17} />
              )}
              Refresh
            </button>
          </div>

          <div className="catalogue-counts">
            {FILTERS.slice(1).map((filter) => (
              <div key={filter.id}>
                <strong>{counts[filter.id] || 0}</strong>
                <span>{filter.label}</span>
              </div>
            ))}
          </div>

          <div className="catalogue-toolbar">
            <div className="catalogue-search">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search courses, colleges, scholarships..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="catalogue-filters">
            {FILTERS.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={
                  activeFilter === filter.id ? "active" : ""
                }
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loadError && (
            <div className="catalogue-error" role="alert">
              <p>{loadError}</p>
              <button onClick={refreshCatalogue}>
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="catalogue-loading">
              <LoaderCircle className="spin" size={25} />
              <p>Loading verified opportunities...</p>
            </div>
          ) : !loadError && filteredRecords.length === 0 ? (
            <EmptyCatalogue
              filter={activeFilter}
              search={search}
            />
          ) : (
            <div className="catalogue-grid">
              {filteredRecords.map((record) => (
                <RecordCard
                  key={`${record.type}-${record.id}`}
                  record={record}
                />
              ))}
            </div>
          )}

          {!loading && !loadError && records.length > 0 && (
            <p className="catalogue-footnote">
              Showing verified records currently available in WAYMARK.
              This is not necessarily the complete national catalogue.
            </p>
          )}
        </section>

        <footer className="intelligence-footer">
          <span>WAYMARK · Building better directions.</span>
          <span>Evidence before recommendations.</span>
        </footer>
      </section>
    </main>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, loginWithGoogle } from "./api.js";
import Privacy from "./Privacy";

const filters = ["All", "Urgent", "Read Later", "Ignore"];

const categoryMeta = {
  All: { icon: "✦", label: "Total" },
  Urgent: { icon: "🔴", label: "Urgent" },
  "Read Later": { icon: "🔵", label: "Read Later" },
  Ignore: { icon: "⚫", label: "Ignore" }
};

const features = [
  {
    icon: "📥",
    title: "Reads Your Gmail",
    copy: "Securely connects to your inbox via Google OAuth. No passwords stored."
  },
  {
    icon: "🤖",
    title: "AI Summarization",
    copy: "GPT-powered TL;DRs, priority ratings, and suggested actions for every newsletter."
  },
  {
    icon: "📬",
    title: "Daily Digest",
    copy: "Sends a beautifully formatted digest from your own Gmail account every morning."
  },
  {
    icon: "🔒",
    title: "Fully Isolated",
    copy: "Each user's data and tokens are completely separate. Zero cross-contamination."
  }
];

function categoryClass(category) {
  return (category || "Ignore").toLowerCase().replace(/\s+/g, "-");
}

function getFirstName(user) {
  const source = user?.name || user?.email || "there";
  return source.split("@")[0].trim().split(/\s+/)[0] || "there";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function ThemeToggle({ theme, onToggle, variant = "pill" }) {
  const isDark = theme === "dark";

  return (
    <button
      className={`theme-toggle ${variant === "dashboard" ? "dashboard-toggle" : ""}`}
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      onClick={onToggle}
    >
      <span className="theme-track">
        <span className="theme-thumb" />
      </span>
      <span className="theme-label">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285f4"
        d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h6c-.3 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.3-4.5 3.3-7.6z"
      />
      <path
        fill="#34a853"
        d="M12 23c3 0 5.5-1 7.3-3.2l-3.4-2.6c-.9.6-2.2 1-3.9 1-3 0-5.5-2-6.4-4.8H2.1v2.7C3.9 20.2 7.7 23 12 23z"
      />
      <path
        fill="#fbbc05"
        d="M5.6 13.4c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2V6.7H2.1C1.4 8.1 1 9.7 1 11.4s.4 3.3 1.1 4.7l3.5-2.7z"
      />
      <path
        fill="#ea4335"
        d="M12 4.6c1.6 0 3.1.6 4.2 1.7l3-3C17.5 1.6 15 0.6 12 0.6 7.7 0.6 3.9 3.4 2.1 6.7l3.5 2.7C6.5 6.6 9 4.6 12 4.6z"
      />
    </svg>
  );
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

function Login({ theme, onToggleTheme }) {
  const oauthError = new URLSearchParams(window.location.search).get("error");
  const year = new Date().getFullYear();

  return (
    <main className="login-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <nav className="landing-nav">
        <a className="brand" href="/">
          ✦ Newsletter AI
        </a>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </nav>

      <section className="hero-section">
        {oauthError ? (
          <div className="oauth-banner" role="alert">
            Google sign-in was cancelled or failed. Please try again.
          </div>
        ) : null}

        <p className="hero-badge">Powered by GPT-3.5 · Gmail API · MongoDB</p>
        <h1>
          <span>Your inbox,</span>
          <span className="gradient-text">intelligently summarized.</span>
        </h1>
        <p className="hero-copy">
          Stop drowning in newsletters. Our AI reads your Gmail, extracts what
          matters, and delivers a crisp daily digest — sent from your own
          account.
        </p>
        <button className="google-button" type="button" onClick={loginWithGoogle}>
          <GoogleIcon />
          Continue with Google
        </button>
        <p className="security-note">
          We request Gmail read & send access. Your tokens are encrypted and
          never shared.
        </p>
      </section>

      <section className="feature-grid" aria-label="Newsletter AI features">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <span className="feature-icon">{feature.icon}</span>
            <h2>{feature.title}</h2>
            <p>{feature.copy}</p>
          </article>
        ))}
      </section>

      <footer className="landing-footer">
        <span>© {year} Smart Newsletter Summarizer</span>
        <a href="/privacy">Privacy Policy</a>
      </footer>
    </main>
  );
}

function SummaryCard({ summary, expanded, onToggle }) {
  const email = summary.emailId || {};
  const meta = categoryMeta[summary.category] || categoryMeta.Ignore;
  const hasDigestBadge =
    summary.digestSent || summary.digest_sent || summary.sentInDigest || false;

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  }

  return (
    <article
      className={`summary-card ${categoryClass(summary.category)} ${
        expanded ? "expanded" : ""
      }`}
      tabIndex="0"
      role="button"
      aria-expanded={expanded}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <div className="summary-accent" aria-hidden="true" />
      <div className="summary-topline">
        <span className={`category ${categoryClass(summary.category)}`}>
          {meta.icon} {summary.category}
        </span>
        <span className="summary-date">{formatDate(email.receivedAt)}</span>
        <button
          className="delete-button"
          type="button"
          aria-label="Delete summary"
          onClick={(event) => event.stopPropagation()}
        >
          ×
        </button>
      </div>
      <h2>{email.subject || "Newsletter"}</h2>
      <p className="sender">From: {email.sender || "Unknown sender"}</p>
      <div className="tldr-box">
        <h3>TL;DR</h3>
        <p>{summary.tldr}</p>
      </div>
      <div className={`summary-details ${expanded ? "open" : ""}`}>
        <div className="summary-section">
          <h3>WHY IT MATTERS</h3>
          <p>{summary.why_it_matters}</p>
        </div>
        <div className="summary-section">
          <h3>SUGGESTED ACTION</h3>
          <p>{summary.action}</p>
        </div>
      </div>
      <footer className="card-footer">
        <span>{expanded ? "▲ Less" : "▼ More details"}</span>
        {hasDigestBadge ? <span className="sent-badge">✓ Digest sent</span> : null}
      </footer>
    </article>
  );
}

function Dashboard({ user, onLogout, theme, onToggleTheme }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [summaries, setSummaries] = useState([]);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("success");
  const [loadingAction, setLoadingAction] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const loading = Boolean(loadingAction);
  const firstName = getFirstName(user);

  const loadSummaries = useCallback(async () => {
    const category = activeFilter === "All" ? undefined : activeFilter;
    const data = await api.getSummaries(category);
    setSummaries(data.summaries);
  }, [activeFilter]);

  useEffect(() => {
    loadSummaries().catch((error) => {
      setStatusType("error");
      setStatus(error.message);
    });
  }, [loadSummaries]);

  const counts = useMemo(() => {
    return summaries.reduce(
      (acc, item) => {
        acc.Total += 1;
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      { Total: 0, Urgent: 0, "Read Later": 0, Ignore: 0 }
    );
  }, [summaries]);

  async function syncInbox() {
    setLoadingAction("fetching");
    setStatusType("success");
    setStatus("Fetching Gmail messages and summarizing useful newsletters...");
    try {
      const result = await api.syncEmails();
      setStatusType("success");
      setStatus(
        `Saved ${result.saved}, processed ${result.processed}, skipped ${result.skipped.length}.`
      );
      await loadSummaries();
    } catch (error) {
      setStatusType("error");
      setStatus(error.message);
    } finally {
      setLoadingAction("");
    }
  }

  async function sendDigest() {
    setLoadingAction("sending");
    setStatusType("success");
    setStatus("Sending digest from your Gmail account...");
    try {
      const result = await api.sendDigest();
      setStatusType("success");
      setStatus(`Digest sent. Gmail message id: ${result.gmailMessageId}`);
      await loadSummaries();
    } catch (error) {
      setStatusType("error");
      setStatus(error.message);
    } finally {
      setLoadingAction("");
    }
  }

  function toggleCard(summaryId) {
    setExpandedCards((current) => ({
      ...current,
      [summaryId]: !current[summaryId]
    }));
  }

  return (
    <main className="dashboard">
      <nav className="dashboard-nav">
        <div className="dashboard-nav-inner">
          <a className="brand" href="/">
            ✦ Newsletter AI
          </a>
          <div className="user-menu">
            <button
              className="user-button"
              type="button"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {user.picture ? (
                <img src={user.picture} alt="" />
              ) : (
                <span className="avatar-fallback">{firstName.charAt(0)}</span>
              )}
              <span>{firstName}</span>
              <span className="caret">⌄</span>
            </button>
            {menuOpen ? (
              <div className="user-dropdown">
                <p>{user.email}</p>
                <button type="button" onClick={onLogout}>
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <header className="dashboard-hero">
          <div>
            <h1>
              {getGreeting()}, {firstName} ✦
            </h1>
            <p>Here's your AI-curated newsletter digest</p>
          </div>
          <div className="header-actions">
            <ThemeToggle
              theme={theme}
              onToggle={onToggleTheme}
              variant="dashboard"
            />
            <button
              className="outline-button"
              type="button"
              disabled={loading}
              onClick={syncInbox}
            >
              {loadingAction === "fetching" ? <Spinner /> : null}
              {loadingAction === "fetching" ? "Fetching..." : "📥 Fetch Emails"}
            </button>
            <button
              className="primary-button"
              type="button"
              disabled={loading}
              onClick={sendDigest}
            >
              {loadingAction === "sending" ? <Spinner /> : null}
              {loadingAction === "sending" ? "Sending..." : "📬 Send Digest"}
            </button>
          </div>
        </header>

        <section className="stats-grid" aria-label="Summary totals">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`stat-card ${categoryClass(filter)} ${
                filter === activeFilter ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              <span className="stat-icon">{categoryMeta[filter].icon}</span>
              <span className="stat-number">
                {filter === "All" ? counts.Total : counts[filter]}
              </span>
              <span className="stat-label">{categoryMeta[filter].label}</span>
            </button>
          ))}
        </section>

        <section className="toolbar">
          <div className="filter-row" aria-label="Filter summaries">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`filter ${categoryClass(filter)} ${
                  filter === activeFilter ? "active" : ""
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {categoryMeta[filter].icon} {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="summary-grid">
          {loading && !summaries.length ? (
            Array.from({ length: 3 }).map((_, index) => (
              <article className="skeleton-card" key={index}>
                <span />
                <span />
                <span />
                <span />
              </article>
            ))
          ) : summaries.length ? (
            summaries.map((summary) => (
              <SummaryCard
                key={summary._id}
                summary={summary}
                expanded={Boolean(expandedCards[summary._id])}
                onToggle={() => toggleCard(summary._id)}
              />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                {activeFilter === "All" ? "📭" : categoryMeta[activeFilter].icon}
              </div>
              <h2>
                {activeFilter === "All"
                  ? "No summaries yet"
                  : `No ${activeFilter.toLowerCase()} summaries`}
              </h2>
              <p>
                {activeFilter === "All"
                  ? "Fetch your inbox to process recent newsletter emails."
                  : "Try another filter or fetch fresh emails to update this view."}
              </p>
              {activeFilter === "All" ? (
                <button
                  className="primary-button"
                  type="button"
                  disabled={loading}
                  onClick={syncInbox}
                >
                  {loadingAction === "fetching" ? <Spinner /> : null}
                  {loadingAction === "fetching"
                    ? "Fetching..."
                    : "📥 Fetch Emails Now"}
                </button>
              ) : null}
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <a href="/privacy">Privacy Policy</a>
        </footer>
      </div>

      {status ? (
        <div className={`toast ${statusType}`} role="status">
          {status}
        </div>
      ) : null}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [theme, setTheme] = useState(() => {
    const stored = window.localStorage.getItem("newsletter-theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("newsletter-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  const path = window.location.pathname;

  if (path === "/privacy") {
    return <Privacy />;
  }

  if (checking) {
    return <main className="loading">Loading...</main>;
  }

  return user ? (
    <Dashboard
      user={user}
      onLogout={logout}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  ) : (
    <Login theme={theme} onToggleTheme={toggleTheme} />
  );
}

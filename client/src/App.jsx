import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, loginWithGoogle } from "./api.js";
import Privacy from "./Privacy";

/* ─── Design tokens ────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #111118;
    --surface-2: #18181f;
    --surface-3: #1f1f28;
    --border: rgba(255,255,255,0.07);
    --border-hover: rgba(255,255,255,0.14);
    --text-1: #f0eff8;
    --text-2: #8b8aa3;
    --text-3: #5c5b72;
    --accent: #7c6af7;
    --accent-glow: rgba(124,106,247,0.25);
    --accent-soft: rgba(124,106,247,0.12);
    --urgent: #f87171;
    --urgent-soft: rgba(248,113,113,0.1);
    --read: #34d399;
    --read-soft: rgba(52,211,153,0.1);
    --ignore: #6b7280;
    --ignore-soft: rgba(107,114,128,0.1);
    --ff-display: 'Syne', sans-serif;
    --ff-body: 'DM Sans', sans-serif;
    --radius: 14px;
    --radius-sm: 8px;
    --radius-pill: 999px;
    --shadow: 0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3);
    --shadow-lg: 0 4px 12px rgba(0,0,0,0.5), 0 24px 64px rgba(0,0,0,0.4);
  }

  body {
    background: var(--bg);
    color: var(--text-1);
    font-family: var(--ff-body);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Loading ── */
  .loading-screen {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
  }
  .loading-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    margin: 0 4px;
    display: inline-block;
  }

  /* ── Login ── */
  .login-page {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    background: var(--bg);
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }
  .login-page::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 70% 30%, rgba(124,106,247,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 50% 50% at 30% 80%, rgba(52,211,153,0.04) 0%, transparent 60%);
    pointer-events: none;
  }
  .login-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 3rem 3.5rem;
    max-width: 480px;
    width: 100%;
    position: relative;
    box-shadow: var(--shadow-lg);
  }
  .login-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,106,247,0.5), transparent);
    border-radius: 24px 24px 0 0;
  }

  /* ── Dashboard ── */
  .dashboard {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.5rem 4rem;
  }

  /* ── Header ── */
  .app-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 2.5rem 0 2rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 2rem;
  }
  .header-left {}
  .user-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .user-actions img {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 2px solid var(--border-hover);
    object-fit: cover;
  }

  /* ── Toolbar ── */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .filter-row {
    display: flex;
    gap: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: 4px;
  }
  .button-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* ── Metrics ── */
  .metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 2rem;
  }
  .metric-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem 1.5rem;
    position: relative;
    overflow: hidden;
    cursor: default;
  }
  .metric-card::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  .metric-card:hover::after { opacity: 1; }
  .metric-card.urgent::after   { background: var(--urgent-soft); }
  .metric-card.read-later::after { background: var(--read-soft); }
  .metric-card.ignore::after   { background: var(--ignore-soft); }

  /* ── Status ── */
  .status-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.75rem 1.25rem;
    margin-bottom: 1.5rem;
    font-size: 13px;
    color: var(--text-2);
  }
  .status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* ── Summary grid ── */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  /* ── Summary card ── */
  .summary-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    overflow: hidden;
    cursor: default;
    transition: border-color 0.2s;
  }
  .summary-card:hover {
    border-color: var(--border-hover);
  }
  .summary-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .summary-card:hover::before { opacity: 1; }
  .summary-card.Urgent::before        { background: var(--urgent); }
  .summary-card.Read-Later::before    { background: var(--read); }
  .summary-card.Ignore::before        { background: var(--ignore); }

  .summary-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .summary-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* ── Empty state ── */
  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 5rem 2rem;
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: var(--radius);
    text-align: center;
  }
  .empty-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    background: var(--accent-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.25rem;
  }

  /* ── Footer ── */
  .footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
    text-align: center;
  }

  /* ── Typography helpers ── */
  .eyebrow {
    font-family: var(--ff-display);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.75rem;
  }
  h1 {
    font-family: var(--ff-display);
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: var(--text-1);
    margin-bottom: 0.75rem;
  }
  .dashboard h1 {
    font-size: clamp(1.3rem, 3vw, 1.7rem);
    margin-bottom: 0.25rem;
  }
  h2 {
    font-family: var(--ff-display);
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.35;
  }
  h3 {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 2px;
  }
  .welcome { font-size: 13px; color: var(--text-3); }
  .sender  { font-size: 13px; color: var(--text-2); }
  .security-note { font-size: 12px; color: var(--text-3); margin-top: 1rem; line-height: 1.5; }

  /* ── Buttons ── */
  .primary-button {
    font-family: var(--ff-body);
    font-size: 14px;
    font-weight: 500;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-pill);
    padding: 0.6rem 1.4rem;
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .primary-button:hover:not(:disabled) {
    background: #9080fa;
    box-shadow: 0 0 20px var(--accent-glow);
  }
  .primary-button:active:not(:disabled) { transform: scale(0.97); }
  .primary-button:disabled { opacity: 0.4; cursor: not-allowed; }

  .secondary-button {
    font-family: var(--ff-body);
    font-size: 14px;
    font-weight: 500;
    background: var(--surface-3);
    color: var(--text-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: 0.6rem 1.4rem;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
    white-space: nowrap;
  }
  .secondary-button:hover:not(:disabled) {
    background: var(--surface-2);
    border-color: var(--border-hover);
  }
  .secondary-button:active:not(:disabled) { transform: scale(0.97); }
  .secondary-button:disabled { opacity: 0.4; cursor: not-allowed; }

  .ghost-button {
    font-family: var(--ff-body);
    font-size: 13px;
    font-weight: 500;
    background: transparent;
    color: var(--text-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: 0.45rem 1rem;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }
  .ghost-button:hover {
    color: var(--text-1);
    border-color: var(--border-hover);
  }

  /* ── Filter pill ── */
  .filter {
    font-family: var(--ff-body);
    font-size: 13px;
    font-weight: 500;
    background: transparent;
    color: var(--text-2);
    border: none;
    border-radius: var(--radius-pill);
    padding: 0.4rem 1rem;
    cursor: pointer;
    transition: color 0.15s;
    white-space: nowrap;
  }
  .filter:hover { color: var(--text-1); }
  .filter.active {
    background: var(--accent-soft);
    color: var(--accent);
  }

  /* ── Category badge ── */
  .category {
    font-family: var(--ff-body);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: var(--radius-pill);
  }
  .category.Urgent     { background: var(--urgent-soft);  color: var(--urgent); }
  .category.Read-Later { background: var(--read-soft);    color: var(--read); }
  .category.Ignore     { background: var(--ignore-soft);  color: var(--ignore); }

  /* ── Metric numbers ── */
  .metric-number {
    font-family: var(--ff-display);
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }
  .metric-label {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  /* ── Links ── */
  a { color: var(--text-3); text-decoration: none; font-size: 13px; transition: color 0.15s; }
  a:hover { color: var(--accent); }

  /* ── Login description ── */
  .login-panel > p:not(.eyebrow):not(.security-note) {
    color: var(--text-2);
    font-size: 15px;
    margin-bottom: 2rem;
    line-height: 1.7;
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .login-panel { padding: 2rem 1.5rem; }
    .app-header { flex-direction: column; }
    .toolbar { flex-direction: column; align-items: stretch; }
    .filter-row { flex-wrap: wrap; }
    .button-row { justify-content: stretch; }
    .button-row button { flex: 1; }
    .metrics { grid-template-columns: repeat(3, 1fr); }
    .summary-grid { grid-template-columns: 1fr; }
  }
`;

/* ─── Animation variants ──────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
};

/* ─── Dot loader ─────────────────────────────────────────────────── */
function DotLoader() {
  return (
    <main className="loading-screen">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="loading-dot"
          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </main>
  );
}

/* ─── Login ──────────────────────────────────────────────────────── */
function Login() {
  return (
    <main className="login-page">
      <motion.section
        className="login-panel"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.p className="eyebrow" variants={fadeUp} custom={0} initial="hidden" animate="visible">
          Smart Newsletter Summarizer
        </motion.p>
        <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="visible">
          Turn the inbox you already have into a daily reading list.
        </motion.h1>
        <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible">
          Sign in with Google, summarize recent newsletter emails, and send a
          digest from your own Gmail account to yourself.
        </motion.p>
        <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible">
          <motion.button
            className="primary-button"
            onClick={loginWithGoogle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <GoogleIcon />
            Login with Google
          </motion.button>
        </motion.div>
        <motion.p className="security-note" variants={fadeUp} custom={4} initial="hidden" animate="visible">
          Gmail tokens stay on the server. The browser only receives your app
          session cookie.
        </motion.p>
        <motion.footer className="footer" variants={fadeUp} custom={5} initial="hidden" animate="visible">
          <a href="/privacy">Privacy Policy</a>
        </motion.footer>
      </motion.section>
    </main>
  );
}

/* ─── Summary card ───────────────────────────────────────────────── */
function SummaryCard({ summary }) {
  const email = summary.emailId || {};
  const catClass = summary.category.replace(" ", "-");

  return (
    <motion.article
      className={`summary-card ${catClass}`}
      variants={cardVariant}
      layout
      whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.14)" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="summary-topline">
        <span className={`category ${catClass}`}>{summary.category}</span>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>
          {email.receivedAt ? new Date(email.receivedAt).toLocaleDateString() : ""}
        </span>
      </div>
      <div>
        <h2>{email.subject || "Newsletter"}</h2>
        <p className="sender">{email.sender || "Unknown sender"}</p>
      </div>
      <div className="summary-section">
        <h3>TL;DR</h3>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>{summary.tldr}</p>
      </div>
      <div className="summary-section">
        <h3>Why it matters</h3>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>{summary.why_it_matters}</p>
      </div>
      <div className="summary-section">
        <h3>Suggested action</h3>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>{summary.action}</p>
      </div>
    </motion.article>
  );
}

/* ─── Metric card ────────────────────────────────────────────────── */
function MetricCard({ label, value, colorVar, index }) {
  return (
    <motion.div
      className={`metric-card ${label.replace(" ", "-")}`}
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <p className="metric-number" style={{ color: colorVar }}>
        <AnimatedCount value={value} />
      </p>
      <p className="metric-label" style={{ color: "var(--text-3)" }}>{label}</p>
    </motion.div>
  );
}

function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) { setDisplay(end); return; }
    const duration = 600;
    const step = Math.ceil(duration / Math.max(end, 1));
    const timer = setInterval(() => {
      start += 1;
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

/* ─── Dashboard ──────────────────────────────────────────────────── */
const filters = ["All", "Urgent", "Read Later", "Ignore"];

function Dashboard({ user, onLogout }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [summaries, setSummaries] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSummaries = useCallback(async () => {
    const category = activeFilter === "All" ? undefined : activeFilter;
    const data = await api.getSummaries(category);
    setSummaries(data.summaries);
  }, [activeFilter]);

  useEffect(() => {
    loadSummaries().catch((error) => setStatus(error.message));
  }, [loadSummaries]);

  const counts = useMemo(() => {
    return summaries.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      { Urgent: 0, "Read Later": 0, Ignore: 0 }
    );
  }, [summaries]);

  async function syncInbox() {
    setLoading(true);
    setStatus("Fetching Gmail messages and summarizing useful newsletters...");
    try {
      const result = await api.syncEmails();
      setStatus(`Saved ${result.saved}, processed ${result.processed}, skipped ${result.skipped.length}.`);
      await loadSummaries();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendDigest() {
    setLoading(true);
    setStatus("Sending digest from your Gmail account...");
    try {
      const result = await api.sendDigest();
      setStatus(`Digest sent. Gmail message id: ${result.gmailMessageId}`);
      await loadSummaries();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dashboard">
      {/* Header */}
      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="header-left">
          <p className="eyebrow">Smart Newsletter Summarizer</p>
          <h1>Your newsletter brief</h1>
          <p className="welcome">Signed in as {user.email}</p>
        </div>
        <div className="user-actions">
          {user.picture ? (
            <motion.img
              src={user.picture}
              alt=""
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            />
          ) : null}
          <motion.button
            className="ghost-button"
            onClick={onLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
          >
            Logout
          </motion.button>
        </div>
      </motion.header>

      {/* Toolbar */}
      <motion.section
        className="toolbar"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="filter-row">
          {filters.map((filter) => (
            <motion.button
              key={filter}
              className={filter === activeFilter ? "filter active" : "filter"}
              onClick={() => setActiveFilter(filter)}
              whileTap={{ scale: 0.95 }}
            >
              {filter}
            </motion.button>
          ))}
        </div>
        <div className="button-row">
          <motion.button
            className="primary-button"
            disabled={loading}
            onClick={syncInbox}
            whileHover={!loading ? { scale: 1.02, boxShadow: "0 0 20px rgba(124,106,247,0.35)" } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
          >
            {loading ? <SpinnerIcon /> : <SyncIcon />}
            Fetch and summarize
          </motion.button>
          <motion.button
            className="secondary-button"
            disabled={loading}
            onClick={sendDigest}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
          >
            <DigestIcon />
            Send digest
          </motion.button>
        </div>
      </motion.section>

      {/* Metrics */}
      <section className="metrics">
        <MetricCard label="Urgent"     value={counts.Urgent}      colorVar="var(--urgent)" index={0} />
        <MetricCard label="Read Later" value={counts["Read Later"]} colorVar="var(--read)"   index={1} />
        <MetricCard label="Ignore"     value={counts.Ignore}       colorVar="var(--ignore)" index={2} />
      </section>

      {/* Status */}
      <AnimatePresence>
        {status ? (
          <motion.p
            className="status-bar"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: "1.5rem" }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25 }}
          >
            <span className="status-dot" />
            {status}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {/* Summary grid */}
      <AnimatePresence mode="wait">
        <motion.section
          key={activeFilter}
          className="summary-grid"
          variants={stagger}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          {summaries.length ? (
            summaries.map((summary) => (
              <SummaryCard key={summary._id} summary={summary} />
            ))
          ) : (
            <motion.div
              className="empty-state"
              variants={cardVariant}
            >
              <div className="empty-icon">
                <InboxIcon />
              </div>
              <h2>No summaries yet</h2>
              <p style={{ fontSize: 14, color: "var(--text-3)", maxWidth: 280 }}>
                Fetch your inbox to process recent newsletter emails.
              </p>
            </motion.div>
          )}
        </motion.section>
      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        className="footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <a href="/privacy">Privacy Policy</a>
      </motion.footer>
    </main>
  );
}

/* ─── Root ───────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  async function logout() {
    await api.logout();
    setUser(null);
  }

  const path = window.location.pathname;

  if (path === "/privacy") return <Privacy />;
  if (checking) return <DotLoader />;
  return user ? <Dashboard user={user} onLogout={logout} /> : <Login />;

  return user ? <Dashboard user={user} onLogout={logout} /> : <Login />;
}

/* ─── Inject global styles ───────────────────────────────────────── */
if (typeof document !== "undefined") {
  const id = "__newsletter-styles";
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/* ─── Inline SVG icons ───────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <motion.svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    >
      <path d="M12 2a10 10 0 1 0 10 10" />
    </motion.svg>
  );
}

function DigestIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 9h20M7 4v5"/>
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  );
}

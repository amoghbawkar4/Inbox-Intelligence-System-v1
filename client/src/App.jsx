import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, loginWithGoogle } from "./api.js";
import Privacy from "./Privacy";
import "./styles.css";

/* ─── Animation variants ────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.18 } },
};

/* ─── Filters ───────────────────────────────────────────────────── */
const filters = ["All", "Urgent", "Read Later", "Ignore"];

/* ─── Loading ───────────────────────────────────────────────────── */
function Loading() {
  return (
    <main className="loading" style={{ flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#287766",
              display: "inline-block",
            }}
            animate={{ y: [0, -9, 0], opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 0.75,
              delay: i * 0.14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <p style={{ color: "#627169", fontSize: "0.9rem", margin: 0 }}>Loading…</p>
    </main>
  );
}

/* ─── Login ─────────────────────────────────────────────────────── */
function Login() {
  return (
    <main className="login-page">
      <motion.section
        className="login-panel"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.p
          className="eyebrow"
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="visible"
        >
          Smart Newsletter Summarizer
        </motion.p>

        <motion.h1
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="visible"
        >
          Turn the inbox you already have into a daily reading list.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="visible"
        >
          Sign in with Google, summarize recent newsletter emails, and send a
          digest from your own Gmail account to yourself.
        </motion.p>

        <motion.div
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="visible"
        >
          <motion.button
            className="primary-button"
            onClick={loginWithGoogle}
            whileHover={{ scale: 1.03, boxShadow: "0 6px 24px rgba(239,77,63,0.28)" }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <GoogleIcon />
            Login with Google
          </motion.button>
        </motion.div>

        <motion.p
          className="security-note"
          variants={fadeUp}
          custom={4}
          initial="hidden"
          animate="visible"
        >
          Gmail tokens stay on the server. The browser only receives your app
          session cookie.
        </motion.p>

        <motion.footer
          className="footer"
          variants={fadeUp}
          custom={5}
          initial="hidden"
          animate="visible"
          style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid #d8e4db" }}
        >
          <a href="/privacy" style={{ color: "#627169", fontSize: "0.85rem" }}>
            Privacy Policy
          </a>
        </motion.footer>
      </motion.section>
    </main>
  );
}

/* ─── Summary card ──────────────────────────────────────────────── */
function SummaryCard({ summary }) {
  const email = summary.emailId || {};

  return (
    <motion.article
      className="summary-card"
      variants={cardVariant}
      layout
      whileHover={{
        y: -4,
        boxShadow: "0 12px 32px rgba(24,32,29,0.1)",
        borderColor: "#b4ccc0",
      }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
    >
      <div className="summary-topline">
        <span className={`category ${summary.category.replace(" ", "-")}`}>
          {summary.category}
        </span>
        <span>
          {email.receivedAt
            ? new Date(email.receivedAt).toLocaleDateString()
            : ""}
        </span>
      </div>

      <h2>{email.subject || "Newsletter"}</h2>
      <p className="sender">{email.sender || "Unknown sender"}</p>

      <div className="summary-section">
        <h3>TL;DR</h3>
        <p>{summary.tldr}</p>
      </div>

      <div className="summary-section">
        <h3>Why it matters</h3>
        <p>{summary.why_it_matters}</p>
      </div>

      <div className="summary-section">
        <h3>Suggested action</h3>
        <p>{summary.action}</p>
      </div>
    </motion.article>
  );
}

/* ─── Animated metric number ────────────────────────────────────── */
function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let current = 0;
    const duration = 500;
    const intervalMs = Math.max(Math.floor(duration / value), 16);
    const timer = setInterval(() => {
      current += 1;
      setDisplay(current);
      if (current >= value) clearInterval(timer);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [value]);

  return <>{display}</>;
}

/* ─── Dashboard ─────────────────────────────────────────────────── */
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
      setStatus(
        `Saved ${result.saved}, processed ${result.processed}, skipped ${result.skipped.length}.`
      );
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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <p className="eyebrow">Smart Newsletter Summarizer</p>
          <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", marginBottom: 4 }}>
            Your newsletter brief
          </h1>
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
            whileHover={{ scale: 1.03 }}
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
        transition={{ delay: 0.1, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="filter-row">
          {filters.map((filter) => (
            <motion.button
              key={filter}
              className={filter === activeFilter ? "filter active" : "filter"}
              onClick={() => setActiveFilter(filter)}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.03 }}
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
            whileHover={
              !loading
                ? { scale: 1.03, boxShadow: "0 6px 20px rgba(239,77,63,0.3)" }
                : {}
            }
            whileTap={!loading ? { scale: 0.97 } : {}}
            style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            {loading ? <SpinnerIcon color="#fff" /> : <SyncIcon color="#fff" />}
            Fetch and summarize
          </motion.button>

          <motion.button
            className="secondary-button"
            disabled={loading}
            onClick={sendDigest}
            whileHover={!loading ? { scale: 1.03 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            <DigestIcon color="#fff" />
            Send digest
          </motion.button>
        </div>
      </motion.section>

      {/* Metrics */}
      <motion.section
        className="metrics"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: "Urgent", value: counts.Urgent, color: "#c83232" },
          { label: "Read Later", value: counts["Read Later"], color: "#287766" },
          { label: "Ignore", value: counts.Ignore, color: "#66706a" },
        ].map(({ label, value, color }, i) => (
          <motion.div
            key={label}
            variants={fadeUp}
            custom={i}
            whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(24,32,29,0.1)" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <span style={{ color }}>
              <AnimatedCount value={value} />
            </span>
            <p>{label}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Status */}
      <AnimatePresence>
        {status ? (
          <motion.p
            className="status"
            initial={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 12 }}
            exit={{ opacity: 0, y: -4, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.22 }}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <StatusDot loading={loading} />
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
          exit={{ opacity: 0, transition: { duration: 0.14 } }}
        >
          {summaries.length ? (
            summaries.map((summary) => (
              <SummaryCard key={summary._id} summary={summary} />
            ))
          ) : (
            <motion.div className="empty-state" variants={cardVariant}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📭</div>
              <h2>No summaries yet</h2>
              <p>Fetch your inbox to process recent newsletter emails.</p>
            </motion.div>
          )}
        </motion.section>
      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        style={{
          marginTop: "3rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid #d8e4db",
          textAlign: "center",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <a href="/privacy" style={{ color: "#627169", fontSize: "0.85rem" }}>
          Privacy Policy
        </a>
      </motion.footer>
    </main>
  );
}

/* ─── Root ──────────────────────────────────────────────────────── */
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
  if (checking) return <Loading />;
  return user ? <Dashboard user={user} onLogout={logout} /> : <Login />;

  return user ? <Dashboard user={user} onLogout={logout} /> : <Login />;
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function StatusDot({ loading }) {
  return (
    <motion.span
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: loading ? "#e5a700" : "#287766",
        display: "inline-block",
        flexShrink: 0,
      }}
      animate={loading ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
      transition={loading ? { duration: 1.2, repeat: Infinity } : {}}
    />
  );
}

/* ─── SVG Icons ─────────────────────────────────────────────────── */
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

function SyncIcon({ color = "currentColor" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
    </svg>
  );
}

function SpinnerIcon({ color = "currentColor" }) {
  return (
    <motion.svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
    >
      <path d="M12 2a10 10 0 1 0 10 10" />
    </motion.svg>
  );
}

function DigestIcon({ color = "currentColor" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 9h20M7 4v5"/>
    </svg>
  );
}

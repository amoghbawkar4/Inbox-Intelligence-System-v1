import { useCallback, useEffect, useMemo, useState } from "react";
import { api, loginWithGoogle } from "./api.js";

const filters = ["All", "Urgent", "Read Later", "Ignore"];

function Login() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Smart Newsletter Summarizer</p>
        <h1>Turn the inbox you already have into a daily reading list.</h1>
        <p>
          Sign in with Google, summarize recent newsletter emails, and send a
          digest from your own Gmail account to yourself.
        </p>
        <button className="primary-button" onClick={loginWithGoogle}>
          Login with Google
        </button>
        <p className="security-note">
          Gmail tokens stay on the server. The browser only receives your app
          session cookie.
        </p>
      </section>
    </main>
  );
}

function SummaryCard({ summary }) {
  const email = summary.emailId || {};

  return (
    <article className="summary-card">
      <div className="summary-topline">
        <span className={`category ${summary.category.replace(" ", "-")}`}>
          {summary.category}
        </span>
        <span>{email.receivedAt ? new Date(email.receivedAt).toLocaleDateString() : ""}</span>
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
    </article>
  );
}

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
      <header className="app-header">
        <div>
          <p className="eyebrow">Smart Newsletter Summarizer</p>
          <h1>Your newsletter brief</h1>
          <p className="welcome">Signed in as {user.email}</p>
        </div>
        <div className="user-actions">
          {user.picture ? <img src={user.picture} alt="" /> : null}
          <button className="ghost-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="toolbar">
        <div className="filter-row">
          {filters.map((filter) => (
            <button
              key={filter}
              className={filter === activeFilter ? "filter active" : "filter"}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="button-row">
          <button className="primary-button" disabled={loading} onClick={syncInbox}>
            Fetch and summarize
          </button>
          <button className="secondary-button" disabled={loading} onClick={sendDigest}>
            Send digest
          </button>
        </div>
      </section>

      <section className="metrics">
        <div>
          <span>{counts.Urgent}</span>
          <p>Urgent</p>
        </div>
        <div>
          <span>{counts["Read Later"]}</span>
          <p>Read Later</p>
        </div>
        <div>
          <span>{counts.Ignore}</span>
          <p>Ignore</p>
        </div>
      </section>

      {status ? <p className="status">{status}</p> : null}

      <section className="summary-grid">
        {summaries.length ? (
          summaries.map((summary) => (
            <SummaryCard key={summary._id} summary={summary} />
          ))
        ) : (
          <div className="empty-state">
            <h2>No summaries yet</h2>
            <p>Fetch your inbox to process recent newsletter emails.</p>
          </div>
        )}
      </section>
    </main>
  );
}

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

  if (checking) {
    return <main className="loading">Loading...</main>;
  }

  return user ? <Dashboard user={user} onLogout={logout} /> : <Login />;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, loginWithGoogle } from "./api.js";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import Privacy from "./Privacy";

const filters = ["All", "Urgent", "Read Later", "Ignore"];

const categoryMeta = {
  All: { icon: "\u2726", label: "Total" },
  Urgent: { icon: "\u{1F534}", label: "Urgent" },
  "Read Later": { icon: "\u{1F535}", label: "Read Later" },
  Ignore: { icon: "\u26AB", label: "Ignore" }
};

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
  const [activeFilter, setActiveFilter] = useState("All");
  const [summaries, setSummaries] = useState([]);
  const [allSummaries, setAllSummaries] = useState([]);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("success");
  const [loadingAction, setLoadingAction] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const loading = Boolean(loadingAction);

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

  const loadAllSummaries = useCallback(async () => {
    const data = await api.getSummaries();
    setAllSummaries(data.summaries);
  }, []);

  useEffect(() => {
    if (activeFilter === "All") {
      setSummaries(allSummaries);
      return;
    }

    setSummaries(
      allSummaries.filter((summary) => summary.category === activeFilter)
    );
  }, [activeFilter, allSummaries]);

  useEffect(() => {
    if (!user) return;
    loadAllSummaries().catch((error) => {
      setStatusType("error");
      setStatus(error.message);
    });
  }, [loadAllSummaries, user]);

  useEffect(() => {
    if (!status || loading) return undefined;

    const timeout = window.setTimeout(() => {
      setStatus("");
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [loading, status]);

  const counts = useMemo(() => {
    return allSummaries.reduce(
      (acc, item) => {
        acc.Total += 1;
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      { Total: 0, Urgent: 0, "Read Later": 0, Ignore: 0 }
    );
  }, [allSummaries]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

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
      await loadAllSummaries();
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
      await loadAllSummaries();
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

  const path = window.location.pathname;

  if (path === "/privacy") {
    return <Privacy />;
  }

  if (checking) {
    return <main className="loading">Loading...</main>;
  }

  if (!user) {
    return (
      <LandingPage
        onLogin={loginWithGoogle}
        onToggleTheme={toggleTheme}
        theme={theme}
      />
    );
  }

  if (path === "/settings") {
    return (
      <Settings
        onLogout={logout}
        onSummariesCleared={loadAllSummaries}
        user={user}
      />
    );
  }

  return (
    <Dashboard
      activeFilter={activeFilter}
      categoryMeta={categoryMeta}
      counts={counts}
      expandedCards={expandedCards}
      filters={filters}
      loading={loading}
      loadingAction={loadingAction}
      menuOpen={menuOpen}
      onLogout={logout}
      onToggleTheme={toggleTheme}
      sendDigest={sendDigest}
      setActiveFilter={setActiveFilter}
      setMenuOpen={setMenuOpen}
      status={status}
      statusType={statusType}
      summaries={summaries}
      syncInbox={syncInbox}
      theme={theme}
      toggleCard={toggleCard}
      user={user}
    />
  );
}

//Dashboard.jsx

import "./Dashboard.css";

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

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      className="theme-toggle dashboard-toggle"
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

function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

function SummaryCard({ categoryMeta, summary, expanded, onToggle }) {
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
        <span>
          {expanded ? "\u25B2 Less" : "\u25BC More details"}
        </span>
        {hasDigestBadge ? (
          <span className="sent-badge">{"\u2713"} Digest sent</span>
        ) : null}
      </footer>
    </article>
  );
}

export default function Dashboard({
  activeFilter,
  categoryMeta,
  counts,
  expandedCards,
  filters,
  loading,
  loadingAction,
  menuOpen,
  onLogout,
  onToggleTheme,
  sendDigest,
  setActiveFilter,
  setMenuOpen,
  status,
  statusType,
  summaries,
  syncInbox,
  theme,
  toggleCard,
  user
}) {
  const firstName = getFirstName(user);

  return (
  <>
    <div className="fixed-bg" />

    <main className="dashboard">
      <nav className="dashboard-nav">
        <div className="dashboard-nav-inner">
          <a className="brand" href="/">
            {"\u2726"} Newsletter AI
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
              <span className="caret">{"\u2304"}</span>
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
              {getGreeting()}, {firstName} {"\u2726"}
            </h1>
            <p>Here's your AI-curated newsletter digest</p>
          </div>
          <div className="header-actions">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              className="outline-button"
              type="button"
              disabled={loading}
              onClick={syncInbox}
            >
              {loadingAction === "fetching" ? <Spinner /> : null}
              {loadingAction === "fetching"
                ? "Fetching..."
                : "\u{1F4E5} Fetch Emails"}
            </button>
            <button
              className="primary-button"
              type="button"
              disabled={loading}
              onClick={sendDigest}
            >
              {loadingAction === "sending" ? <Spinner /> : null}
              {loadingAction === "sending"
                ? "Sending..."
                : "\u{1F4EC} Send Digest"}
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
                categoryMeta={categoryMeta}
                summary={summary}
                expanded={Boolean(expandedCards[summary._id])}
                onToggle={() => toggleCard(summary._id)}
              />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                {activeFilter === "All"
                  ? "\u{1F4ED}"
                  : categoryMeta[activeFilter].icon}
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
                    : "\u{1F4E5} Fetch Emails Now"}
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
        <div
          className={`toast ${statusType} ${loading ? "active" : "auto-dismiss"}`}
          role="status"
        >
          {status}
        </div>
      ) : null}
    </main>
    </>
  );
}

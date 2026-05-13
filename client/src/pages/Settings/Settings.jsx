import ClearSummaries from "../../components/ClearSummaries/ClearSummaries.jsx";
import "./Settings.css";

const settingsSections = [
  { id: "delete-data", label: "Delete Data", icon: "\u{1F5D1}" },
  { id: "privacy", label: "Privacy", icon: "\u{1F512}", href: "/privacy" }
];

function getFirstName(user) {
  const source = user?.name || user?.email || "there";
  return source.split("@")[0].trim().split(/\s+/)[0] || "there";
}

export default function Settings({ user, onLogout, onSummariesCleared }) {
  const firstName = getFirstName(user);

  return (
    <>
      <div className="settings-bg" />

      <main className="settings-page">
        <nav className="settings-topbar">
          <div className="settings-topbar-inner">
            <a className="brand" href="/">
              {"\u2726"} Newsletter AI
            </a>
            <div className="settings-topbar-actions">
              <a className="settings-dashboard-link" href="/">
                Dashboard
              </a>
              <button
                className="settings-signout-button"
                type="button"
                onClick={onLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>

        <div className="settings-shell">
          <aside className="settings-sidebar" aria-label="Settings sections">
            <div className="settings-account">
              {user.picture ? (
                <img src={user.picture} alt="" />
              ) : (
                <span className="settings-avatar">{firstName.charAt(0)}</span>
              )}
              <div>
                <p>{firstName}</p>
                <span>{user.email}</span>
              </div>
            </div>

            <nav className="settings-side-nav">
              {settingsSections.map((section) => {
                const className = `settings-side-link ${
                  section.id === "delete-data" ? "active" : ""
                }`;

                return section.href ? (
                  <a className={className} href={section.href} key={section.id}>
                    <span aria-hidden="true">{section.icon}</span>
                    {section.label}
                  </a>
                ) : (
                  <a className={className} href={`#${section.id}`} key={section.id}>
                    <span aria-hidden="true">{section.icon}</span>
                    {section.label}
                  </a>
                );
              })}
            </nav>
          </aside>

          <section className="settings-main" aria-labelledby="settings-title">
            <header className="settings-heading">
              <p className="settings-eyebrow">Workspace controls</p>
              <h1 id="settings-title">Settings</h1>
            </header>

            <section
              className="settings-panel"
              id="delete-data"
              aria-labelledby="delete-data-title"
            >
              <div className="settings-panel-copy">
                <p className="settings-eyebrow">Delete Data</p>
                <h2 id="delete-data-title">Stored summaries</h2>
                <p>
                  Remove generated summary records from your account while
                  leaving your sign-in and Gmail connection unchanged.
                </p>
              </div>

              <ClearSummaries onCleared={onSummariesCleared} />
            </section>

            <section
              className="settings-panel settings-panel-muted"
              id="privacy"
              aria-labelledby="privacy-settings-title"
            >
              <div className="settings-panel-copy">
                <p className="settings-eyebrow">Privacy</p>
                <h2 id="privacy-settings-title">Privacy controls</h2>
                <p>
                  Review the current data policy and Gmail access boundaries.
                </p>
              </div>
              <a className="settings-secondary-link" href="/privacy">
                View Privacy Policy
              </a>
            </section>
          </section>
        </div>
      </main>
    </>
  );
}

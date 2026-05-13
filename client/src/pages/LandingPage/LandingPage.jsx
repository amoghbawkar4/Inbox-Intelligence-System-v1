import "./LandingPage.css";

const features = [
  {
    icon: "\u{1F4E5}",
    title: "Reads Your Gmail",
    copy: "Securely connects to your inbox via Google OAuth. No passwords stored."
  },
  {
    icon: "\u{1F916}",
    title: "AI Summarization",
    copy: "GPT-powered TL;DRs, priority ratings, and suggested actions for every newsletter."
  },
  {
    icon: "\u{1F4EC}",
    title: "Daily Digest",
    copy: "Sends a beautifully formatted digest from your own Gmail account every morning."
  },
  {
    icon: "\u{1F512}",
    title: "Fully Isolated",
    copy: "Each user's data and tokens are completely separate. Zero cross-contamination."
  }
];

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      className="theme-toggle"
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

export default function LandingPage({ theme, onToggleTheme, onLogin }) {
  const oauthError = new URLSearchParams(window.location.search).get("error");
  const year = new Date().getFullYear();

  return (
    <main className="login-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <nav className="landing-nav">
        <a className="brand" href="/">
          {"\u2726"} Newsletter AI
        </a>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </nav>

      <section className="hero-section">
        {oauthError ? (
          <div className="oauth-banner" role="alert">
            Google sign-in was cancelled or failed. Please try again.
          </div>
        ) : null}

        <p className="hero-badge">
          Powered by GPT-3.5 {"\u00b7"} Gmail API {"\u00b7"} MongoDB
        </p>
        <h1>
          <span className="hero-line">Your inbox,</span>
          <span className="hero-line">intelligently</span>
          <span className="hero-line hero-emphasis gradient-text">
            summarized.
          </span>
        </h1>
        <p className="hero-copy">
          Stop drowning in newsletters. Our AI reads your Gmail, extracts what
          matters, and delivers a crisp daily digest {"\u2014"} sent from your
          own account.
        </p>
        <button className="google-button" type="button" onClick={onLogin}>
          <GoogleIcon />
          Continue with Google
        </button>
        <p className="security-note">
          We request Gmail read &amp; send access. Your tokens are encrypted and
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
        <span>&copy; {year} Smart Newsletter Summarizer</span>
        <a href="/privacy">Privacy Policy</a>
      </footer>
    </main>
  );
}

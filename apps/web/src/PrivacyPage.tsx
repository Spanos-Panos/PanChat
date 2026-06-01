import styles from "./App.module.css";

type PrivacyPageProps = {
  onBack: () => void;
};

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalCard}>
        <button type="button" className={styles.btnGhost} onClick={onBack}>
          ← Back
        </button>

        <h1 className={styles.legalTitle}>Privacy policy</h1>
        <p className={styles.legalUpdated}>Last updated: May 2026 · PanChat MVP</p>

        <section className={styles.legalSection}>
          <h2>What we collect</h2>
          <ul>
            <li>Account: email, username, display name, optional birth date</li>
            <li>Profile photo (if you upload one)</li>
            <li>Messages you send in 1-to-1 chats</li>
            <li>Tasks attached to messages (visible only to the recipient)</li>
            <li>Technical: session cookie, server logs (errors, IP for rate limits)</li>
          </ul>
        </section>

        <section className={styles.legalSection}>
          <h2>Why we collect it</h2>
          <ul>
            <li>To create your account and keep you signed in</li>
            <li>To deliver chat, tasks, presence, and live updates</li>
            <li>To protect the service (rate limits, abuse prevention)</li>
          </ul>
        </section>

        <section className={styles.legalSection}>
          <h2>Cookies</h2>
          <p>
            PanChat uses a <strong>strictly necessary</strong> httpOnly session
            cookie so you stay logged in. We do not use analytics or advertising
            cookies in this MVP. If we add optional tracking later, we will ask
            for consent first.
          </p>
        </section>

        <section className={styles.legalSection}>
          <h2>Your choices</h2>
          <ul>
            <li>
              <strong>Export:</strong> In the app header, open Account →
              Download my data (JSON file).
            </li>
            <li>
              <strong>Delete:</strong> Account → Delete account — confirm with
              your email. This deactivates login and anonymizes your profile;
              message history may remain for the other participant in the thread.
            </li>
            <li>
              <strong>Contact:</strong> For data requests, contact the project
              owner (portfolio / learning project).
            </li>
          </ul>
        </section>

        <section className={styles.legalSection}>
          <h2>Security</h2>
          <p>
            Passwords are hashed (bcrypt). The database is not exposed to the
            public internet in normal development. Do not share your login or use
            PanChat on untrusted networks without HTTPS in production.
          </p>
        </section>

        <p className={styles.legalNote}>
          This is a student/portfolio MVP, not legal advice. Review with a
          professional before a commercial public launch.
        </p>
      </div>
    </div>
  );
}

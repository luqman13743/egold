export const metadata = { title: "Settings — Admin" };

// There is no "settings" database table by design — operational config
// (payment keys, storage credentials, feature toggles) lives in environment
// variables, which are the only place secrets are allowed to live per
// SECURITY.md. This page is a read-only reference, not an editor, so
// nobody is tempted to route a secret through the database or the browser.
const SETTINGS_GROUPS = [
  {
    title: "Payments",
    items: ["SAFEPAY_ENVIRONMENT", "SAFEPAY_API_KEY", "SAFEPAY_V1_SECRET", "SAFEPAY_WEBHOOK_SECRET"],
  },
  {
    title: "Storage (Cloudflare R2)",
    items: ["R2_BUCKET_NAME", "R2_PUBLIC_URL", "R2_ACCOUNT_ID"],
  },
  {
    title: "Email",
    items: ["EMAIL_FROM", "RESEND_API_KEY"],
  },
  {
    title: "Site",
    items: ["NEXT_PUBLIC_SITE_URL"],
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl mb-2">Settings</h1>
      <p className="text-sm text-ink/60 dark:text-white/60 mb-6">
        Operational settings are configured via environment variables (see <code>.env.example</code> and
        SETUP.md), not through this page — that keeps secrets out of the database and away from the browser.
        This is a reference to what&apos;s configurable, not an editor.
      </p>
      {SETTINGS_GROUPS.map((group) => (
        <div key={group.title} className="mb-6">
          <h2 className="font-medium mb-2">{group.title}</h2>
          <ul className="text-sm font-mono text-ink/60 dark:text-white/60 space-y-1">
            {group.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

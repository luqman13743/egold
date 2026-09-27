// Next.js re-mounts template.tsx on every navigation (unlike layout.tsx,
// which persists). That re-mount is exactly what we want: it restarts the
// CSS fade-in animation defined in globals.css (.page-transition) on every
// page, including navbar links like Contact — so navigation feels like a
// smooth crossfade rather than an instant cut.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}

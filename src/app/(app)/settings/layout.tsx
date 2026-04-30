import Link from "next/link";

const sections = [
  { href: "/settings/team", label: "Team" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <nav className="flex gap-4 border-b border-border text-sm">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="border-b-2 border-transparent pb-2 text-muted-foreground transition-colors hover:text-foreground hover:border-border-strong"
          >
            {s.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

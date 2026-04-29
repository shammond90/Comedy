import { requireOrg } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { signOut } from "@/app/(auth)/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireOrg();

  return (
    <div className="flex flex-1 min-h-screen bg-background">
      <Sidebar userEmail={user.email ?? ""} signOutAction={signOut} />
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}

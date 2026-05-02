import { requireOrg } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { BottomNav } from "@/components/app/bottom-nav";
import { TopAppBar } from "@/components/app/top-app-bar";
import { NotificationBell } from "@/components/app/notification-bell";
import { GlobalSearchInput } from "@/components/app/global-search-input";
import { signOut } from "@/app/(auth)/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireOrg();
  const displayName =
    (user.user_metadata?.display_name as string | undefined) ?? user.email ?? "";

  return (
    <div className="flex flex-1 min-h-screen bg-background">
      <Sidebar displayName={displayName} signOutAction={signOut} />
      <TopAppBar userId={user.id} />
      <main className="flex-1 min-w-0">
        <div
          className="mx-auto max-w-6xl px-4 md:px-8 app-content-padding"
        >
          <div className="pointer-events-none fixed right-6 top-4 z-40 hidden md:flex items-center gap-3 justify-end">
            <div className="pointer-events-auto">
              <GlobalSearchInput />
            </div>
            <div className="pointer-events-auto">
              <NotificationBell userId={user.id} />
            </div>
          </div>
          {children}
        </div>
      </main>
      <BottomNav displayName={displayName} signOutAction={signOut} />
    </div>
  );
}

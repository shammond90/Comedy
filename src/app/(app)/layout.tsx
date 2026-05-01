import { requireOrg } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { NotificationBell } from "@/components/app/notification-bell";
import { GlobalSearchInput } from "@/components/app/global-search-input";
import { signOut } from "@/app/(auth)/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireOrg();

  return (
    <div className="flex flex-1 min-h-screen bg-background">
      <Sidebar displayName={(user.user_metadata?.display_name as string | undefined) ?? user.email ?? ""} signOutAction={signOut} />
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <div className="pointer-events-none fixed right-6 top-4 z-40 flex items-center gap-3 justify-end">
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
    </div>
  );
}

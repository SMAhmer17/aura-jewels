import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardMobileNav } from "@/components/layout/DashboardMobileNav";
import { AuthGuard } from "@/components/features/dashboard/AuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh bg-ivory">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardMobileNav />
          <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="h-screen overflow-hidden bg-[#f4f7fb] text-slate-900">
      <AppSidebar />

      <div className="h-full xl:pl-64">
        <AppHeader />
        <main className="h-full overflow-y-auto px-5 pb-5 pt-20 sm:px-8 sm:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}

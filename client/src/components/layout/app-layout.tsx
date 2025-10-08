import { ReactNode } from "react";
import Sidebar from "./sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}

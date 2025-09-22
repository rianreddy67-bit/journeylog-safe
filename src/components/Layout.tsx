import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { SOSButton } from "./SOSButton";

interface LayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  showSOS?: boolean;
}

export const Layout = ({ children, showBottomNav = true, showSOS = true }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <main className={cn("", showBottomNav && "pb-20")}>
        {children}
      </main>
      {showSOS && <SOSButton />}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

function cn(...inputs: (string | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}
import { Brain } from "lucide-react";
import { Button } from "./button";
import { ModeToggle } from "./mode-toggle";
import Link from "next/link";

interface NavigationProps {
  showAuthButton?: boolean;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  authButtonText?: string;
  authButtonHref?: string;
  showThemeToggle?: boolean;
  children?: React.ReactNode;
}

export function Navigation({
  showAuthButton = false,
  showBackButton = false,
  backHref = "/",
  backLabel = "Home",
  authButtonText = "Sign In",
  authButtonHref = "/auth/login",
  showThemeToggle = true,
  children
}: NavigationProps) {
  return (
    <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Brain className="h-8 w-8 text-blue-600 dark:text-purple-400" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse"></div>
        </div>
        <span className="text-2xl font-bold gradient-text-primary">
          TutorByAI
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button variant="ghost" asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        )}
        
        {children}
        
        {showThemeToggle && (
          <ModeToggle className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" />
        )}
        
        {showAuthButton && (
          <Button variant="outline" asChild>
            <Link href={authButtonHref}>{authButtonText}</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
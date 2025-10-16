"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Search, User, BookOpen, Settings, Home, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  profile?: {
    gradeLevel?: number;
    isInterestedInSATPrep?: boolean;
  };
}

export function DashboardLayout({ children, user, profile }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Add SAT Prep to navigation if user is in high school and interested
  const showSATPrep = profile?.gradeLevel && profile.gradeLevel >= 9 && profile.isInterestedInSATPrep;

  const navigationItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "AI Tutor",
      href: "/tutoring",
      icon: BookOpen,
    },
    // Conditionally add SAT Prep for high school students interested in it
    ...(showSATPrep ? [{
      label: "SAT Prep",
      href: "/tutoring/sat-prep",
      icon: Target,
    }] : []),
    {
      label: "Profile",
      href: "/profile",
      icon: User,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-sidebar-primary" />
              {!sidebarCollapsed && (
                <span className="text-xl font-bold text-sidebar-foreground">
                  TutorByAI
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          {user && (
            <div className="border-t border-sidebar-border p-4">
              <div className={cn(
                "flex items-center gap-3",
                sidebarCollapsed && "justify-center"
              )}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold">
                      {user.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <p className="text-sm font-medium text-sidebar-foreground">
                      {user.name}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60">
                      {user.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="flex h-16 items-center border-b border-border bg-card px-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search lessons, topics, or ask a question..."
                  className="w-96 rounded-lg border-0 bg-muted py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary"></span>
              </Button>
              
              {user && (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:block text-sm text-muted-foreground">
                    Welcome back, {user.name}
                  </span>
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
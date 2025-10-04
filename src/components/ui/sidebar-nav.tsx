// src/components/ui/sidebar-nav.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  Calculator, 
  Atom, 
  Globe, 
  Palette, 
  Music, 
  Trophy,
  Star,
  BarChart3,
  Home,
  Settings,
  User
} from "lucide-react";

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  progress?: number;
  children?: NavItem[];
  badge?: string | number;
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard"
  },
  {
    title: "Mathematics",
    icon: Calculator,
    progress: 75,
    children: [
      { title: "Algebra", icon: Calculator, href: "/math/algebra", progress: 80 },
      { title: "Geometry", icon: Calculator, href: "/math/geometry", progress: 65 },
      { title: "Calculus", icon: Calculator, href: "/math/calculus", progress: 45 }
    ]
  },
  {
    title: "Science",
    icon: Atom,
    progress: 60,
    children: [
      { title: "Physics", icon: Atom, href: "/science/physics", progress: 70 },
      { title: "Chemistry", icon: Atom, href: "/science/chemistry", progress: 55 },
      { title: "Biology", icon: Atom, href: "/science/biology", progress: 40 }
    ]
  },
  {
    title: "Language Arts",
    icon: BookOpen,
    progress: 85,
    children: [
      { title: "Reading", icon: BookOpen, href: "/language/reading", progress: 90 },
      { title: "Writing", icon: BookOpen, href: "/language/writing", progress: 80 },
      { title: "Grammar", icon: BookOpen, href: "/language/grammar", progress: 85 }
    ]
  },
  {
    title: "History",
    icon: Globe,
    progress: 50,
    children: [
      { title: "World History", icon: Globe, href: "/history/world", progress: 55 },
      { title: "US History", icon: Globe, href: "/history/us", progress: 45 }
    ]
  },
  {
    title: "Arts",
    icon: Palette,
    progress: 30,
    children: [
      { title: "Visual Arts", icon: Palette, href: "/arts/visual", progress: 35 },
      { title: "Music", icon: Music, href: "/arts/music", progress: 25 }
    ]
  }
];

const bottomItems: NavItem[] = [
  {
    title: "Achievements",
    icon: Trophy,
    href: "/achievements",
    badge: 12
  },
  {
    title: "Progress",
    icon: BarChart3,
    href: "/progress"
  },
  {
    title: "Profile",
    icon: User,
    href: "/profile"
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings"
  }
];

interface SidebarNavProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function SidebarNav({ isCollapsed, onToggle, className }: SidebarNavProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(["Mathematics"]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="khan-progress-bar h-1 w-full mt-1">
      <div 
        className="khan-progress-fill h-full" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  const NavItemComponent = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => {
    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div className="space-y-1">
        <Button
          variant="ghost"
          onClick={() => hasChildren ? toggleExpanded(item.title) : undefined}
          className={cn(
            "w-full justify-start gap-2 h-auto py-2 px-3",
            isChild && "pl-8 text-sm",
            !isCollapsed && "hover:bg-sidebar-accent",
            isCollapsed && "px-2 justify-center"
          )}
        >
          <item.icon className={cn("shrink-0", isChild ? "h-4 w-4" : "h-5 w-5")} />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.title}</span>
              {item.badge && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </Button>
        
        {!isCollapsed && item.progress !== undefined && (
          <div className={cn("px-3", isChild && "pl-8")}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>{item.progress}% complete</span>
              {item.progress >= 80 && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
            </div>
            <ProgressBar progress={item.progress} />
          </div>
        )}
        
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="space-y-1">
            {item.children?.map(child => (
              <NavItemComponent key={child.title} item={child} isChild />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg khan-text-gradient">TutorByAI</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mx-auto">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigationItems.map(item => (
          <NavItemComponent key={item.title} item={item} />
        ))}
      </div>

      {/* Bottom Items */}
      <div className="p-2 space-y-1 border-t border-sidebar-border">
        {bottomItems.map(item => (
          <NavItemComponent key={item.title} item={item} />
        ))}
      </div>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  Users,
  Briefcase,
  Calendar,
  BarChart3,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface MenuItem {
  label: string;
  href: string;
  iconName?: string;
  alwaysVisible?: boolean;
  visible?: boolean;
  comingSoon?: boolean;
  badge?: string | number;
}

interface AdminItem {
  label: string;
  iconName?: string;
  submenu: { label: string; href: string }[];
}

// Mapping des noms d'icônes vers les composants
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  BarChart3,
  Settings,
};

interface HeaderClientProps {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatar: string | null;
  };
  menuItems: MenuItem[];
  adminItems: AdminItem[];
  isAdmin: boolean;
}

export default function HeaderClient({
  user,
  menuItems,
  adminItems,
  isAdmin,
}: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClientSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo et nom */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <span className="text-xl font-bold text-primary">OperaFlow</span>
            </Link>
          </div>

          {/* Menu desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              if (!item.visible && !item.alwaysVisible) return null;

              const Icon = item.iconName ? iconMap[item.iconName] || LayoutDashboard : LayoutDashboard;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault();
                      alert("Module en cours de développement");
                    }
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.comingSoon && (
                    <span className="text-xs opacity-75">(bientôt)</span>
                  )}
                  {item.badge && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Menu Admin */}
            {isAdmin && adminItems.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname.startsWith("/admin")
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  Administration
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      adminMenuOpen && "transform rotate-180"
                    )}
                  />
                </button>

                {adminMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    {adminItems[0].submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        className={cn(
                          "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                          pathname === subitem.href && "bg-primary/10 text-primary font-medium"
                        )}
                        onClick={() => setAdminMenuOpen(false)}
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Menu utilisateur */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="max-w-[150px] truncate">{user.displayName}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    userMenuOpen && "transform rotate-180"
                  )}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Mon profil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>

            {/* Bouton menu mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {menuItems.map((item) => {
              if (!item.visible && !item.alwaysVisible) return null;

              const Icon = item.iconName ? iconMap[item.iconName] || LayoutDashboard : LayoutDashboard;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium",
                    active
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault();
                      alert("Module en cours de développement");
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {item.comingSoon && (
                    <span className="ml-auto text-xs opacity-75">(bientôt)</span>
                  )}
                </Link>
              );
            })}

            {isAdmin && adminItems.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Administration
                </div>
                {adminItems[0].submenu.map((subitem) => (
                  <Link
                    key={subitem.href}
                    href={subitem.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium",
                      pathname === subitem.href
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    {subitem.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-gray-200">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-5 w-5" />
                Mon profil
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Overlay pour fermer les menus en cliquant à l'extérieur */}
      {(userMenuOpen || adminMenuOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setUserMenuOpen(false);
            setAdminMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}


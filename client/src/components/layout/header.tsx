import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { Moon, Sun, Menu, ChevronDown, User, Settings, LogOut } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", adminOnly: false },
    { name: "Markets", path: "/markets", adminOnly: false },
    { name: "Trade", path: "/trade", adminOnly: false },
    { name: "Wallets", path: "/wallets", adminOnly: false },
    { name: "Admin", path: "/admin", adminOnly: true },
  ];

  const displayNavItems = navItems.filter(item => !item.adminOnly || (item.adminOnly && isAdmin));

  function getInitials(fullName?: string, username?: string): string {
    if (fullName) {
      const names = fullName.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`;
      }
      return fullName.substring(0, 2).toUpperCase();
    }
    return username ? username.substring(0, 2).toUpperCase() : "U";
  }

  const userInitials = getInitials(user?.fullName, user?.username);

  return (
    <header className="bg-white dark:bg-darkBg border-b border-border dark:border-darkBorderColor">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="text-primary font-bold text-2xl mr-8">CryptoTrade</a>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            {displayNavItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`${
                    location === item.path
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary transition-colors"
                  }`}
                >
                  {item.name}
                </a>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="mr-2"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 p-2 hover:bg-accent hover:text-accent-foreground rounded-full"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                    <span>{userInitials}</span>
                  </div>
                  <span className="hidden md:inline-block">{user?.username}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="flex cursor-pointer items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="flex cursor-pointer items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/kyc">
                    <a className="flex cursor-pointer items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Verification</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Register</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="container mx-auto px-4 py-2">
            <nav className="flex flex-col space-y-2">
              {displayNavItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`py-2 px-4 rounded-md ${
                      location === item.path
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

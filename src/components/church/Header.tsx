import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, LayoutDashboard, Trophy, LogIn, User } from "lucide-react";

const Header = () => {
  const location = useLocation();
  const isLoggedIn = location.pathname !== "/" && location.pathname !== "/auth";

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    ...(isLoggedIn
      ? [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
        ]
      : []),
  ];

  return (
    <motion.header
      className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border"
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center text-lg">
            ⛪
          </div>
          <span className="font-display text-lg text-foreground hidden sm:block">Grace Church</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
                {active && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          {!isLoggedIn ? (
            <Link
              to="/auth"
              className="ml-2 flex items-center gap-2 px-4 py-2 rounded-xl gradient-gold text-primary-foreground text-sm font-semibold transition-transform hover:scale-105"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="ml-2 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary"
            >
              <User className="w-4 h-4" />
            </Link>
          )}
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;

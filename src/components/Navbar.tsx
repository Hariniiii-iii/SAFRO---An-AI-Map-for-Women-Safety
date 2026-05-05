import { Link, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun, LogOut, LogIn } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useAuth } from "./AuthProvider";
import Logo from "./Logo";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const { user, login, logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Navigation", path: "/navigation" },
    { name: "Safety Insights", path: "/insights" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-display font-medium tracking-wide text-white uppercase italic">
              SAFRO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:text-blush",
                  location.pathname === link.path
                    ? "text-blush"
                    : "text-luxury-gray"
                )}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="h-4 w-px bg-white/10" />

            {user ? (
              <div className="flex items-center space-x-4">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt="Avatar" 
                  className="h-8 w-8 rounded-full border border-blush/20"
                />
                <button
                  onClick={logout}
                  className="p-2 rounded-full hover:bg-white/5 text-luxury-gray hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest text-luxury-gray hover:text-blush transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}

            <Link
              to="/navigation"
              className="bg-blush hover:bg-rose text-luxury-black px-6 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all transform hover:scale-105 shadow-lg shadow-blush/10"
            >
              Start Navigating
            </Link>
          </div>

      {/* Mobile menu button */}
      <div className="md:hidden flex items-center space-x-4">
        <button
          onClick={toggleMenu}
          className="text-luxury-gray hover:text-blush"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    </div>
  </div>

  {/* Mobile Navigation */}
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="md:hidden glass border-b border-white/5 shadow-xl"
      >
        <div className="px-4 pt-4 pb-8 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest",
                location.pathname === link.path
                  ? "text-blush bg-white/5"
                  : "text-luxury-gray hover:text-blush hover:bg-white/5"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="pt-4 border-t border-white/5">
            {user ? (
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center space-x-3">
                  <img src={user.photoURL || ""} className="h-10 w-10 rounded-full" alt="" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">{user.displayName}</span>
                </div>
                <button onClick={logout} className="text-red-400 font-bold text-xs uppercase tracking-wider">Logout</button>
              </div>
            ) : (
              <button onClick={login} className="w-full text-center py-3 font-bold text-blush uppercase text-xs tracking-widest">Login with Google</button>
            )}
            <Link
              to="/navigation"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center bg-blush text-luxury-black px-3 py-4 rounded-xl text-xs font-bold mt-4 shadow-lg shadow-blush/10 uppercase tracking-widest"
            >
              Start Navigating
            </Link>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</nav>
  );
}

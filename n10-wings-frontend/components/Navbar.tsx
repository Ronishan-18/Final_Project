'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2, LogIn, LogOut, Menu, X,
  LayoutDashboard, User, ChevronDown, Shield, Trophy, Building2
} from 'lucide-react';
import styles from './Navbar.module.scss';

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  is_organizer: boolean;
  avatar?: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const checkAuth = () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        setUser(JSON.parse(userStr));
      } else if (token) {
        fetchUser(token);
      } else {
        setUser(null);
      }
    } catch { setUser(null); }
  };

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch { setUser(null); }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setShowDropdown(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'HOME' },
    { href: '/players', label: 'PLAYERS' },
    { href: '/tournaments', label: 'TOURNAMENTS' },
    { href: '/teams', label: 'TEAMS' },
    { href: '/sponsors', label: 'SPONSORS' },
  ];

  const getRoleColor = () => {
    if (user?.role === 'admin') return '#FFD700';
    if (user?.role === 'sponsor') return '#FF006E';
    if (user?.is_organizer) return '#8B00FF';
    return '#00F5FF';
  };

  const getRoleLabel = () => {
    if (user?.role === 'admin') return <><Shield size={14} style={{ display: 'inline', marginBottom: '-2px', marginRight: 4 }} /> ADMIN</>;
    if (user?.role === 'sponsor') return <><Building2 size={14} style={{ display: 'inline', marginBottom: '-2px', marginRight: 4 }} /> SPONSOR</>;
    if (user?.is_organizer) return <><Trophy size={14} style={{ display: 'inline', marginBottom: '-2px', marginRight: 4 }} /> ORGANIZER</>;
    return <><Gamepad2 size={14} style={{ display: 'inline', marginBottom: '-2px', marginRight: 4 }} /> GAMER</>;
  };

  return (
    <motion.nav
      className={`${styles.navbar} ${scrolled ? styles['navbar--scrolled'] : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Scan line effect */}
      <div className={styles.navbar__scanline} />

      <div className={styles.navbar__inner}>
        {/* Logo */}
        <Link href="/" className={styles.navbar__logo}>
          <motion.div
            className={styles.navbar__logo_icon}
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Gamepad2 size={24} color="#00F5FF" strokeWidth={1.5} />
          </motion.div>
          <div className={styles.navbar__logo_text}>
            <span className={styles.navbar__logo_n10}>N-10</span>
            <span className={styles.navbar__logo_wings}>WINGS</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className={styles.navbar__links}>
          {navLinks.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.3 }}
            >
              <Link
                href={link.href}
                className={`${styles.navbar__link} ${pathname === link.href ? styles['navbar__link--active'] : ''}`}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    className={styles.navbar__link_indicator}
                    layoutId="nav-indicator"
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Auth */}
        <div className={styles.navbar__auth_section}>
          {user ? (
            <div className={styles.navbar__auth} ref={dropdownRef}>
              <motion.button
                className={styles.navbar__user_btn}
                onClick={() => setShowDropdown(!showDropdown)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={styles.navbar__avatar}
                  style={{ borderColor: getRoleColor() }}
                >
                  {user.avatar ? (
                    <img src={`http://localhost:5000${user.avatar}`} alt={user.username} />
                  ) : (
                    <span style={{ color: getRoleColor() }}>
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className={styles.navbar__avatar_glow}
                    style={{ background: getRoleColor() }} />
                </div>
                <div className={styles.navbar__user_info}>
                  <span className={styles.navbar__username}>{user.username}</span>
                  <span className={styles.navbar__role} style={{ color: getRoleColor() }}>
                    {getRoleLabel()}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: showDropdown ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} color="#8892A4" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className={styles.navbar__dropdown}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className={styles.navbar__dropdown_header}>
                      <div className={styles.navbar__dropdown_avatar}
                        style={{ borderColor: getRoleColor() }}>
                        {user.avatar ? (
                          <img src={`http://localhost:5000${user.avatar}`} alt={user.username} />
                        ) : (
                          <span style={{ color: getRoleColor() }}>
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={styles.navbar__dropdown_name}>{user.username}</p>
                        <p className={styles.navbar__dropdown_email}>{user.email}</p>
                        <span className={styles.navbar__dropdown_role}
                          style={{ color: getRoleColor(), borderColor: `${getRoleColor()}40` }}>
                          {getRoleLabel()}
                        </span>
                      </div>
                    </div>

                    <div className={styles.navbar__dropdown_links}>
                      {[
                        { href: '/dashboard', icon: <LayoutDashboard size={14} />, label: 'Dashboard' },
                        { href: `/profile/${user.id}`, icon: <User size={14} />, label: 'My Profile' },
                        ...(user.role === 'admin' ? [{ href: '/dashboard/admin', icon: <Shield size={14} />, label: 'Admin Panel' }] : []),
                        ...(user.is_organizer ? [{ href: '/dashboard/organizer', icon: <Trophy size={14} />, label: 'Organizer Dashboard' }] : []),
                      ].map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={styles.navbar__dropdown_link}
                          onClick={() => setShowDropdown(false)}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <button
                      className={styles.navbar__dropdown_logout}
                      onClick={handleLogout}
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className={styles.navbar__guest}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/login" className={styles.navbar__login}>
                  <LogIn size={14} />
                  Login
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/register" className={styles.navbar__join}>
                  Join Now →
                </Link>
              </motion.div>
            </div>
          )}

          {/* Mobile Toggle */}
          <button
            className={styles.navbar__mobile_btn}
            onClick={() => setIsOpen(!isOpen)}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={20} color="#00F5FF" />
                </motion.div>
              ) : (
                <motion.div key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu size={20} color="#00F5FF" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.navbar__mobile}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={link.href}
                  className={`${styles.navbar__mobile_link} ${pathname === link.href ? styles['navbar__mobile_link--active'] : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}

            {user ? (
              <>
                <Link href="/dashboard"
                  className={styles.navbar__mobile_link}
                  onClick={() => setIsOpen(false)}>
                  <LayoutDashboard size={14} style={{ marginRight: 6, display: 'inline' }} /> Player Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link href="/dashboard/admin"
                    className={styles.navbar__mobile_link}
                    onClick={() => setIsOpen(false)}>
                    <Shield size={14} style={{ marginRight: 6, display: 'inline' }} /> Admin Panel
                  </Link>
                )}
                {user.is_organizer && (
                  <Link href="/dashboard/organizer"
                    className={styles.navbar__mobile_link}
                    onClick={() => setIsOpen(false)}>
                    <Trophy size={14} style={{ marginRight: 6, display: 'inline' }} /> Organizer Dashboard
                  </Link>
                )}
                {user.role === 'sponsor' && (
                  <Link href="/dashboard/sponsor"
                    className={styles.navbar__mobile_link}
                    onClick={() => setIsOpen(false)}>
                    <Building2 size={14} style={{ marginRight: 6, display: 'inline' }} /> Sponsor Dashboard
                  </Link>
                )}
                <button
                  className={styles.navbar__mobile_logout}
                  onClick={() => { handleLogout(); setIsOpen(false); }}>
                  <LogOut size={14} style={{ marginRight: 6, display: 'inline' }} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login"
                  className={styles.navbar__mobile_link}
                  onClick={() => setIsOpen(false)}>
                  Login
                </Link>
                <Link href="/register"
                  className={styles.navbar__mobile_join}
                  onClick={() => setIsOpen(false)}>
                  Join Now →
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
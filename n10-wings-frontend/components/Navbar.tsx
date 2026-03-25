'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Gamepad2, Users, Trophy, Shield, Handshake, LogIn, Menu, X } from 'lucide-react';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/players', label: 'Players' },
    { href: '/tournaments', label: 'Tournaments' },
    { href: '/teams', label: 'Teams' },
    { href: '/sponsors', label: 'Sponsors' },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbar__inner}>

        {/* Logo */}
        <Link href="/" className={styles.navbar__logo}>
          <span className={styles['navbar__logo-icon']}>
            <Gamepad2 size={22} color="#00F5FF" strokeWidth={1.75} />
          </span>
          <span className={styles['navbar__logo-text']}>N-10 WINGS</span>
        </Link>

        {/* Desktop Links */}
        <div className={styles.navbar__links}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navbar__link}>
              {link.label}
            </Link>
          ))}
          <Link href="/login" className={styles.navbar__login}>
            <LogIn size={14} strokeWidth={2} style={{ marginRight: 4 }} />
            Login
          </Link>
          <Link href="/register" className={styles.navbar__join}>
            Join Now
          </Link>
        </div>

        {/* Mobile Button */}
        <button
          className={styles['navbar__mobile-btn']}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen
            ? <X size={20} color="#00F5FF" strokeWidth={2} />
            : <Menu size={20} color="#00F5FF" strokeWidth={2} />
          }
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={styles['navbar__mobile-menu']}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles['navbar__mobile-menu-link']}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" className={styles['navbar__mobile-menu-link']} onClick={() => setIsOpen(false)}>
            Login
          </Link>
          <Link href="/register" className={styles['navbar__mobile-menu-join']} onClick={() => setIsOpen(false)}>
            Join Now →
          </Link>
        </div>
      )}
    </nav>
  );
}
'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbar__inner}>

        {/* Logo */}
        <Link href="/" className={styles.navbar__logo}>
          <span className={styles['navbar__logo-icon']}>🎮</span>
          <span className={styles['navbar__logo-text']}>N-10 WINGS</span>
        </Link>

        {/* Desktop Links */}
        <div className={styles.navbar__links}>
          <Link href="/" className={styles.navbar__link}>Home</Link>
          <Link href="/players" className={styles.navbar__link}>Players</Link>
          <Link href="/tournaments" className={styles.navbar__link}>Tournaments</Link>
          <Link href="/teams" className={styles.navbar__link}>Teams</Link>
          <Link href="/sponsors" className={styles.navbar__link}>Sponsors</Link>
          <Link href="/login" className={styles.navbar__login}>Login</Link>
          <Link href="/register" className={styles.navbar__join}>Join Now</Link>
        </div>

        {/* Mobile Button */}
        <button
          className={styles['navbar__mobile-btn']}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={styles['navbar__mobile-menu']}>
          <Link href="/" className={styles['navbar__mobile-menu-link']}>Home</Link>
          <Link href="/players" className={styles['navbar__mobile-menu-link']}>Players</Link>
          <Link href="/tournaments" className={styles['navbar__mobile-menu-link']}>Tournaments</Link>
          <Link href="/teams" className={styles['navbar__mobile-menu-link']}>Teams</Link>
          <Link href="/sponsors" className={styles['navbar__mobile-menu-link']}>Sponsors</Link>
          <Link href="/login" className={styles['navbar__mobile-menu-link']}>Login</Link>
          <Link href="/register" className={styles['navbar__mobile-menu-join']}>
            Join Now →
          </Link>
        </div>
      )}
    </nav>
  );
}
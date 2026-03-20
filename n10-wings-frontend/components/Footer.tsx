import Link from 'next/link';
import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footer__inner}>
        <div className={styles.footer__grid}>

          {/* Brand */}
          <div>
            <div className={styles.footer__logo}>
              <span className={styles['footer__logo-icon']}>🎮</span>
              <span className={styles['footer__logo-text']}>N-10 WINGS</span>
            </div>
            <p className={styles.footer__desc}>
              The ultimate E-Sports Development and Management platform.
              Connect players, organizers, and sponsors in one powerful ecosystem.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={styles.footer__heading}>Quick Links</h3>
            <ul className={styles.footer__links}>
              <li><Link href="/" className={styles['footer__links-item']}>Home</Link></li>
              <li><Link href="/about" className={styles['footer__links-item']}>About</Link></li>
              <li><Link href="/tournaments" className={styles['footer__links-item']}>Tournaments</Link></li>
              <li><Link href="/contact" className={styles['footer__links-item']}>Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={styles.footer__heading}>Contact</h3>
            <ul className={styles.footer__contact}>
              <li className={styles['footer__contact-item']}>
                📧 ronisonroni0@gmail.com
              </li>
              <li className={styles['footer__contact-item']}>
                🌍 Sri Lanka
              </li>
              <li className={styles['footer__contact-item']}>
                🎮 E-Sports Platform
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.footer__bottom}>
          <p className={styles['footer__bottom-text']}>
            © 2026 N-10 Wings. All rights reserved.
          </p>
          <p className={styles['footer__bottom-glow']}>
            Built with ⚡ for E-Sports
          </p>
        </div>
      </div>
    </footer>
  );
}
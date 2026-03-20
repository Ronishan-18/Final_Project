'use client';

import { useState } from 'react';
import styles from './contact.module.scss';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className={styles.contact}>

      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className="badge">📬 Get In Touch</div>
          <h1 className={styles.hero__title}>
            CONTACT <span className="gradient-text">US</span>
          </h1>
          <p className={styles.hero__sub}>
            Have questions about N-10 Wings? We&apos;d love to hear from you!
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* Content */}
      <section className={`${styles.content} section`}>
        <div className="container">
          <div className={styles.content__grid}>

            {/* Info */}
            <div className={styles.info}>
              <h2 className={styles.info__title}>
                GET IN <span className="gradient-text">TOUCH</span>
              </h2>
              {[
                { icon: '📧', label: 'EMAIL', val: 'ronisonroni0@gmail.com' },
                { icon: '🌍', label: 'LOCATION', val: 'Sri Lanka' },
                { icon: '🎮', label: 'PLATFORM', val: 'N-10 Wings E-Sports' },
                { icon: '⏰', label: 'RESPONSE', val: 'Within 24 hours' },
              ].map((item) => (
                <div key={item.label} className={styles.info__item}>
                  <div className={styles.info__icon}>{item.icon}</div>
                  <div>
                    <div className={styles.info__label}>{item.label}</div>
                    <div className={styles.info__val}>{item.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className={styles.form}>
              {submitted ? (
                <div className={styles.form__success}>
                  <span className={styles.form__success_icon}>✅</span>
                  <h3 className={styles.form__success_title}>Message Sent!</h3>
                  <p className={styles.form__success_sub}>
                    We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className={styles.form__success_btn}
                  >
                    Send Another →
                  </button>
                </div>
              ) : (
                <>
                  <h3 className={styles.form__title}>SEND A MESSAGE</h3>
                  <div className={styles.form__group}>
                    <label className={styles.form__label}>Your Name</label>
                    <input
                      type="text"
                      className={styles.form__input}
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className={styles.form__group}>
                    <label className={styles.form__label}>Email Address</label>
                    <input
                      type="email"
                      className={styles.form__input}
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className={styles.form__group}>
                    <label className={styles.form__label}>Subject</label>
                    <input
                      type="text"
                      className={styles.form__input}
                      placeholder="What is this about?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                  <div className={styles.form__group}>
                    <label className={styles.form__label}>Message</label>
                    <textarea
                      className={`${styles.form__input} ${styles.form__textarea}`}
                      placeholder="Write your message..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                  <button onClick={handleSubmit} className={styles.form__btn}>
                    Send Message →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
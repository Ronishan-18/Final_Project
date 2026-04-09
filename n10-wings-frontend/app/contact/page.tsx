'use client';

import { useState } from 'react';
import { Mail, MapPin, Gamepad2, Timer, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../lib/api';


import styles from './contact.module.scss';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return showToast('Please fill all fields', 'error');
    }

    setLoading(true);
    try {
      const res = await api.post('/public/contact', formData);
      if (res.data.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        showToast('Message sent successfully!');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className={styles.contact}>
      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast--${toast.type}`]}`}>
          {toast.msg}
        </div>
      )}


      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
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
                { icon: <Mail size={24} />, label: 'EMAIL', val: 'ronisonroni0@gmail.com' },
                { icon: <MapPin size={24} />, label: 'LOCATION', val: 'Sri Lanka' },
                { icon: <Gamepad2 size={24} />, label: 'PLATFORM', val: 'N-10 Wings E-Sports' },
                { icon: <Timer size={24} />, label: 'RESPONSE', val: 'Within 24 hours' },
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
                  <CheckCircle size={48} color="#00FF88" className={styles.form__success_icon} />
                  <h3 className={styles.form__success_title}>Message Sent!</h3>
                  <p className={styles.form__success_sub}>
                    We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className={styles.form__success_btn}
                  >
                    Send Another <ArrowRight size={16} />
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
                  <button 
                    onClick={handleSubmit} 
                    className={styles.form__btn}
                    disabled={loading}
                  >
                    {loading ? (
                      <>Sending... <Loader2 size={16} className="animate-spin" /></>
                    ) : (
                      <>Send Message <ArrowRight size={16} /></>
                    )}
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
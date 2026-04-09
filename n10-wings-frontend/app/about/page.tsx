import styles from './about.module.scss';

export default function About() {
  return (
    <div className={styles.about}>

      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.hero__title}>

            ABOUT{' '}
            <span className="gradient-text">N-10 WINGS</span>
          </h1>
          <p className={styles.hero__sub}>
            Building the future of E-Sports management in Sri Lanka and beyond.
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* Mission */}
      <section className={`${styles.mission} section`}>
        <div className="container">
          <div className={styles.mission__grid}>
            <div>
              <h2 className={styles.mission__title}>
                OUR <span className="gradient-text">MISSION</span>
              </h2>
              <p className={styles.mission__text}>
                N-10 Wings was created to solve the biggest problems in the
                E-Sports industry. We provide a centralized platform where
                gamers, organizers, and sponsors can connect and thrive.
              </p>
              <p className={styles.mission__text}>
                Our goal is to make E-Sports accessible, organized, and
                rewarding for everyone — from casual players to pro teams.
              </p>
            </div>
            <div className={styles.mission__cards}>
              {[
                { icon: '🎯', title: 'Our Goal', desc: 'Centralize E-Sports' },
                { icon: '🌍', title: 'Our Reach', desc: 'Sri Lanka & beyond' },
                { icon: '👥', title: 'Community', desc: '1,200+ members' },
                { icon: '🏆', title: 'Tournaments', desc: '48+ events hosted' },
              ].map((item) => (
                <div key={item.title} className={styles.mission__card}>
                  <span className={styles.mission__card_icon}>{item.icon}</span>
                  <span className={styles.mission__card_title}>{item.title}</span>
                  <span className={styles.mission__card_desc}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Problem & Solution */}
      <section className={`${styles.ps} section`}>
        <div className="container">
          <h2 className="section-title">
            PROBLEM & <span className="gradient-text">SOLUTION</span>
          </h2>
          <div className={styles.ps__grid}>
            <div className={styles.ps__card_problem}>
              <h3 className={styles.ps__heading} style={{ color: '#FF006E' }}>
                ❌ The Problem
              </h3>
              {[
                'No centralized E-Sports platform',
                'Players have no proper profile system',
                'Organizers manage everything manually',
                'Sponsors cannot find talent easily',
                'No proper team management',
                'Match results not tracked properly',
              ].map((p) => (
                <div key={p} className={styles.ps__item}>
                  <span style={{ color: '#FF006E' }}>→</span> {p}
                </div>
              ))}
            </div>
            <div className={styles.ps__card_solution}>
              <h3 className={styles.ps__heading} style={{ color: '#00F5FF' }}>
                ✅ Our Solution
              </h3>
              {[
                'Centralized management platform',
                'Role-based profiles for all users',
                'Automated tournament brackets',
                'Sponsor player discovery system',
                'Complete team management',
                'Real-time results & leaderboards',
              ].map((s) => (
                <div key={s} className={styles.ps__item}>
                  <span style={{ color: '#00F5FF' }}>→</span> {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className={`${styles.tech} section`}>
        <div className="container">
          <h2 className="section-title">
            TECH <span className="gradient-text">STACK</span>
          </h2>
          <div className={styles.tech__grid}>
            {[
              { name: 'Next.js', type: 'Frontend' },
              { name: 'SCSS', type: 'Styling' },
              { name: 'Node.js', type: 'Backend' },
              { name: 'Express.js', type: 'Framework' },
              { name: 'MySQL', type: 'Database' },
              { name: 'JWT', type: 'Auth' },
              { name: 'PUBG API', type: 'Integration' },
              { name: 'Google OAuth', type: 'Auth' },
            ].map((t) => (
              <div key={t.name} className={styles.tech__card}>
                <span className={styles.tech__name}>{t.name}</span>
                <span className={styles.tech__type}>{t.type}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
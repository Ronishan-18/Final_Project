import styles from './LoadingScreen.module.scss';
import { motion } from 'framer-motion';

export default function LoadingScreen({ message = 'LOADING ARENA...' }: { message?: string }) {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.container}>
        <motion.div 
          className={styles.controller}
          animate={{
            y: [-10, 10, -10],
            rotate: [-2, 2, -2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg width="120" height="80" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <path d="M10 20C10 12 18 10 25 10H75C82 10 90 12 90 20V40C90 50 80 55 70 55C65 55 60 50 55 45H45C40 50 35 55 30 55C20 55 10 50 10 40V20Z" fill="#0D0D14" stroke="#00F5FF" strokeWidth="2" />
            
            {/* Handles highlight */}
            <path d="M15 25C15 20 20 18 25 18H35" stroke="#00F5FF" strokeOpacity="0.3" strokeWidth="1" />
            
            {/* Directional Pad */}
            <rect x="22" y="28" width="6" height="18" rx="1" fill="#00F5FF" fillOpacity="0.2" />
            <rect x="16" y="34" width="18" height="6" rx="1" fill="#00F5FF" fillOpacity="0.2" />
            
            {/* Buttons */}
            <circle cx="75" cy="28" r="3" fill="#FF6B00" />
            <circle cx="82" cy="35" r="3" fill="#FF006E" />
            <circle cx="75" cy="42" r="3" fill="#00F5FF" />
            <circle cx="68" cy="35" r="3" fill="#00FF88" />
            
            {/* Joysticks */}
            <circle cx="38" cy="42" r="6" fill="#1A1A24" stroke="#00F5FF" strokeWidth="1" />
            <circle cx="62" cy="42" r="6" fill="#1A1A24" stroke="#00F5FF" strokeWidth="1" />
            
            {/* Center Button */}
            <rect x="45" y="25" width="10" height="4" rx="2" fill="#00F5FF" fillOpacity="0.4" />
          </svg>
          
          {/* Scan Line effect on the controller */}
          <motion.div 
            className={styles.scanline}
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        <div className={styles.textContainer}>
          <h2 className={styles.title}>{message}</h2>
          <div className={styles.progressBar}>
            <motion.div 
              className={styles.progressFill}
              animate={{ width: ['0%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>

      <div className={styles.backgroundGlow} />
    </div>
  );
}

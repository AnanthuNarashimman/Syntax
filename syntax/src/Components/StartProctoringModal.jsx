import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import styles from './StartProctoringModal.module.css';

/**
 * Start Proctoring Modal
 * Displays before strict mode exam starts
 * Explains proctoring rules and initiates fullscreen on user click
 */
const StartProctoringModal = ({ show, onStart, contestTitle }) => {
  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.iconContainer}>
          <Shield className={styles.shieldIcon} size={80} />
        </div>

        <h2 className={styles.title}>Proctored Exam Mode</h2>
        <p className={styles.subtitle}>{contestTitle}</p>

        <div className={styles.content}>
          <div className={styles.warningBox}>
            <AlertTriangle size={20} />
            <span>This is a proctored examination</span>
          </div>

          <div className={styles.rulesSection}>
            <h3>Proctoring Rules:</h3>
            <ul className={styles.rulesList}>
              <li>✓ Stay in fullscreen mode throughout the exam</li>
              <li>✓ Do not switch tabs or windows</li>
              <li>✓ Keep your mouse inside the exam window</li>
              <li>✓ Do not open DevTools or browser extensions</li>
              <li>✓ Do not copy or paste content</li>
              <li>✓ Do not navigate away from this page</li>
            </ul>
          </div>

          <div className={styles.violationInfo}>
            <h3>Violation Policy:</h3>
            <p>You are allowed <strong>3 warnings</strong>. After the 4th violation, your exam will be <strong>automatically submitted</strong>.</p>
          </div>

          <div className={styles.important}>
            <p><strong>Important:</strong> Clicking "Start Exam" will enter fullscreen mode and activate proctoring.</p>
          </div>
        </div>

        <button className={styles.startButton} onClick={onStart}>
          <Shield size={20} />
          Start Proctored Exam
        </button>
      </div>
    </div>
  );
};

export default StartProctoringModal;

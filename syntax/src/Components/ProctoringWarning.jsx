import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from './ProctoringWarning.module.css';

/**
 * Proctoring Warning Modal
 *
 * Displays a warning when a proctoring violation is detected
 * Shows the violation count and auto-submit warning
 *
 * @param {boolean} show - Whether to show the modal
 * @param {string} violation - Type of violation detected
 * @param {number} count - Current violation count
 * @param {number} maxViolations - Maximum allowed violations
 * @param {function} onClose - Callback when modal is closed
 */
const ProctoringWarning = ({ show, violation, count, maxViolations, onClose }) => {
  if (!show) return null;

  const isLastWarning = count >= maxViolations;
  const remainingChances = maxViolations - count;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.iconContainer}>
          <AlertTriangle className={styles.warningIcon} size={60} />
        </div>

        <h2 className={styles.title}>
          {isLastWarning ? '⚠️ FINAL WARNING' : '⚠️ Proctoring Violation Detected'}
        </h2>

        <div className={styles.content}>
          <div className={styles.violationBox}>
            <span className={styles.violationLabel}>Violation Type:</span>
            <span className={styles.violationType}>{violation}</span>
          </div>

          <div className={styles.countBox}>
            <span className={styles.countLabel}>Warning</span>
            <span className={styles.count}>
              <span className={styles.currentCount}>{count}</span>
              <span className={styles.separator}>/</span>
              <span className={styles.maxCount}>{maxViolations}</span>
            </span>
          </div>

          {isLastWarning ? (
            <div className={styles.dangerMessage}>
              <p className={styles.dangerText}>
                🚨 <strong>This is your last warning!</strong>
              </p>
              <p className={styles.dangerSubtext}>
                One more violation will automatically submit your contest and end the exam.
              </p>
            </div>
          ) : (
            <div className={styles.infoMessage}>
              <p className={styles.infoText}>
                You have <strong>{remainingChances}</strong> warning{remainingChances !== 1 ? 's' : ''} remaining.
              </p>
              <p className={styles.infoSubtext}>
                Please stay on this page in fullscreen mode with your mouse inside the exam window.
              </p>
            </div>
          )}

          <div className={styles.rulesBox}>
            <h3 className={styles.rulesTitle}>Proctoring Rules:</h3>
            <ul className={styles.rulesList}>
              <li>✓ Stay in fullscreen mode</li>
              <li>✓ Keep focus on exam window</li>
              <li>✓ Keep mouse inside exam area</li>
              <li>✓ Do not open DevTools or browser extensions</li>
              <li>✓ Do not switch tabs or windows</li>
              <li>✓ Do not copy or paste content</li>
            </ul>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={isLastWarning ? styles.acknowledgeButtonDanger : styles.acknowledgeButton}
            onClick={onClose}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProctoringWarning;

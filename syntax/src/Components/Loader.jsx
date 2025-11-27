import React from 'react';
import styles from '../Styles/ComponentStyles/Loader.module.css';

const Loader = () => {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loaderWrapper}>
        <div className={styles.spinner}>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerRing}></div>
          <div className={styles.codeElement}>&lt;/&gt;</div>
        </div>
        <div className={styles.loaderText}>
          <span className={styles.loadingText}>Loading</span>
          <span className={styles.dots}>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default Loader; 
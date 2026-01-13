import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

/**
 * Proctoring Hook for Strict Mode Contests
 *
 * Features:
 * - Fullscreen enforcement
 * - Tab switching detection
 * - Navigation blocking
 * - Mouse tracking (detects DevTools & sidebars)
 * - Copy/paste blocking
 * - Keyboard shortcut blocking
 * - Right-click blocking
 * - Warning system with auto-submit after 3 violations
 *
 * @param {string} contestId - Contest ID
 * @param {boolean} isStrictMode - Whether contest is in strict mode
 * @param {function} onAutoSubmit - Callback to auto-submit contest
 * @returns {object} Proctoring state and controls
 */
const useProctoring = (contestId, isStrictMode, onAutoSubmit) => {
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [violationType, setViolationType] = useState('');
  const [isProctoringActive, setIsProctoringActive] = useState(false);

  const MAX_VIOLATIONS = 3;
  const mouseOutsideTimer = useRef(null);
  const mouseOutsideStartTime = useRef(null);
  const devToolsCheckInterval = useRef(null);
  const isCleaningUp = useRef(false);
  const lastViolationTime = useRef(0);
  const lastViolationType = useRef('');

  // Load existing violations from localStorage
  useEffect(() => {
    if (!isStrictMode || !contestId) return;

    const savedViolations = localStorage.getItem(`proctoring_violations_${contestId}`);
    if (savedViolations) {
      const count = parseInt(savedViolations, 10);
      setViolations(count);
    }
  }, [contestId, isStrictMode]);

  /**
   * Record a proctoring violation
   */
  const recordViolation = useCallback((type) => {
    if (isCleaningUp.current) return;

    // Debounce: Prevent duplicate violations within 500ms (e.g., blur + visibilitychange for same tab switch)
    const now = Date.now();
    const timeSinceLastViolation = now - lastViolationTime.current;
    
    // If same type of violation or very close in time (< 500ms), it's likely the same user action
    if (timeSinceLastViolation < 500) {
      console.log(`⏭️ Skipping duplicate violation: ${type} (${timeSinceLastViolation}ms since last)`);
      return;
    }

    lastViolationTime.current = now;
    lastViolationType.current = type;

    console.log(`🚨 Violation detected: ${type}`);

    setViolations(prev => {
      const newCount = prev + 1;
      console.log(`Violation count: ${newCount}/${MAX_VIOLATIONS}`);

      // Save to localStorage
      localStorage.setItem(`proctoring_violations_${contestId}`, newCount.toString());

      // Log violation details
      const violationLog = JSON.parse(localStorage.getItem(`proctoring_log_${contestId}`) || '[]');
      violationLog.push({
        type,
        timestamp: new Date().toISOString(),
        count: newCount
      });
      localStorage.setItem(`proctoring_log_${contestId}`, JSON.stringify(violationLog));

      // Send to backend for admin review
      axios.post('/api/proctoring/log-violation', {
        contestId,
        violationType: type,
        violationCount: newCount,
        timestamp: new Date().toISOString()
      }, { withCredentials: true }).catch(err => {
        console.error('Failed to log violation to backend:', err);
      });

      console.warn(`⚠️ Proctoring Violation [${newCount}/${MAX_VIOLATIONS}]: ${type}`);

      // Auto-submit on 4th violation
      if (newCount > MAX_VIOLATIONS) {
        console.error(`❌ Max violations exceeded! Auto-submitting...`);
        setTimeout(() => {
          onAutoSubmit(`Too many proctoring violations (${newCount})`);
        }, 2000);
      }

      return newCount;
    });

    setViolationType(type);
    setShowWarning(true);
  }, [contestId, onAutoSubmit]);

  /**
   * Enter fullscreen mode (for re-entry after violations)
   */
  const enterFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('⚠️ Failed to re-enter fullscreen:', err.message);
        // Don't record violation here - just warn
      });
    }
  }, []);

  /**
   * Start proctoring (called when contest starts)
   * Note: Fullscreen should be entered BEFORE this in the user click handler
   */
  const startProctoring = useCallback(() => {
    console.log('🔒 startProctoring called - isStrictMode:', isStrictMode, 'contestId:', contestId);

    if (!isStrictMode) {
      console.log('⚠️ Not strict mode, proctoring not activated');
      return;
    }

    if (!contestId) {
      console.log('⚠️ No contest ID, proctoring not activated');
      return;
    }

    console.log('✅ Activating proctoring event listeners...');
    setIsProctoringActive(true);

    // Note: enterFullscreen() removed - should be called directly in user click handler
    // We only re-enter fullscreen on violations via event listeners below

    console.log('🔒 Proctoring activated for strict mode contest');
  }, [isStrictMode, contestId]);

  /**
   * Main proctoring effect
   */
  useEffect(() => {
    console.log('Proctoring effect running - isStrictMode:', isStrictMode, 'isProctoringActive:', isProctoringActive);

    if (!isStrictMode || !isProctoringActive) {
      console.log('Proctoring effect: Not active, returning');
      return;
    }

    console.log('✅ Starting proctoring event listeners...');

    // ==================== FULLSCREEN MONITORING ====================
    let fullscreenExitTimer = null;
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Give user 2 seconds to press F11 again or fix accidental exit
        if (fullscreenExitTimer) clearTimeout(fullscreenExitTimer);
        fullscreenExitTimer = setTimeout(() => {
          if (!document.fullscreenElement) {
            recordViolation('Exited fullscreen mode');
            // Try to re-enter fullscreen
            setTimeout(enterFullscreen, 500);
          }
        }, 2000);
      } else {
        // User re-entered fullscreen - cancel violation
        if (fullscreenExitTimer) {
          clearTimeout(fullscreenExitTimer);
          fullscreenExitTimer = null;
        }
      }
    };

    // ==================== TAB SWITCHING DETECTION ====================
    const handleVisibilityChange = () => {
      console.log('👀 Visibility change detected - document.hidden:', document.hidden);
      if (document.hidden) {
        recordViolation('Switched to another tab');
      }
    };

    // ==================== WINDOW FOCUS DETECTION ====================
    const handleWindowBlur = () => {
      console.log('👀 Window blur detected');
      recordViolation('Window lost focus');
    };

    // ==================== MOUSE TRACKING ====================
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Check if mouse is outside visible viewport
      const isOutside = (
        clientX < 0 ||
        clientX > innerWidth ||
        clientY < 0 ||
        clientY > innerHeight
      );

      if (isOutside) {
        if (!mouseOutsideStartTime.current) {
          mouseOutsideStartTime.current = Date.now();
        } else {
          const duration = Date.now() - mouseOutsideStartTime.current;
          // If mouse outside for more than 3 seconds (likely DevTools/Sidebar)
          if (duration > 3000) {
            recordViolation('Mouse outside exam area (DevTools/Sidebar suspected)');
            mouseOutsideStartTime.current = null;
          }
        }
      } else {
        mouseOutsideStartTime.current = null;
      }
    };

    const handleMouseLeave = () => {
      // Clear any existing timer
      if (mouseOutsideTimer.current) {
        clearTimeout(mouseOutsideTimer.current);
      }

      // Set new timer (2 second grace period)
      mouseOutsideTimer.current = setTimeout(() => {
        recordViolation('Mouse left exam window');
      }, 2000);
    };

    const handleMouseEnter = () => {
      // Cancel violation if mouse comes back quickly
      if (mouseOutsideTimer.current) {
        clearTimeout(mouseOutsideTimer.current);
        mouseOutsideTimer.current = null;
      }
    };

    // ==================== COPY/PASTE/CUT BLOCKING ====================
    const handleCopy = (e) => {
      e.preventDefault();
      recordViolation('Copy attempt blocked');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      recordViolation('Paste attempt blocked');
    };

    const handleCut = (e) => {
      e.preventDefault();
      recordViolation('Cut attempt blocked');
    };

    // ==================== KEYBOARD SHORTCUTS BLOCKING ====================
    const handleKeyDown = (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools shortcuts)
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key))
      ) {
        e.preventDefault();
        recordViolation('DevTools shortcut blocked');
        return false;
      }

      // Ctrl+C, Ctrl+V, Ctrl+X (Clipboard shortcuts)
      if (e.ctrlKey && ['c', 'v', 'x', 'C', 'V', 'X'].includes(e.key)) {
        e.preventDefault();
        recordViolation('Clipboard shortcut blocked');
        return false;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && ['u', 'U'].includes(e.key)) {
        e.preventDefault();
        recordViolation('View source blocked');
        return false;
      }
    };

    // ==================== RIGHT-CLICK BLOCKING ====================
    const handleContextMenu = (e) => {
      e.preventDefault();
      // Don't record violation for every right-click (too noisy)
      // Just silently block it
      return false;
    };

    // ==================== NAVIGATION BLOCKING ====================
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your progress will be saved but proctoring will record this as a violation.';
      return e.returnValue;
    };

    // Block browser back button
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      recordViolation('Navigation attempt blocked');
    };

    // ==================== DEVTOOLS DETECTION (SIZE-BASED) ====================
    let lastInnerWidth = window.innerWidth;
    let lastInnerHeight = window.innerHeight;

    const checkDevTools = () => {
      const widthThreshold = 160;
      const heightThreshold = 160;

      // Detect if viewport size changed significantly (DevTools opened)
      const widthDiff = Math.abs(window.innerWidth - lastInnerWidth);
      const heightDiff = Math.abs(window.innerHeight - lastInnerHeight);

      if (widthDiff > widthThreshold || heightDiff > heightThreshold) {
        recordViolation('DevTools suspected (viewport size changed)');
        lastInnerWidth = window.innerWidth;
        lastInnerHeight = window.innerHeight;
      }
    };

    // ==================== ATTACH EVENT LISTENERS ====================
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Push initial state to prevent back navigation
    window.history.pushState(null, '', window.location.href);

    // Start DevTools detection interval
    devToolsCheckInterval.current = setInterval(checkDevTools, 2000);

    // ==================== CLEANUP ====================
    return () => {
      isCleaningUp.current = true;

      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);

      if (mouseOutsideTimer.current) {
        clearTimeout(mouseOutsideTimer.current);
      }

      if (devToolsCheckInterval.current) {
        clearInterval(devToolsCheckInterval.current);
      }

      // Exit fullscreen when unmounting
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isStrictMode, isProctoringActive, recordViolation, enterFullscreen]);

  return {
    violations,
    maxViolations: MAX_VIOLATIONS,
    showWarning,
    setShowWarning,
    violationType,
    isProctoringActive,
    startProctoring
  };
};

export default useProctoring;

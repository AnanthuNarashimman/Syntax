// Enhanced Coding Contest Execution Page
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import {
  ArrowLeft, Clock, Trophy, Play, Send, Terminal, CheckCircle,
  XCircle, AlertCircle, Code, FileText, Lightbulb, Target,
  RotateCcw, Maximize2, Minimize2, Copy, Check, ChevronDown,
  ChevronLeft, ChevronRight
} from 'lucide-react';

import StudentNavbar from '../Components/StudentNavbar';
import Loader from '../Components/Loader';
import { useAlert } from '../contexts/AlertContext';
import styles from '../Styles/PageStyles/CodingContestPage.module.css';
import {
  getAllSubmissionSummaries,
  saveSubmissionSummary,
  clearAllSubmissions
} from '../utils/encryption';
import useProctoring from '../hooks/useProctoring';
import ProctoringWarning from '../Components/ProctoringWarning';
import StartProctoringModal from '../Components/StartProctoringModal';

// Language Configuration with Judge0 IDs
const languageOptions = {
  python: {
    id: 71,
    monaco: 'python',
    name: 'Python',
    defaultCode: '# Write your solution here\n\n'
  },
  java: {
    id: 62,
    monaco: 'java',
    name: 'Java',
    defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}'
  },
  c: {
    id: 50,
    monaco: 'c',
    name: 'C',
    defaultCode: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}'
  },
  cpp: {
    id: 54,
    monaco: 'cpp',
    name: 'C++',
    defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}'
  },
  javascript: {
    id: 63,
    monaco: 'javascript',
    name: 'JavaScript',
    defaultCode: '// Write your solution here\n\n'
  }
};

function CodingContestPage() {
  const { problemId } = useParams(); // Contest ID from URL
  const navigate = useNavigate();
  const { showError, showSuccess, showInfo } = useAlert();

  // Contest & Problem State
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [isLoadingContest, setIsLoadingContest] = useState(true);

  // Editor State
  const [code, setCode] = useState('');
  const [selectedLang, setSelectedLang] = useState('python');
  const [customInput, setCustomInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Execution State
  const [output, setOutput] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionType, setExecutionType] = useState(null); // 'run' or 'submit'

  // Timer State
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState('problem');
  const [showOutput, setShowOutput] = useState(false);

  // Score & Results State
  const [problemResults, setProblemResults] = useState({});
  const [showResults, setShowResults] = useState(false);

  // Proctoring State
  const [showStartProctoringModal, setShowStartProctoringModal] = useState(false);

  // Refs
  const autoSaveTimer = useRef(null);
  const editorRef = useRef(null);

  // Proctoring - Only active for strict mode contests
  const isStrictMode = contest?.eventMode === 'strict';

  // Auto-submit handler for proctoring violations
  const handleProctoringAutoSubmit = useCallback(async (reason) => {
    showError(`Contest auto-submitted: ${reason}`);
    console.warn(`⚠️ Auto-submitting contest: ${reason}`);

    // Submit whatever the user has completed so far (even if nothing)
    try {
      showInfo('Submitting your contest due to proctoring violations...');

      const submissions = getAllSubmissionSummaries(problemId, problems.length);
      const submissionArray = Object.entries(submissions).map(([index, submission]) => ({
        ...submission,
        problemIndex: parseInt(index)
      }));

      // Submit to backend - even if no submissions (to record the disqualification)
      await axios.post('/api/student/finish-contest', {
        contestId: problemId,
        submissions: submissionArray,
        totalProblems: problems.length,
        completedAt: new Date().toISOString(),
        disqualified: true,
        disqualificationReason: reason
      }, {
        withCredentials: true
      });

      // Clear all local data
      clearAllSubmissions(problemId, problems.length);
      
      const message = submissionArray.length > 0 
        ? `Contest submitted with ${submissionArray.length} problem(s) completed. You were disqualified due to proctoring violations.`
        : 'Contest submitted with 0 score due to proctoring violations.';
      
      showInfo(message);
      console.log(`✓ ${message}`);

    } catch (error) {
      console.error('Error during proctoring auto-submit:', error);
      showError('Failed to submit contest. Please contact support.');
    }

    // Clear proctoring data
    localStorage.removeItem(`proctoring_violations_${problemId}`);
    localStorage.removeItem(`proctoring_log_${problemId}`);

    // Navigate away
    setTimeout(() => {
      navigate('/student-contests');
    }, 2000);
  }, [problemId, problems, navigate, showError, showInfo]);

  // Initialize proctoring hook
  const {
    violations,
    maxViolations,
    showWarning,
    setShowWarning,
    violationType,
    isProctoringActive,
    startProctoring
  } = useProctoring(problemId, isStrictMode, handleProctoringAutoSubmit);

  // OPTIMIZED: Fetch Contest Data - fetch single contest instead of all
  useEffect(() => {
    const fetchContest = async () => {
      setIsLoadingContest(true);
      try {
        // Fetch single contest by ID instead of fetching all contests
        const response = await axios.get(`/api/student/events/${problemId}`, {
          withCredentials: true
        });

        if (!response.data.event) {
          showError('Contest not found');
          navigate('/student-contests');
          return;
        }

        const foundContest = response.data.event;
        setContest(foundContest);

        // Extract problems from contest
        if (foundContest.problems && Array.isArray(foundContest.problems)) {
          setProblems(foundContest.problems);

          // Load saved state from localStorage
          const savedState = localStorage.getItem(`contest_${problemId}_state`);
          if (savedState) {
            const parsed = JSON.parse(savedState);
            setCurrentProblemIndex(parsed.currentProblemIndex || 0);
            setSelectedLang(parsed.selectedLang || 'python');
          }

          // Initialize timer
          if (foundContest.eventMode === 'strict' && foundContest.durationMinutes) {
            const savedTimer = localStorage.getItem(`contest_${problemId}_timer`);
            if (savedTimer) {
              const timerData = JSON.parse(savedTimer);
              const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000);
              const remaining = timerData.initialTime - elapsed;
              if (remaining > 0) {
                setTimeRemaining(remaining);
                setTimerStarted(true);
              } else {
                setTimeRemaining(0);
              }
            }
          }

          // Backend handles all validation - no client-side encryption needed
          console.log('✓ Contest loaded - ready for secure backend-validated submissions');
        } else {
          showError('No problems found in this contest');
          navigate('/student-contests');
        }

      } catch (error) {
        console.error('Error fetching contest:', error);
        showError('Failed to load contest');
        navigate('/student-contests');
      }
      setIsLoadingContest(false);
    };

    fetchContest();
  }, [problemId, navigate, showError]);

  // Show proctoring modal for strict mode contests
  useEffect(() => {
    if (contest && isStrictMode && !isProctoringActive) {
      console.log('🔒 Strict mode detected - showing proctoring modal');
      // Show modal that requires user click to start proctoring (fixes fullscreen issue)
      setShowStartProctoringModal(true);
    }
  }, [contest, isStrictMode, isProctoringActive]);

  // Handle proctoring start (called when user clicks "Start Exam" button)
  const handleStartProctoring = useCallback(async () => {
    console.log('User clicked Start Proctored Exam');
    
    // Enter fullscreen IMMEDIATELY with user gesture (before any async operations)
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        console.log('✅ Fullscreen activated successfully');
        
        // Close modal and activate proctoring ONLY after successful fullscreen
        setShowStartProctoringModal(false);
        showInfo('Proctoring activated! Stay in fullscreen mode and keep focus on the exam window.');
        startProctoring();
      } else {
        // Browser doesn't support fullscreen API
        console.error('❌ Fullscreen API not supported');
        showError('Your browser does not support fullscreen mode. Please use Chrome, Firefox, or Edge for this exam.');
        // Keep modal open - don't start contest
      }
    } catch (err) {
      // User denied fullscreen permission or other error
      console.error('❌ Failed to enter fullscreen:', err);
      showError('Fullscreen mode is required for this proctored exam. Please click "Start Exam" again and allow fullscreen.');
      // Keep modal open - don't start contest, don't close modal
    }
  }, [startProctoring, showInfo, showError]);

  // Load submission summaries from localStorage to restore progress after refresh
  useEffect(() => {
    if (problems.length > 0 && problemId) {
      const summaries = getAllSubmissionSummaries(problemId, problems.length);
      if (Object.keys(summaries).length > 0) {
        setProblemResults(summaries);
        console.log(`✓ Loaded ${Object.keys(summaries).length} submission summaries from storage`);
      }
    }
  }, [problems.length, problemId]);

  // Load Code from localStorage or starter code
  useEffect(() => {
    if (problems.length > 0 && currentProblemIndex < problems.length) {
      const problem = problems[currentProblemIndex];
      const storageKey = `contest_${problemId}_problem_${currentProblemIndex}_${selectedLang}`;

      const savedCode = localStorage.getItem(storageKey);
      if (savedCode) {
        setCode(savedCode);
      } else {
        const starterCode = problem.starterCode?.[selectedLang] || languageOptions[selectedLang].defaultCode;
        setCode(starterCode);
      }
    }
  }, [currentProblemIndex, selectedLang, problems, problemId]);

  // Auto-save code
  useEffect(() => {
    if (code && problems.length > 0) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      autoSaveTimer.current = setTimeout(() => {
        const storageKey = `contest_${problemId}_problem_${currentProblemIndex}_${selectedLang}`;
        localStorage.setItem(storageKey, code);

        // Save state
        localStorage.setItem(`contest_${problemId}_state`, JSON.stringify({
          currentProblemIndex,
          selectedLang,
          lastSaved: Date.now()
        }));
      }, 1000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [code, currentProblemIndex, selectedLang, problemId, problems.length]);

  // Timer countdown
  useEffect(() => {
    if (!timerStarted || timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Timer expired - will be handled by checking timeRemaining === 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerStarted, timeRemaining]);

  // Handle time expiry
  useEffect(() => {
    if (timeRemaining === 0 && timerStarted) {
      handleTimerAutoSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, timerStarted]);

  // Start timer on first interaction
  const startTimer = useCallback(() => {
    if (!timerStarted && contest?.eventMode === 'strict' && contest?.durationMinutes) {
      const initialTime = contest.durationMinutes * 60;
      setTimeRemaining(initialTime);
      setTimerStarted(true);

      localStorage.setItem(`contest_${problemId}_timer`, JSON.stringify({
        startTime: Date.now(),
        initialTime
      }));
    }
  }, [timerStarted, contest, problemId]);

  // Format time display
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle language change
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    const problem = problems[currentProblemIndex];

    // Check if language is supported
    if (problem.languagesSupported && !problem.languagesSupported.includes(lang)) {
      showError(`${languageOptions[lang].name} is not supported for this problem`);
      return;
    }

    setSelectedLang(lang);
    startTimer();
  };

  // Handle Run Code
  const handleRun = async () => {
    if (!code.trim()) {
      showError('Please write some code first');
      return;
    }

    const problem = problems[currentProblemIndex];

    startTimer();
    setIsExecuting(true);
    setExecutionType('run');
    setShowOutput(true);
    setOutput(null);

    try {
      // If custom input is provided, run against custom input only
      if (customInput.trim()) {
        const response = await axios.post('/api/judge/run', {
          source_code: code,
          language_id: languageOptions[selectedLang].id,
          stdin: customInput
        });

        setOutput(response.data);

        // Log to console instead of showing alert
        if (response.data.status?.id === 3) {
          console.log('✓ Code executed successfully');
        } else {
          console.log('✗ Code execution completed with status:', response.data.status?.description);
        }
      } else {
        // If no custom input, run against open test cases
        const exampleTestCases = problem.exampleIO || problem.examples || [];
        const openTestCases = problem.openTestCases || [];
        const allOpenTests = [...exampleTestCases, ...openTestCases];

        if (allOpenTests.length === 0) {
          showError('No open test cases available. Please provide custom input.');
          setIsExecuting(false);
          return;
        }

        // Run against all open test cases
        const submissions = allOpenTests.map(tc => ({
          source_code: code,
          language_id: languageOptions[selectedLang].id,
          stdin: tc.input,
          expected_output: tc.output
        }));

        // Submit batch and get tokens
        const batchResponse = await axios.post('https://judge0-ce.p.rapidapi.com/submissions/batch',
          { submissions },
          {
            params: { base64_encoded: 'false' },
            headers: {
              'content-type': 'application/json',
              'X-RapidAPI-Key': import.meta.env.VITE_JUDGE0_RAPIDAPI_KEY || 'fba00342ccmshd4915b90c833a20p1a34bcjsne81de2afa405',
              'X-RapidAPI-Host': import.meta.env.VITE_JUDGE0_RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com',
            }
          }
        );

        const tokens = batchResponse.data;

        if (!Array.isArray(tokens)) {
          throw new Error('Invalid response from Judge0 API');
        }

        const tokenList = tokens.map(t => t.token).join(',');

        // Poll for results
        let results = [];
        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));

          const resultsResponse = await axios.get(`https://judge0-ce.p.rapidapi.com/submissions/batch`,
            {
              params: {
                tokens: tokenList,
                base64_encoded: 'false',
                fields: 'stdout,stderr,status,time,memory,compile_output'
              },
              headers: {
                'X-RapidAPI-Key': import.meta.env.VITE_JUDGE0_RAPIDAPI_KEY || 'fba00342ccmshd4915b90c833a20p1a34bcjsne81de2afa405',
                'X-RapidAPI-Host': import.meta.env.VITE_JUDGE0_RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com',
              }
            }
          );

          results = resultsResponse.data.submissions;
          const allComplete = results.every(r => r.status && r.status.id !== 1 && r.status.id !== 2);

          if (allComplete) {
            break;
          }

          attempts++;
        }

        if (attempts >= maxAttempts) {
          throw new Error('Timeout waiting for Judge0 results');
        }

        // Process results
        const testResults = results.map((result, index) => {
          const testCase = allOpenTests[index];
          const statusId = result.status?.id || 0;
          const actualOutput = (result.stdout || '').trim();
          const expectedOutput = (testCase.output || '').trim();
          const executedSuccessfully = statusId === 3;
          const outputMatches = actualOutput === expectedOutput;
          const passed = executedSuccessfully && outputMatches;

          return {
            index: index + 1,
            passed,
            status: passed ? 'Passed' : (executedSuccessfully ? 'Failed' : result.status?.description || 'Error'),
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: result.stdout || '',
            stderr: result.stderr || '',
            compile_output: result.compile_output || ''
          };
        });

        const passedCount = testResults.filter(r => r.passed).length;
        const totalCount = testResults.length;

        // Log results to console
        console.log(`\n=== Open Test Cases Results ===`);
        console.log(`Total: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);

        testResults.forEach((testResult) => {
          if (testResult.passed) {
            console.log(`✓ Open Test Case ${testResult.index}: Passed`);
          } else {
            console.log(`\n✗ Open Test Case ${testResult.index}: ${testResult.status}`);
            console.log(`  Input: ${testResult.input}`);
            console.log(`  Expected: ${testResult.expectedOutput}`);
            console.log(`  Got: ${testResult.actualOutput || '(empty)'}`);
            if (testResult.stderr) {
              console.log(`  Error: ${testResult.stderr}`);
            }
            if (testResult.compile_output) {
              console.log(`  Compilation: ${testResult.compile_output}`);
            }
          }
        });
        console.log(`================================\n`);

        setOutput({
          isOpenTestRun: true,
          passedCount,
          totalCount,
          testResults
        });
      }
    } catch (error) {
      console.error('Error running code:', error);
      const errorData = error.response?.data;
      setOutput(errorData || { stderr: 'An unexpected error occurred' });
    }

    setIsExecuting(false);
  };

  // Handle Submit Solution - Uses secure backend API
  const handleSubmit = async () => {
    if (!code.trim()) {
      showError('Please write some code first');
      return;
    }

    const problem = problems[currentProblemIndex];

    if (!problem) {
      showError('Problem data not found');
      return;
    }

    startTimer();
    setIsExecuting(true);
    setExecutionType('submit');
    setShowOutput(true);
    setOutput(null);

    try {
      // Call secure backend API - backend will fetch hidden test cases and run all tests
      const response = await axios.post('/api/judge/contest-submit', {
        source_code: code,
        language_id: languageOptions[selectedLang].id,
        event_id: problemId,
        problem_index: currentProblemIndex
      }, {
        withCredentials: true
      });

      const { success, passedCount, totalCount, pointsEarned, maxPoints, testResults } = response.data;
      const allPassed = success;

      // Find first failed test case from visible tests
      const firstFailure = testResults.find(r => r.isVisible && !r.passed);

      // Prepare submission record for local storage (no encryption needed - backend validates everything)
      const submissionRecord = {
        problemIndex: currentProblemIndex,
        problemId: problem.questionId,
        problemCode: problem.contestProblemCode,
        problemTitle: problem.title,
        code,
        language: selectedLang,
        pointsEarned,
        maxPoints,
        passedTests: passedCount,
        totalTests: totalCount,
        testResults,
        timestamp: Date.now(),
        solved: allPassed
      };

      // Store submission locally (verified by backend, no encryption needed)
      try {
        saveSubmissionSummary(problemId, currentProblemIndex, submissionRecord);
        console.log(`✓ Submission verified and stored for Problem ${currentProblemIndex + 1}`);
      } catch (error) {
        console.error('Failed to store submission:', error);
        showError('Failed to save submission locally');
      }

      setOutput({
        isSubmission: true,
        allPassed,
        passedCount,
        totalCount,
        pointsEarned,
        maxPoints: problem.points,
        testResults: testResults.filter(r => r.isVisible),
        firstFailure
      });

      // Update local state for UI (stored in memory, not accessible to user)
      setProblemResults(prev => ({
        ...prev,
        [currentProblemIndex]: {
          problemCode: problem.contestProblemCode,
          problemTitle: problem.title,
          pointsEarned,
          maxPoints: problem.points,
          passedTests: passedCount,
          totalTests: totalCount,
          solved: allPassed
        }
      }));

      // Show appropriate message
      if (allPassed) {
        showSuccess(`Perfect! All ${totalCount} tests passed! You earned ${pointsEarned} points!`);
      } else if (passedCount > 0) {
        showInfo(`${passedCount}/${totalCount} tests passed. You earned ${pointsEarned} points. Keep trying!`);
      } else {
        showError(`No tests passed. Review your solution and try again.`);
      }

    } catch (error) {
      console.error('Error submitting code:', error);
      console.error('Error details:', error.response?.data || error.message);

      let errorMessage = 'Submission failed';

      if (error.response?.status === 401) {
        errorMessage = 'Unauthorized: Please check your API key';
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded: Too many requests';
      } else if (error.response?.data) {
        errorMessage = error.response.data.message || JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }

      setOutput({
        error: true,
        message: errorMessage,
        details: error.response?.data
      });
      showError(errorMessage);
    }

    setIsExecuting(false);
  };

  // Auto-submit when timer expires
  const handleTimerAutoSubmit = async () => {
    showInfo('Time expired! Auto-submitting your contest...');

    // Save final results with all encrypted submissions
    const saved = await saveFinalResults();

    if (saved) {
      setTimeout(() => {
        navigate('/student-contests');
      }, 2000);
    } else {
      showError('Failed to submit contest. Please try again.');
    }
  };

  // Save final contest results - Send all verified submissions to backend
  const saveFinalResults = async () => {
    try {
      showInfo('Submitting your contest for evaluation...');

      // Retrieve all verified submissions from localStorage
      // These were already validated by backend during each submission
      const submissions = getAllSubmissionSummaries(problemId, problems.length);

      // Convert to array and include problemIndex for each submission
      const submissionArray = Object.entries(submissions).map(([index, submission]) => ({
        ...submission,
        problemIndex: parseInt(index)
      }));

      if (submissionArray.length === 0) {
        showError('No submissions found. Please solve at least one problem.');
        return false;
      }

      console.log(`Submitting ${submissionArray.length} verified problem(s) to backend for final storage...`);

      // Send verified submissions to backend for final storage
      const response = await axios.post('/api/student/finish-contest', {
        contestId: problemId,
        submissions: submissionArray,
        totalProblems: problems.length,
        completedAt: new Date().toISOString()
      }, {
        withCredentials: true
      });

      // Server returns final score confirmation
      const { totalScore, totalPossible, message } = response.data;

      // Clean up local data after successful submission
      clearAllSubmissions(problemId, problems.length);

      showSuccess(message || `Contest completed! Your score: ${totalScore}/${totalPossible}`);
      console.log(`✓ Final score: ${totalScore}/${totalPossible}`);

      return true;
    } catch (error) {
      console.error('Error saving final results:', error);

      let errorMessage = 'Failed to save contest results';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
      return false;
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showSuccess('Code copied to clipboard');
  };

  // Reset code to starter code
  const handleResetCode = () => {
    const problem = problems[currentProblemIndex];
    const starterCode = problem.starterCode?.[selectedLang] || languageOptions[selectedLang].defaultCode;
    setCode(starterCode);
    showInfo('Code reset to starter template');
  };

  // Clear output
  const handleClearOutput = () => {
    setOutput(null);
    setShowOutput(false);
  };

  // Render output section
  const renderOutput = () => {
    if (!output) {
      return <div className={styles.outputPlaceholder}>Run your code or submit to see results here...</div>;
    }

    // Open test case run results
    if (output.isOpenTestRun) {
      const allPassed = output.passedCount === output.totalCount;
      return (
        <div className={styles.testResultsGrid}>
          <div className={`${styles.verdictSection} ${allPassed ? styles.success : styles.error}`}>
            <h3 className={`${styles.verdictTitle} ${allPassed ? styles.success : styles.error}`}>
              {allPassed ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              Open Test Cases Results
            </h3>
            <div className={styles.verdictMessage}>
              <p>Tests Passed: {output.passedCount} / {output.totalCount}</p>
              {allPassed ? (
                <p>All open test cases passed! Try submitting your solution.</p>
              ) : (
                <p>Some test cases failed. Review the results below.</p>
              )}
            </div>
          </div>

          {output.testResults && output.testResults.length > 0 && (
            <div className={styles.openTestResults}>
              {output.testResults.map((testResult, idx) => (
                <div
                  key={idx}
                  className={`${styles.testCaseResult} ${testResult.passed ? styles.passed : styles.failed}`}
                >
                  <div className={styles.testCaseHeader}>
                    <span className={styles.testCaseName}>
                      {testResult.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      Open Test Case {testResult.index}
                    </span>
                    <span className={`${styles.statusBadge} ${testResult.passed ? styles.passed : styles.failed}`}>
                      {testResult.status}
                    </span>
                  </div>
                  <div className={styles.testCaseDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Input</span>
                      <pre className={styles.detailValue}>{testResult.input}</pre>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Expected Output</span>
                      <pre className={styles.detailValue}>{testResult.expectedOutput}</pre>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Your Output</span>
                      <pre className={styles.detailValue}>{testResult.actualOutput || '(empty)'}</pre>
                    </div>
                    {testResult.stderr && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Error</span>
                        <pre className={styles.detailValue}>{testResult.stderr}</pre>
                      </div>
                    )}
                    {testResult.compile_output && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Compilation Output</span>
                        <pre className={styles.detailValue}>{testResult.compile_output}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Submission results
    if (output.isSubmission) {
      return (
        <div className={styles.testResultsGrid}>
          <div className={`${styles.verdictSection} ${output.allPassed ? styles.success : styles.error}`}>
            <h3 className={`${styles.verdictTitle} ${output.allPassed ? styles.success : styles.error}`}>
              {output.allPassed ? <CheckCircle size={24} /> : <XCircle size={24} />}
              {output.allPassed ? 'All Tests Passed!' : 'Some Tests Failed'}
            </h3>
            <div className={styles.verdictMessage}>
              <p>Tests Passed: {output.passedCount} / {output.totalCount}</p>
              <p>Score: {output.pointsEarned} / {output.maxPoints} points</p>
              {output.allPassed && <p>You've solved this problem!</p>}
            </div>
          </div>

          {output.firstFailure && (
            <div className={`${styles.testCaseResult} ${styles.failed}`}>
              <div className={styles.testCaseHeader}>
                <span className={styles.testCaseName}>
                  <XCircle size={16} />
                  {output.firstFailure.isVisible ? `Example ${output.firstFailure.index}` : `Test Case ${output.firstFailure.index}`}
                </span>
                <span className={`${styles.statusBadge} ${styles.failed}`}>Failed</span>
              </div>
              <div className={styles.testCaseDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Input</span>
                  <pre className={styles.detailValue}>{output.firstFailure.input}</pre>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Expected Output</span>
                  <pre className={styles.detailValue}>{output.firstFailure.expectedOutput}</pre>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Your Output</span>
                  <pre className={styles.detailValue}>{output.firstFailure.actualOutput || '(empty)'}</pre>
                </div>
                {output.firstFailure.stderr && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Error</span>
                    <pre className={styles.detailValue}>{output.firstFailure.stderr}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Run results (custom input)
    return (
      <div className={styles.outputContent}>
        {output.status && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong> {output.status.description}
          </div>
        )}

        {output.stdout && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>Output:</strong>
            <pre>{output.stdout}</pre>
          </div>
        )}

        {output.stderr && (
          <div style={{ marginBottom: '1rem', color: '#ef4444' }}>
            <strong>Error:</strong>
            <pre>{output.stderr}</pre>
          </div>
        )}

        {output.compile_output && (
          <div style={{ marginBottom: '1rem', color: '#f59e0b' }}>
            <strong>Compilation Output:</strong>
            <pre>{output.compile_output}</pre>
          </div>
        )}

        {output.time && <div>Time: {output.time}s</div>}
        {output.memory && <div>Memory: {output.memory} KB</div>}
      </div>
    );
  };

  // Loading state
  if (isLoadingContest) {
    return (
      <div className={styles.codingContestPage}>
        <StudentNavbar />
        <div className={styles.loadingContainer}>
          <Loader />
          <p className={styles.loadingText}>Loading contest...</p>
        </div>
      </div>
    );
  }

  // No problems found
  if (!contest || problems.length === 0) {
    return (
      <div className={styles.codingContestPage}>
        <StudentNavbar />
        <div className={styles.contestContainer}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Contest not found or has no problems</h2>
            <button className={styles.backBtn} onClick={() => navigate('/student-contests')}>
              <ArrowLeft size={16} />
              Back to Contests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex];
  const supportedLanguages = currentProblem.languagesSupported || Object.keys(languageOptions);

  return (
    <div className={styles.codingContestPage}>
      <StudentNavbar />

      {/* Start Proctoring Modal - Shows before exam starts */}
      {isStrictMode && (
        <StartProctoringModal
          show={showStartProctoringModal}
          onStart={handleStartProctoring}
          contestTitle={contest?.eventTitle || 'Contest'}
        />
      )}

      {/* Proctoring Warning Modal - Only shown for strict mode */}
      {isStrictMode && (
        <ProctoringWarning
          show={showWarning}
          violation={violationType}
          count={violations}
          maxViolations={maxViolations}
          onClose={() => setShowWarning(false)}
        />
      )}

      <div className={styles.contestContainer}>
        {/* Header */}
        <div className={styles.contestHeader}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => navigate('/student-contests')}>
              <ArrowLeft size={16} />
              Back
            </button>
            <div className={styles.contestInfo}>
              <h1 className={styles.contestTitle}>{contest.eventTitle}</h1>
              <div className={styles.contestMeta}>
                <span className={styles.metaItem}>
                  <Code size={14} />
                  Problem {currentProblemIndex + 1} of {problems.length}
                </span>
                <span className={styles.metaItem}>
                  <Target size={14} />
                  {currentProblem.points} points
                </span>
              </div>
            </div>
          </div>

          <div className={styles.headerRight}>
            {contest.eventMode === 'strict' && (
              <>
                <div className={styles.timerCard}>
                  <Clock className={styles.timerIcon} />
                  <div className={styles.timerInfo}>
                    <span className={styles.timerLabel}>Time Left</span>
                    <span className={styles.timerValue}>{formatTime(timeRemaining)}</span>
                  </div>
                </div>

                {/* Proctoring Indicator */}
                <div className={styles.proctoringBadge} title={`${violations}/${maxViolations} violations`}>
                  <AlertCircle size={16} />
                  <span>Proctored</span>
                  <span className={violations > 0 ? styles.violationCountActive : styles.violationCount}>
                    {violations}/{maxViolations}
                  </span>
                </div>
              </>
            )}

            <button
              className={styles.viewResultsBtn}
              onClick={() => setShowResults(true)}
              title="View all results"
            >
              View Results
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Left Panel - Problem Description */}
          <div className={styles.leftPanel}>
            {/* Problem Navigation */}
            <div className={styles.problemNavigation}>
              <button
                className={styles.navBtn}
                onClick={() => setCurrentProblemIndex(prev => Math.max(0, prev - 1))}
                disabled={currentProblemIndex === 0}
              >
                ← Previous Problem
              </button>
              <div className={styles.problemIndicators}>
                {problems.map((prob, idx) => (
                  <button
                    key={idx}
                    className={`${styles.problemIndicator} ${idx === currentProblemIndex ? styles.active : ''} ${problemResults[idx]?.solved ? styles.solved : ''}`}
                    onClick={() => setCurrentProblemIndex(idx)}
                    title={`Problem ${prob.contestProblemCode}: ${problemResults[idx]?.solved ? 'Solved' : 'Unsolved'}`}
                  >
                    {prob.contestProblemCode}
                  </button>
                ))}
              </div>
              <button
                className={styles.navBtn}
                onClick={() => setCurrentProblemIndex(prev => Math.min(problems.length - 1, prev + 1))}
                disabled={currentProblemIndex === problems.length - 1}
              >
                Next Problem →
              </button>
            </div>

            <div className={styles.problemTabs}>
              <button
                className={`${styles.tab} ${activeTab === 'problem' ? styles.active : ''}`}
                onClick={() => setActiveTab('problem')}
              >
                <FileText size={16} />
                Problem
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'examples' ? styles.active : ''}`}
                onClick={() => setActiveTab('examples')}
              >
                <Lightbulb size={16} />
                Examples
              </button>
            </div>

            <div className={styles.problemContent}>
              {activeTab === 'problem' && (
                <>
                  {/* Problem Title */}
                  {currentProblem.title && (
                    <div className={styles.problemSection}>
                      <h2 className={styles.sectionTitle}>
                        <FileText size={20} />
                        {currentProblem.title}
                      </h2>
                    </div>
                  )}

                  {/* Problem Description */}
                  <div className={styles.problemSection}>
                    <h3 className={styles.sectionTitle}>Description</h3>
                    <div className={styles.sectionContent}>
                      <pre className={styles.problemDescription}>{currentProblem.description || currentProblem.problem}</pre>
                    </div>
                  </div>

                  <div className={styles.problemSection}>
                    <h3 className={styles.sectionTitle}>Input / Output Format</h3>
                    <div className={styles.formatGrid}>
                      <div className={styles.formatCard}>
                        <div className={styles.formatLabel}>Input Format</div>
                        <div className={styles.formatText}>
                          {currentProblem.inputFormat || currentProblem.problemDetails?.inputFormat || 'Not specified'}
                        </div>
                      </div>
                      <div className={styles.formatCard}>
                        <div className={styles.formatLabel}>Output Format</div>
                        <div className={styles.formatText}>
                          {currentProblem.outputFormat || currentProblem.problemDetails?.outputFormat || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Constraints - supports both string (new) and array (old) formats */}
                  {(currentProblem.constraints || currentProblem.problemDetails?.constraints) && (
                    <div className={styles.problemSection}>
                      <h3 className={styles.sectionTitle}>Constraints</h3>
                      {typeof currentProblem.constraints === 'string' ? (
                        <div className={styles.sectionContent}>
                          <pre className={styles.problemDescription}>{currentProblem.constraints}</pre>
                        </div>
                      ) : Array.isArray(currentProblem.problemDetails?.constraints) && currentProblem.problemDetails.constraints.length > 0 ? (
                        <ul className={styles.constraintsList}>
                          {currentProblem.problemDetails.constraints.map((constraint, idx) => (
                            <li key={idx} className={styles.constraintItem}>{constraint}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className={styles.sectionContent}>Not specified</div>
                      )}
                    </div>
                  )}

                  {currentProblem.problemDetails?.hint && (
                    <div className={styles.problemSection}>
                      <h3 className={styles.sectionTitle}>
                        <Lightbulb size={18} />
                        Hint
                      </h3>
                      <div className={styles.hintBox}>
                        {currentProblem.problemDetails.hint}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'examples' && (
                <div className={styles.problemSection}>
                  <h2 className={styles.sectionTitle}>
                    <Lightbulb size={20} />
                    Example Test Cases
                  </h2>
                  <div className={styles.examplesList}>
                    {/* Support both exampleIO (new) and examples (old) formats */}
                    {(currentProblem.exampleIO || currentProblem.examples) && (currentProblem.exampleIO || currentProblem.examples).length > 0 ? (
                      (currentProblem.exampleIO || currentProblem.examples).map((example, idx) => (
                        <div key={idx} className={styles.exampleCard}>
                          <div className={styles.exampleTitle}>
                            <CheckCircle size={16} />
                            Example {idx + 1}
                          </div>
                          <div className={styles.exampleBox}>
                            <div className={styles.exampleLabel}>Input</div>
                            <pre className={styles.exampleValue}>{example.input}</pre>
                          </div>
                          <div className={styles.exampleBox}>
                            <div className={styles.exampleLabel}>Output</div>
                            <pre className={styles.exampleValue}>{example.output}</pre>
                          </div>
                          {example.explanation && (
                            <div className={styles.explanation}>{example.explanation}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className={styles.sectionContent}>No examples available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className={styles.rightPanel}>
            <div className={styles.editorHeader}>
              <div className={styles.languageSelector}>
                <span className={styles.languageLabel}>Language:</span>
                <select
                  className={styles.languageSelect}
                  value={selectedLang}
                  onChange={handleLanguageChange}
                >
                  {Object.entries(languageOptions).map(([key, lang]) => (
                    <option
                      key={key}
                      value={key}
                      disabled={!supportedLanguages.includes(key)}
                    >
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.editorActions}>
                <button
                  className={styles.iconBtn}
                  onClick={handleCopyCode}
                  title="Copy code"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <button
                  className={styles.iconBtn}
                  onClick={handleResetCode}
                  title="Reset to starter code"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  className={styles.iconBtn}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.editorWrapper}>
              <Editor
                height="100%"
                language={languageOptions[selectedLang].monaco}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
              />
            </div>

            <div className={styles.editorFooter}>
              <div className={styles.customInputSection}>
                <label className={styles.inputLabel}>Custom Input (for Run only):</label>
                <textarea
                  className={styles.customInputArea}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter custom input here..."
                />
              </div>

              <div className={styles.actionButtons}>
                <button
                  className={styles.runBtn}
                  onClick={handleRun}
                  disabled={isExecuting}
                >
                  {isExecuting && executionType === 'run' ? (
                    <>Running...</>
                  ) : (
                    <>
                      <Play size={16} />
                      Run Code
                    </>
                  )}
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={isExecuting}
                >
                  {isExecuting && executionType === 'submit' ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Section */}
            {showOutput && (
              <div className={styles.outputSection}>
                <div className={styles.outputHeader}>
                  <h3 className={styles.outputTitle}>
                    <Terminal size={16} />
                    Output
                  </h3>
                  <button className={styles.clearBtn} onClick={handleClearOutput}>
                    Clear
                  </button>
                </div>
                <div className={styles.outputContent}>
                  {isExecuting ? (
                    <div className={styles.loadingContainer}>
                      <Loader />
                      <p className={styles.loadingText}>
                        {executionType === 'submit' ? 'Running test cases...' : 'Executing code...'}
                      </p>
                    </div>
                  ) : (
                    renderOutput()
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && (
        <div className={styles.resultsModal}>
          <div className={styles.resultsModalContent}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>
                <Trophy size={24} />
                Contest Results
              </h2>
              <button
                className={styles.closeModalBtn}
                onClick={() => setShowResults(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.resultsBody}>
              <div className={styles.totalScoreCard}>
                <div className={styles.totalScoreLabel}>Contest Progress</div>
                <div className={styles.totalScoreValue}>
                  {Object.keys(problemResults).length} / {problems.length}
                </div>
                <div className={styles.totalScoreSubtext}>
                  Problems Attempted
                </div>
              </div>

              <div className={styles.problemResultsList}>
                {problems.map((problem, idx) => {
                  const result = problemResults[idx];
                  const isAttempted = result !== undefined;
                  const isSolved = result?.solved || false;

                  return (
                    <div
                      key={idx}
                      className={`${styles.problemResultCard} ${isAttempted ? (isSolved ? styles.solved : styles.attempted) : styles.unsolved}`}
                    >
                      <div className={styles.problemResultHeader}>
                        <div className={styles.problemResultCode}>
                          Problem {problem.contestProblemCode}
                        </div>
                        <div className={`${styles.problemResultStatus} ${isAttempted ? (isSolved ? styles.solved : styles.attempted) : styles.unsolved}`}>
                          {isSolved ? '✓ Perfect' : isAttempted ? '◐ Attempted' : '✗ Not Attempted'}
                        </div>
                      </div>
                      <div className={styles.problemResultTitle}>
                        {problem.title}
                      </div>
                      {result && (
                        <div className={styles.problemResultTests}>
                          Tests Passed: {result.passedTests} / {result.totalTests}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.resultsActions}>
                <button
                  className={styles.continueBtn}
                  onClick={() => setShowResults(false)}
                >
                  Continue Solving
                </button>
                <button
                  className={styles.finishBtn}
                  onClick={async () => {
                    const saved = await saveFinalResults();
                    if (saved) {
                      setTimeout(() => navigate('/student-contests'), 1500);
                    }
                  }}
                >
                  Finish Contest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CodingContestPage;

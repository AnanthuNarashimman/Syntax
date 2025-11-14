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

  // Refs
  const autoSaveTimer = useRef(null);
  const editorRef = useRef(null);

  // Fetch Contest Data
  useEffect(() => {
    const fetchContest = async () => {
      setIsLoadingContest(true);
      try {
        const response = await axios.get(`/api/student/events`, {
          withCredentials: true
        });

        const allContests = response.data.events || [];
        const foundContest = allContests.find(c => c.id === problemId);

        if (!foundContest) {
          showError('Contest not found');
          navigate('/student-contests');
          return;
        }

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
      handleAutoSubmit();
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

    startTimer();
    setIsExecuting(true);
    setExecutionType('run');
    setShowOutput(true);
    setOutput(null);

    try {
      const response = await axios.post('/api/judge/run', {
        source_code: code,
        language_id: languageOptions[selectedLang].id,
        stdin: customInput
      });

      setOutput(response.data);

      if (response.data.status?.id === 3) {
        showSuccess('Code executed successfully');
      }
    } catch (error) {
      console.error('Error running code:', error);
      const errorData = error.response?.data;
      setOutput(errorData || { stderr: 'An unexpected error occurred' });
      showError('Failed to run code');
    }

    setIsExecuting(false);
  };

  // Handle Submit Solution
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
      // Run against all test cases
      const visibleTestCases = problem.examples || [];
      const hiddenTestCases = (problem.testCases || []).map(tc => ({
        ...tc,
        output: tc.expectedOutput || tc.output // Normalize field name
      }));
      const allTestCases = [...visibleTestCases, ...hiddenTestCases];

      console.log('Test Cases:', {
        visible: visibleTestCases,
        hidden: hiddenTestCases,
        all: allTestCases
      });

      if (allTestCases.length === 0) {
        showError('No test cases available for this problem');
        setIsExecuting(false);
        return;
      }

      // Execute against all test cases using batch submission
      const submissions = allTestCases.map(tc => ({
        source_code: code,
        language_id: languageOptions[selectedLang].id,
        stdin: tc.input,
        expected_output: tc.output
      }));

      // Step 1: Submit batch and get tokens
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
      console.log('Judge0 Tokens:', tokens);

      // Validate tokens
      if (!Array.isArray(tokens)) {
        throw new Error('Invalid response from Judge0 API: Expected array of tokens');
      }

      // Step 2: Get the tokens and fetch results
      const tokenList = tokens.map(t => t.token).join(',');

      // Step 3: Poll for results until all are complete
      let results = [];
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls

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

        // Check if all submissions are complete (status.id not in [1, 2] which are "In Queue" and "Processing")
        const allComplete = results.every(r => r.status && r.status.id !== 1 && r.status.id !== 2);

        if (allComplete) {
          console.log(`Judge0 Results (attempt ${attempts + 1}):`, results);
          break;
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Timeout waiting for Judge0 results');
      }

      // Validate response structure
      if (!Array.isArray(results)) {
        throw new Error('Invalid response from Judge0 API: Expected array of results');
      }

      // Process results with error handling
      const testResults = results.map((result, index) => {
        const isVisible = index < visibleTestCases.length;
        const testCase = allTestCases[index];

        // Handle different response structures
        const statusId = result.status?.id || result.statusId || 0;
        const statusDesc = result.status?.description || result.statusDescription || 'Unknown';

        // Get actual output and expected output
        const actualOutput = (result.stdout || result.output || '').trim();
        const expectedOutput = (testCase.output || '').trim();

        // Check if code executed successfully AND output matches
        const executedSuccessfully = statusId === 3; // Status 3 = Accepted (no runtime errors)
        const outputMatches = actualOutput === expectedOutput;
        const passed = executedSuccessfully && outputMatches;

        return {
          index: index + 1,
          isVisible,
          passed,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: result.stdout || result.output || '',
          status: passed ? 'Accepted' : (executedSuccessfully ? 'Wrong Answer' : statusDesc),
          time: result.time || 0,
          memory: result.memory || 0,
          stderr: result.stderr || result.error || '',
          compile_output: result.compile_output || ''
        };
      });

      const passedCount = testResults.filter(r => r.passed).length;
      const totalCount = testResults.length;
      const allPassed = passedCount === totalCount;

      // Find first failed test case
      const firstFailure = testResults.find(r => !r.passed);

      // Calculate score
      const pointsEarned = allPassed ? problem.points : 0;

      // Store submission in Firebase
      await saveSubmission({
        problemId: problem.questionId,
        code,
        language: selectedLang,
        testResults,
        score: pointsEarned,
        totalTests: totalCount,
        passedTests: passedCount
      });

      setOutput({
        isSubmission: true,
        allPassed,
        passedCount,
        totalCount,
        pointsEarned,
        maxPoints: problem.points,
        testResults: firstFailure ? [firstFailure] : testResults.filter(r => r.isVisible),
        firstFailure
      });

      // Save result for this problem
      if (allPassed) {
        setProblemResults(prev => ({
          ...prev,
          [currentProblemIndex]: {
            problemCode: problem.contestProblemCode,
            problemTitle: problem.title,
            pointsEarned,
            maxPoints: problem.points,
            passedTests: passedCount,
            totalTests: totalCount,
            solved: true
          }
        }));
        showSuccess(`All tests passed! You earned ${pointsEarned} points!`);
      } else {
        showError(`${passedCount}/${totalCount} tests passed. Keep trying!`);
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

  // Save submission to Firebase
  const saveSubmission = async (submissionData) => {
    try {
      await axios.post('/api/student/submit-contest', {
        contestId: problemId,
        ...submissionData,
        submittedAt: new Date().toISOString()
      }, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Error saving submission:', error);
      // Don't show error to user as this is background operation
    }
  };

  // Auto-submit when timer expires
  const handleAutoSubmit = async () => {
    showInfo('Time expired! Auto-submitting your solution...');
    await handleSubmit();
    setTimeout(() => {
      navigate('/student-contests');
    }, 3000);
  };

  // Save final contest results
  const saveFinalResults = async () => {
    try {
      const totalScore = Object.values(problemResults).reduce(
        (sum, result) => sum + (result?.pointsEarned || 0),
        0
      );
      const totalPossible = problems.reduce((sum, prob) => sum + prob.points, 0);
      const solvedCount = Object.keys(problemResults).length;

      await axios.post('/api/student/finish-contest', {
        contestId: problemId,
        totalScore,
        totalPossible,
        solvedProblems: solvedCount,
        totalProblems: problems.length,
        problemResults: Object.entries(problemResults).map(([idx, result]) => ({
          problemId: problems[idx].questionId,
          problemCode: problems[idx].contestProblemCode,
          ...result
        })),
        completedAt: new Date().toISOString()
      }, {
        withCredentials: true
      });

      showSuccess('Contest results saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving final results:', error);
      showError('Failed to save results');
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

    // Run results
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
              <div className={styles.timerCard}>
                <Clock className={styles.timerIcon} />
                <div className={styles.timerInfo}>
                  <span className={styles.timerLabel}>Time Left</span>
                  <span className={styles.timerValue}>{formatTime(timeRemaining)}</span>
                </div>
              </div>
            )}

            <div className={styles.scoreCard}>
              <Trophy className={styles.scoreIcon} />
              <div className={styles.scoreInfo}>
                <span className={styles.scoreLabel}>Total Score</span>
                <span className={styles.scoreValue}>
                  {Object.values(problemResults).reduce((sum, result) => sum + (result?.pointsEarned || 0), 0)} / {problems.reduce((sum, prob) => sum + prob.points, 0)}
                </span>
              </div>
            </div>

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
                  <div className={styles.problemSection}>
                    <h2 className={styles.sectionTitle}>
                      <FileText size={20} />
                      Description
                    </h2>
                    <div className={styles.sectionContent}>
                      <pre className={styles.problemDescription}>{currentProblem.description}</pre>
                    </div>
                  </div>

                  <div className={styles.problemSection}>
                    <h3 className={styles.sectionTitle}>Input / Output Format</h3>
                    <div className={styles.formatGrid}>
                      <div className={styles.formatCard}>
                        <div className={styles.formatLabel}>Input Format</div>
                        <div className={styles.formatText}>
                          {currentProblem.problemDetails?.inputFormat || 'Not specified'}
                        </div>
                      </div>
                      <div className={styles.formatCard}>
                        <div className={styles.formatLabel}>Output Format</div>
                        <div className={styles.formatText}>
                          {currentProblem.problemDetails?.outputFormat || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {currentProblem.problemDetails?.constraints && currentProblem.problemDetails.constraints.length > 0 && (
                    <div className={styles.problemSection}>
                      <h3 className={styles.sectionTitle}>Constraints</h3>
                      <ul className={styles.constraintsList}>
                        {currentProblem.problemDetails.constraints.map((constraint, idx) => (
                          <li key={idx} className={styles.constraintItem}>{constraint}</li>
                        ))}
                      </ul>
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
                    {currentProblem.examples && currentProblem.examples.length > 0 ? (
                      currentProblem.examples.map((example, idx) => (
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
                <div className={styles.totalScoreLabel}>Total Score</div>
                <div className={styles.totalScoreValue}>
                  {Object.values(problemResults).reduce((sum, result) => sum + (result?.pointsEarned || 0), 0)} / {problems.reduce((sum, prob) => sum + prob.points, 0)}
                </div>
                <div className={styles.totalScoreSubtext}>
                  {Object.keys(problemResults).length} of {problems.length} problems solved
                </div>
              </div>

              <div className={styles.problemResultsList}>
                {problems.map((problem, idx) => {
                  const result = problemResults[idx];
                  const isSolved = result?.solved || false;

                  return (
                    <div
                      key={idx}
                      className={`${styles.problemResultCard} ${isSolved ? styles.solved : styles.unsolved}`}
                    >
                      <div className={styles.problemResultHeader}>
                        <div className={styles.problemResultCode}>
                          Problem {problem.contestProblemCode}
                        </div>
                        <div className={`${styles.problemResultStatus} ${isSolved ? styles.solved : styles.unsolved}`}>
                          {isSolved ? '✓ Solved' : '✗ Unsolved'}
                        </div>
                      </div>
                      <div className={styles.problemResultTitle}>
                        {problem.title}
                      </div>
                      <div className={styles.problemResultScore}>
                        <span className={styles.earnedPoints}>{result?.pointsEarned || 0}</span>
                        <span className={styles.maxPoints}>/ {problem.points} points</span>
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

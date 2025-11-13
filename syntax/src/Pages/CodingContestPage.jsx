// /syntax/src/Pages/CodingContestPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
// TODO: Adjust path to your components
import Loader from '../Components/Loader'; 
import CustomAlert from '../Components/CustomAlert'; 
import StudentNavbar from '../Components/StudentNavbar'; // Added Navbar

// --- Language Configuration ---
const languageOptions = {
  python: { id: 71, monaco: 'python', defaultCode: '# Write your code here...\n' },
  java: { id: 62, monaco: 'java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code here...\n    }\n}' },
  c: { id: 50, monaco: 'c', defaultCode: '#include <stdio.h>\n\nint main() {\n    // Write your code here...\n    return 0;\n}' },
  cpp: { id: 54, monaco: 'cpp', defaultCode: '#include <iostream>\n\nint main() {\n    // Write your code here...\n    return 0;\n}' },
  javascript: { id: 63, monaco: 'javascript', defaultCode: '// Write your code here...\n' },
};
const defaultLanguage = 'python';

function CodingContestPage() {
  const { problemId } = useParams(); // This is the CONTEST ID
  // TODO: We need to know WHICH question to show (e.g., '1', '2', etc.)
  // For now, we will hardcode it to show the FIRST question ('1')
  const questionIndex = '1';

  const [contest, setContest] = useState(null); // Full contest object
  const [problem, setProblem] = useState(null); // The specific question (e.g., contest.questions['1'])
  
  const [code, setCode] = useState(languageOptions[defaultLanguage].defaultCode);
  const [selectedLang, setSelectedLang] = useState(defaultLanguage);
  const [languageId, setLanguageId] = useState(languageOptions[defaultLanguage].id);
  
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState(null); 
  
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  // --- 1. Fetch Problem Details on Mount ---
  useEffect(() => {
    const fetchProblem = async () => {
      setIsLoadingProblem(true);
      try {
        // TODO: Ensure this endpoint exists on your backend to fetch a single contest
        const response = await axios.get(`/api/admin/contest/${problemId}`, {
          // TODO: Add your auth token header if this is a protected route
          // headers: { Authorization: `Bearer ${your_token}` }
        });
        
        setContest(response.data); // Save the full contest
        
        // --- Extract the specific question we want to display ---
        const questionData = response.data?.questions?.[questionIndex];
        if (questionData) {
            setProblem(questionData);
            // Set default code based on problem or language
            const defaultSnippet = questionData?.starterCode?.[selectedLang] || languageOptions[selectedLang].defaultCode;
            setCode(defaultSnippet);
        } else {
            throw new Error(`Question ${questionIndex} not found in contest.`);
        }

      } catch (error) {
        console.error('Error fetching problem:', error);
        setAlert({ show: true, message: 'Failed to load problem.', type: 'error' });
      }
      setIsLoadingProblem(false);
    };

    fetchProblem();
  }, [problemId, questionIndex, selectedLang]); // Re-fetch if language changes to update starter code

  // --- 2. Handle Language Change ---
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLang(lang);
    setLanguageId(languageOptions[lang].id);
    // Update code to the default for the new language
    // It will be overwritten by useEffect if starter code exists
    setCode(languageOptions[lang].defaultCode); 
  };

  // --- 3. Handle "Run" Button ---
  const handleRun = async () => {
    setIsExecuting(true);
    setOutput(null);
    setAlert({ show: false });

    try {
      const response = await axios.post('/api/judge/run', 
        {
          source_code: code,
          language_id: languageId,
          stdin: customInput,
        },
        // TODO: Add auth token header
        // { headers: { Authorization: `Bearer ${your_token}` } }
      );
      
      setOutput(response.data); 
    } catch (error) {
      console.error('Error running code:', error);
      setOutput(error.response?.data || { stderr: 'An unknown error occurred.' });
    }
    setIsExecuting(false);
  };

  // --- 4. Handle "Submit" Button ---
  const handleSubmit = async () => {
    setIsExecuting(true);
    setOutput(null);
    setAlert({ show: false });
    
    try {
      const response = await axios.post('/api/judge/submit', 
        {
          source_code: code,
          language_id: languageId,
          problem_id: problemId, // Send the main CONTEST ID
          // TODO: Send questionIndex if your backend supports it
        },
        // TODO: Add auth token header
        // { headers: { Authorization: `Bearer ${your_token}` } }
      );
      
      setOutput(response.data); // Store the final verdict
      setAlert({
        show: true,
        message: response.data.verdict,
        type: response.data.success ? 'success' : 'error',
      });
    } catch (error) {
      console.error('Error submitting code:', error);
      setOutput(error.response?.data || { message: 'An unknown error occurred.' });
      setAlert({ show: true, message: 'Submission failed.', type: 'error' });
    }
    setIsExecuting(false);
  };

  // --- 5. Render Helper for Output ---
  const renderOutput = () => {
    if (!output) return <p>Click "Run" or "Submit" to see the output.</p>;
    
    if (output.verdict) { // Submission verdict
      return (
        <div style={{ color: output.success ? 'green' : 'red' }}>
          <h3>Verdict: {output.verdict}</h3>
          {output.onTestCase && <p>Failed on: {output.onTestCase}</p>}
          {output.message && <pre>{output.message}</pre>}
        </div>
      );
    }
    
    // Custom run output
    return (
      <>
        {output.status?.description && <h3>Status: {output.status.description}</h3>}
        {output.stdout && (
          <>
            <h4>Output:</h4>
            <pre>{output.stdout}</pre>
          </>
        )}
        {output.stderr && (
          <>
            <h4>Error:</h4>
            <pre style={{ color: 'red' }}>{output.stderr}</pre>
          </>
        )}
        {output.compile_output && (
          <>
            <h4>Compile Output:</h4>
            <pre style={{ color: 'orange' }}>{output.compile_output}</pre>
          </>
        )}
        {output.time && <p>Time: {output.time}s</p>}
        {output.memory && <p>Memory: {output.memory} KB</p>}
      </>
    );
  };

  if (isLoadingProblem) {
    return <Loader />;
  }
  
  if (!problem || !contest) {
    return (
      <>
        <StudentNavbar />
        <h2>Problem not found.</h2>
        {alert.show && <CustomAlert type={alert.type} message={alert.message} />}
      </>
    );
  }

  // --- 6. Main Component JSX ---
  return (
    <>
    <StudentNavbar />
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', padding: '16px' }}> {/* Adjusted height for navbar */}
      
      {/* --- Left Column: Problem Details --- */}
      <div style={{ flex: 1, paddingRight: '16px', overflowY: 'auto' }}>
        <h2>{contest.eventTitle}</h2>
        <h3>Problem: {problem.problem}</h3>
        <p>{contest.eventDescription}</p>

        <h4>Input Format</h4>
        <p>{problem.problemDetails?.inputFormat}</p>

        <h4>Output Format</h4>
        <p>{problem.problemDetails?.outputFormat}</p>
        
        <hr />

        <h3>Visible Test Cases</h3>
        {problem.visibleTestCases?.map((tc, index) => (
          <div key={index} style={{ marginBottom: '10px', background: '#f4f4f4', padding: '8px', borderRadius: '4px' }}>
            <strong>Input:</strong>
            <pre>{tc.input}</pre>
            <strong>Expected Output:</strong>
            <pre>{tc.output}</pre>
          </div>
        ))}
      </div>

      {/* --- Right Column: Code Editor & Output --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '16px' }}>
        
        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="language">Language: </label>
          <select id="language" value={selectedLang} onChange={handleLanguageChange}>
            {Object.keys(languageOptions).map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div style={{ height: '50vh', border: '1px solid #ccc' }}>
          <Editor
            height="100%"
            language={languageOptions[selectedLang].monaco}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
          />
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <h4>Custom Input:</h4>
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            style={{ width: '100%', height: '80px', fontFamily: 'monospace', background: '#f4f4f4', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ margin: '16px 0' }}>
          <button onClick={handleRun} disabled={isExecuting} style={{ marginRight: '8px', padding: '10px', cursor: 'pointer' }}>
            {isExecuting ? 'Running...' : 'Run Code'}
          </button>
          <button onClick={handleSubmit} disabled={isExecuting} style={{ background: 'green', color: 'white', padding: '10px', cursor: 'pointer', border: 'none' }}>
            {isExecuting ? 'Submitting...' : 'Submit Solution'}
          </button>
        </div>
        
        {alert.show && <CustomAlert type={alert.type} message={alert.message} />}

        <div style={{ flex: 1, background: '#1e1e1e', color: 'white', padding: '16px', overflowY: 'auto', borderRadius: '4px' }}>
          <h3>Output:</h3>
          {isExecuting ? <Loader /> : renderOutput()}
        </div>
      </div>
    </div>
    </>
  );
}

export default CodingContestPage;
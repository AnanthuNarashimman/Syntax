import React, { useState, useRef } from 'react';
import { Play, Copy, Download, Terminal, RefreshCw } from 'lucide-react';
import Editor from '@monaco-editor/react';
import styles from '../Styles/PageStyles/StudentCodeground.module.css';
import StudentNavbar from '../Components/StudentNavbar';

const StudentCodeground = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef(null);
  const MAX_POLL_ATTEMPTS = 30; // 30 attempts * 2 seconds = 60 seconds max

  // Monaco Editor language mapping
  const languageMap = {
    python: 'python',
    java: 'java',
    cpp: 'cpp'
  };

  // Monaco Editor options
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    theme: 'vs-dark',
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: false,
    renderLineHighlight: 'line',
    bracketMatching: 'always',
    autoIndent: 'full',
    formatOnPaste: true,
    formatOnType: true
  };

  // Default code templates for different languages
  const codeTemplates = {
    python: `# Python Playground - Welcome to Syntax Codeground!\n\nprint("Hello, World!")\nprint("Ready to code? Let's get started!")\n\n# ---- Your amazing code goes here! ----\n\ndef main():\n    # TITLE: Write your Python code here...\n    name = input("Enter your name: ")\n    print(f"Hello, {name}! Welcome to Python programming!")\n\n    # TITLE: Your amazing code goes here...\n    num1 = float(input("Enter first number: "))\n    num2 = float(input("Enter second number: "))\n    result = num1 + num2\n    print(f"Sum: {result}")\n\nif __name__ == "__main__":\n    main()\n`,
    java: `// Java Playground - Welcome to Syntax Codeground!\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        System.out.println("Ready to code? Let's get started!");\n\n        // Write your Java code here\n        Scanner scanner = new Scanner(System.in);\n\n        System.out.print("Enter your name: ");\n        String name = scanner.nextLine();\n        System.out.println("Hello, " + name + "! Welcome to Java programming!");\n\n        // Example: Simple calculator\n        System.out.print("Enter first number: ");\n        double num1 = scanner.nextDouble();\n        System.out.print("Enter second number: ");\n        double num2 = scanner.nextDouble();\n        double result = num1 + num2;\n        System.out.println("Sum: " + result);\n\n        scanner.close();\n    }\n}`,
    cpp: `// C++ Playground - Welcome to Syntax Codeground!\n#include <iostream>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    cout << "Ready to code? Let's get started!" << endl;\n\n    // Write your C++ code here\n    string name;\n    cout << "Enter your name: ";\n    getline(cin, name);\n    cout << "Hello, " << name << "! Welcome to C++ programming!" << endl;\n\n    // Example: Simple calculator\n    double num1, num2;\n    cout << "Enter first number: ";\n    cin >> num1;\n    cout << "Enter second number: ";\n    cin >> num2;\n    double result = num1 + num2;\n    cout << "Sum: " << result << endl;\n\n    return 0;\n}`
  };

  // Language configurations for Monaco Editor
  const languageConfigs = {
    python: { language: 'python', extension: '.py' },
    java: { language: 'java', extension: '.java' },
    cpp: { language: 'cpp', extension: '.cpp' }
  };

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    setCode(codeTemplates[newLanguage]);
    setOutput('');
    setInput('');
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setOutput('❌ Error: Please write some code before running.');
      return;
    }
    setIsRunning(true);
    setOutput('⏳ Submitting code to Judge0...');

    const JUDGE0_API_URL = 'http://10.14.99.65:2358';
    const languageIdMap = {
      python: 71,
      java: 62,
      cpp: 54
    };
    
    const languageId = languageIdMap[selectedLanguage];

    try {
      const submissionData = {
        source_code: code,
        language_id: languageId,
        stdin: input || '',
      };

      const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const { token } = await response.json();
      setOutput('⏳ Code submitted! Waiting for execution...');
      checkStatus(token, 0);

    } catch (error) {
      console.error("Submission error:", error);
      setOutput(`❌ Error submitting code:\n${error.message}\n\n💡 Make sure Judge0 is running at:\nhttp://10.14.99.65:2358`);
      setIsRunning(false);
    }
  };

  const checkStatus = async (token, attempt) => {
    if (attempt >= MAX_POLL_ATTEMPTS) {
      setOutput('⏱️ Timeout: Execution took too long. The process may be stuck or waiting for input.');
      setIsRunning(false);
      return;
    }

    const JUDGE0_API_URL = 'http://10.14.99.65:2358';
    try {
      const response = await fetch(
        `${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,status,compile_output,message,time,memory`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get submission status: ${response.statusText}`);
      }

      const result = await response.json();
      const statusId = result.status.id;
      const statusDescription = result.status.description;

      // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=Time Limit Exceeded
      // 6=Compilation Error, 7-12=Runtime Errors, 13=Internal Error, 14=Exec Format Error
      
      if (statusId === 1 || statusId === 2) {
        // Still processing
        setOutput(`⏳ ${statusDescription}... (attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS})`);
        setTimeout(() => checkStatus(token, attempt + 1), 2000);
      } else {
        setIsRunning(false);
        
        let finalOutput = '';
        
        // Handle compilation errors
        if (statusId === 6 && result.compile_output) {
          finalOutput = `❌ Compilation Error:\n\n${result.compile_output}`;
        }
        // Handle runtime errors
        else if (statusId >= 7 && statusId <= 12) {
          finalOutput = `❌ Runtime Error (${statusDescription}):\n\n`;
          finalOutput += result.stderr || result.message || 'Unknown runtime error';
        }
        // Handle other errors
        else if (statusId === 13 || statusId === 14) {
          finalOutput = `❌ Error (${statusDescription}):\n\n${result.message || 'Internal error occurred'}`;
        }
        // Success or other statuses
        else {
          if (result.stdout) {
            finalOutput = `✅ Output:\n\n${result.stdout}`;
          } else if (result.stderr) {
            finalOutput = `⚠️ Error Output:\n\n${result.stderr}`;
          } else if (result.message) {
            finalOutput = `ℹ️ ${statusDescription}:\n\n${result.message}`;
          } else {
            finalOutput = `✅ Execution completed successfully!\nStatus: ${statusDescription}`;
          }
          
          // Add execution stats
          if (result.time || result.memory) {
            finalOutput += `\n\n📊 Execution Stats:`;
            if (result.time) finalOutput += `\n⏱️  Time: ${result.time}s`;
            if (result.memory) finalOutput += `\n💾 Memory: ${result.memory} KB`;
          }
        }
        
        setOutput(finalOutput);
      }
    } catch (error) {
      console.error("Status check error:", error);
      setOutput(`❌ Error retrieving result:\n${error.message}\n\n💡 Make sure Judge0 is running at http://10.14.99.65:2358`);
      setIsRunning(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setOutput('Code copied to clipboard!');
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `code${languageConfigs[selectedLanguage].extension}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setOutput('Code downloaded successfully!');
  };

  // Initialize with Python template
  React.useEffect(() => {
    setCode(codeTemplates.python);
  }, []);


  return (
    <div className={styles.studentCodeground}>
      <StudentNavbar />
      <div className={styles.codegroundContainer}>
        {/* Main Editor Section */}
        <div className={styles.editorSection}>
          <div className={styles.editorCard}>
            {/* Toolbar */}
            <div className={styles.editorToolbar}>
              <div className={styles.toolbarLeft}>
                <div className={`${styles.languageBadge} ${styles[selectedLanguage]}`}>
                  <span>{selectedLanguage.toUpperCase()}</span>
                </div>
                <div className={styles.fileInfo}>
                  <span>main{selectedLanguage === 'python' ? '.py' : selectedLanguage === 'java' ? '.java' : '.cpp'}</span>
                </div>
              </div>
              <div className={styles.toolbarRight}>
                <div className={styles.languageSelector}>
                  <label htmlFor="language">Language:</label>
                  <select id="language" value={selectedLanguage} onChange={handleLanguageChange} className={styles.languageDropdown}>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <button onClick={handleCopyCode} className={styles.actionBtn} title="Copy Code">
                  <Copy size={16} /> Copy
                </button>
                <button onClick={handleDownloadCode} className={styles.actionBtn} title="Download Code">
                  <Download size={16} /> Download
                </button>
                <button onClick={handleRunCode} disabled={isRunning} className={`${styles.runBtn} ${isRunning ? styles.running : ''}`} title="Run Code">
                  {isRunning ? <RefreshCw size={16} className={styles.spinning} /> : <Play size={16} />}
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className={styles.editorBody}>
              <div className={styles.editorWrapper}>
                <Editor
                  height="100%"
                  language={languageMap[selectedLanguage]}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={editorOptions}
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    // Set initial focus
                    editor.focus();
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Output Console */}
        <div className={styles.outputSection}>
          {/* Input Section */}
          <div className={styles.inputSection}>
            <div className={styles.inputHeader}>
              <label htmlFor="stdin" className={styles.inputLabel}>
                📥 Standard Input (stdin)
              </label>
              <span className={styles.inputHint}>
                Enter input for programs that read from stdin (e.g., input(), Scanner, cin)
              </span>
            </div>
            <textarea
              id="stdin"
              className={styles.inputTextarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter program input here (one value per line)&#10;Example:&#10;John&#10;25&#10;5.5"
              rows="4"
            />
          </div>

          <div className={styles.outputHeader}>
            <div className={styles.outputTitle}>
              <Terminal size={20} />
              <h3>Console Output</h3>
            </div>
            <div className={styles.outputActions}>
              <button onClick={() => setOutput('')} className={styles.clearBtn} title="Clear Output">
                <RefreshCw size={14} /> Clear
              </button>
            </div>
          </div>
          <div className={styles.outputPanel}>
            <pre className={styles.outputText}>{output}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCodeground;

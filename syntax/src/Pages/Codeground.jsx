import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import Loader from '../Components/Loader';
import CustomAlert from '../Components/CustomAlert';
import StudentNavbar from '../Components/StudentNavbar';
import { Copy, Download, Play, TerminalSquare, XCircle } from 'lucide-react';
import styles from '../Styles/PageStyles/Codeground.module.css';

// --- Language Configuration ---
const languageOptions = {
  python: { 
    id: 71, 
    monaco: 'python', 
    defaultCode: `print("PYTHON Playground - welcome to Syntax Codeground!")
print("Ready to code? let's get started!")

# --- Your amazing code goes here ---
def main():
    name = input("Enter your name: ")
    print(f"Hello, {name}! Welcome to Python programming!")
    num1 = float(input("Enter first number: "))
    num2 = float(input("Enter second number: "))
    result = num1 + num2
    print(f"Sum: {result}")

if __name__ == "__main__":
    main()` 
  },
  java: { 
    id: 62, 
    monaco: 'java', 
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("JAVA Playground - welcome to Syntax Codeground!");
        System.out.println("Ready to code? let's get started!");
        // --- Your amazing code goes here ---
        java.util.Scanner scanner = new java.util.Scanner(System.in);
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        System.out.println("Hello, " + name + "! Welcome to Java programming!");
        System.out.print("Enter first number: ");
        double num1 = scanner.nextDouble();
        System.out.print("Enter second number: ");
        double num2 = scanner.nextDouble();
        double result = num1 + num2;
        System.out.println("Sum: " + result);
        scanner.close();
    }
}` 
  },
  c: { 
    id: 50, 
    monaco: 'c', 
    defaultCode: `#include <stdio.h>\n
int main() {
    printf("C Playground - welcome to Syntax Codeground!\\n");
    printf("Ready to code? let's get started!\\n");
    // --- Your amazing code goes here ---
    char name[100];
    int num1, num2;
    printf("Enter your name: ");
    scanf("%s", name);
    printf("Hello, %s! Welcome to C programming!\\n", name);
    printf("Enter first number: ");
    scanf("%d", &num1);
    printf("Enter second number: ");
    scanf("%d", &num2);
    printf("Sum: %d\\n", num1 + num2);
    return 0;
}` 
  },
  cpp: { 
    id: 54, 
    monaco: 'cpp', 
    defaultCode: `#include <iostream>\n
int main() {
    std::cout << "C++ Playground - welcome to Syntax Codeground!" << std::endl;
    std::cout << "Ready to code? let's get started!" << std::endl;
    // --- Your amazing code goes here ---
    std::string name;
    int num1, num2;
    std::cout << "Enter your name: ";
    std::cin >> name;
    std::cout << "Hello, " << name << "! Welcome to C++ programming!" << std::endl;
    std::cout << "Enter first number: ";
    std::cin >> num1;
    std::cout << "Enter second number: ";
    std::cin >> num2;
    std::cout << "Sum: " << num1 + num2 << std::endl;
    return 0;
}` 
  },
  javascript: { 
    id: 63, 
    monaco: 'javascript', 
    defaultCode: `console.log("JAVASCRIPT Playground - welcome to Syntax Codeground!");
console.log("Ready to code? let's get started!");

// --- Your amazing code goes here ---
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Enter your name: ', name => {
  console.log(\`Hello, \${name}! Welcome to JavaScript programming!\`);
  readline.question('Enter first number: ', num1Str => {
    readline.question('Enter second number: ', num2Str => {
      const num1 = parseFloat(num1Str);
      const num2 = parseFloat(num2Str);
      const sum = num1 + num2;
      console.log(\`Sum: \${sum}\`);
      readline.close();
    });
  });
});
` 
  },
};
const defaultLanguage = 'python';

function Codeground() {
  const [code, setCode] = useState(languageOptions[defaultLanguage].defaultCode);
  const [selectedLang, setSelectedLang] = useState(defaultLanguage);
  const [languageId, setLanguageId] = useState(languageOptions[defaultLanguage].id);
  
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState(null); 
  const [isExecuting, setIsExecuting] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const editorRef = useRef(null);

  // Set initial code based on default language
  useEffect(() => {
    setCode(languageOptions[selectedLang].defaultCode);
  }, [selectedLang]);

  // Handle language change
  const handleLanguageChange = useCallback((e) => {
    const lang = e.target.value;
    setSelectedLang(lang);
    setLanguageId(languageOptions[lang].id);
  }, []);

  // Handle "Run" Button
  const handleRun = useCallback(async () => {
    if (!code.trim()) {
      setAlert({ show: true, message: 'Please write some code first!', type: 'error' });
      return;
    }

    setIsExecuting(true);
    setOutput(null);
    setAlert({ show: false });

    try {
      const response = await axios.post(
        '/api/judge/run',
        {
          source_code: code,
          language_id: languageId,
          stdin: customInput,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success === false) {
        setOutput({ stderr: response.data.message });
        setAlert({ show: true, message: 'Code execution failed.', type: 'error' });
      } else {
        setOutput(response.data);
        if (response.data.stderr || response.data.compile_output) {
          setAlert({ show: true, message: 'Code executed with errors.', type: 'warning' });
        } else if (response.data.stdout) {
          setAlert({ show: true, message: 'Code executed successfully!', type: 'success' });
        }
      }
    } catch (error) {
      console.error('Error running code:', error);

      const errorMessage = error.response?.data?.message || error.response?.data?.stderr || 'An unknown error occurred.';
      setOutput({ stderr: errorMessage });
      setAlert({ show: true, message: 'Code execution failed.', type: 'error' });
    } finally {
      setIsExecuting(false);
    }
  }, [code, languageId, customInput]);
  // Render Helper for Output
  const renderOutput = useCallback(() => {
    if (isExecuting) {
      return (
        <div className={styles['loader-container']}>
          <Loader />
          <p style={{ marginTop: '10px', color: '#aaa' }}>Executing your code...</p>
        </div>
      );
    }

    if (!output) {
      return (
        <div className={styles['empty-output']}>
          <TerminalSquare size={48} color="#555" />
          <p>Console output will appear here...</p>
          <small>Run your code to see the results</small>
        </div>
      );
    }

    // Check if it's an error from the backend
    if (output.message && output.error) {
      return (
        <div className={styles['error-output']}>
          <h4> Error: {output.message}</h4>
          <pre>{JSON.stringify(output.error, null, 2)}</pre>
        </div>
      );
    }

    // Judge0 output structure
    return (
      <div className={styles['result-output']}>
        {output.stdout && (
          <div className={styles['output-section']}>
            <h4 className={styles['output-success']}> Output:</h4>
            <pre>{output.stdout}</pre>
          </div>
        )}
        {output.stderr && (
          <div className={styles['output-section']}>
            <h4 className={styles['output-error']}> Runtime Error:</h4>
            <pre>{output.stderr}</pre>
          </div>
        )}
        {output.compile_output && (
          <div className={styles['output-section']}>
            <h4 className={styles['output-warning']}>  Compile Error:</h4>
            <pre>{output.compile_output}</pre>
          </div>
        )}
      </div>
    );
  }, [isExecuting, output]);

  // Copy code to clipboard
  const handleCopyCode = useCallback(() => {
    if (!code) {
      setAlert({ show: true, message: 'No code to copy!', type: 'error' });
      return;
    }

    navigator.clipboard.writeText(code)
      .then(() => {
        setAlert({ show: true, message: 'Code copied to clipboard!', type: 'success' });
        setTimeout(() => setAlert({ show: false }), 2000);
      })
      .catch(() => {
        setAlert({ show: true, message: 'Failed to copy code!', type: 'error' });
      });
  }, [code]);

  // Download code file
  const handleDownloadCode = useCallback(() => {
    if (!code) {
      setAlert({ show: true, message: 'No code to download!', type: 'error' });
      return;
    }

    const fileExtensions = {
      python: 'py',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      javascript: 'js'
    };

    const extension = fileExtensions[selectedLang] || selectedLang;
    const filename = `main.${extension}`;
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);

    setAlert({ show: true, message: `Downloaded ${filename}`, type: 'success' });
    setTimeout(() => setAlert({ show: false }), 2000);
  }, [code, selectedLang]);
  return (
    <>
      <StudentNavbar />
      <div className={styles['codeground-page']}>
        {alert.show && <CustomAlert type={alert.type} message={alert.message} />}
        <div className={styles['main-content']}>
          {/* --- Left Panel: Code Editor --- */}
          <div className={styles['editor-panel']}>
            <div className={styles['panel-header']}>
              <div className={styles['panel-header-left']}>
                <TerminalSquare size={18} />
                <span className={styles['file-tab']}>{selectedLang.toUpperCase()} main.{selectedLang}</span>
              </div>
              <div className={styles['panel-header-right']}>
                <label htmlFor="language-select">Language:</label>
                <select 
                  id="language-select" 
                  value={selectedLang} 
                  onChange={handleLanguageChange}
                  className={styles['lang-selector']}
                >
                  {Object.keys(languageOptions).map(lang => (
                    <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                  ))}
                </select>
                <button className={`${styles['action-button']} ${styles.copy}`} onClick={handleCopyCode}>
                  <Copy size={16} /> Copy
                </button>
                <button className={`${styles['action-button']} ${styles.download}`} onClick={handleDownloadCode}>
                  <Download size={16} /> Download
                </button>
                <button 
                  className={`${styles['action-button']} ${styles.run}`} 
                  onClick={handleRun} 
                  disabled={isExecuting}
                >
                  <Play size={16} /> {isExecuting ? 'Running...' : 'Run Code'}
                </button>
              </div>
            </div>
            <div className={styles['editor-wrapper']}>
              <Editor
                height="100%"
                language={languageOptions[selectedLang].monaco}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  folding: true,
                  bracketPairColorization: {
                    enabled: true
                  },
                  suggest: {
                    enabled: true
                  },
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: false
                  }
                }}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.focus();
                }}
              />
            </div>
          </div>

          {/* --- Right Panel: Console Output --- */}
          <div className={styles['output-panel']}>
            <div className={styles['output-panel-header']}>
              <div className={styles['panel-header-left']}>
                <TerminalSquare size={18} />
                <span>Console Output</span>
              </div>
              <button className={styles['output-clear-btn']} onClick={() => setOutput(null)}>
                <XCircle size={14} /> Clear
              </button>
            </div>
            <div className={styles['console-output']}>
              {renderOutput()}
            </div>
          </div>
        </div>

        {/* --- Custom Input Section (Below Main Content) --- */}
        <div className={styles['custom-input-section']}>
            <h3>Custom Input:</h3>
            <textarea
                className={styles['custom-input-textarea']}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter any custom input for your code here (e.g., multiple lines, numbers)..."
            />
        </div>
      </div>
    </>
  );
}

export default Codeground;
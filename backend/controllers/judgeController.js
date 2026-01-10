// /backend/controllers/judgeController.js
const axios = require('axios');
const { db } = require('../config/firebase');

// Helper function to format the axios request to Judge0
const createJudge0Request = (data, isBatch = false) => {
  const endpoint = isBatch ? '/submissions/batch' : '/submissions';

  return {
    method: 'POST',
    url: `https://${process.env.JUDGE0_RAPIDAPI_HOST}${endpoint}`,
    params: {
      base64_encoded: 'false',
      wait: 'true', // Wait for the execution to complete
    },
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.JUDGE0_RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.JUDGE0_RAPIDAPI_HOST,
    },
    data: data,
  };
};

// Helper function to handle Judge0 API errors
const handleJudge0Error = (error) => {
  console.error('Judge0 API Error:', error.response?.data || error.message);

  const statusCode = error.response?.status || 500;
  const errorMessage = error.response?.data?.message || 'Code execution failed';

  return {
    statusCode,
    message: errorMessage,
    details: error.response?.data || error.message,
  };
};


// Runs the code
// 1) Gets the code, language id and the custom inputs from the request
// 2) Creates a submission object with the data
// 3) Creates a judge0 request with the object and executes it
// 4) Returns the output to the client
// 5) In case of errors or exceptions, appropriate logs are made
const handleRunCode = async (req, res) => {
  const { source_code, language_id, stdin } = req.body;

  // Validate required fields
  if (!source_code || !language_id) {
    return res.status(400).json({
      success: false,
      message: 'Source code and language ID are required.'
    });
  }

  const submissionData = {
    source_code: source_code.trim(),
    language_id: parseInt(language_id),
    stdin: stdin || '',
  };

  try {
    const requestOptions = createJudge0Request(submissionData, false);
    const response = await axios.request(requestOptions);

    // Return formatted response
    return res.status(200).json({
      success: true,
      ...response.data
    });
  } catch (error) {
    const errorInfo = handleJudge0Error(error);
    return res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
      stderr: errorInfo.details
    });
  }
};


// Submit Code for Contest Evaluation (Tests Against All Test Cases Using Judge0 API)
// 1) Extracts submission details from request: source_code, language_id, problem_id, and optional question_number (defaults to '1')
// 2) Validates that all required fields (source_code, language_id, problem_id) are present
// 3) Fetches the problem document from 'contestProblems' collection in Firebase using problem_id
// 4) Validates that the problem exists, returns 404 error if not found
// 5) Extracts question data for the specific question_number from the problem document
// 6) Validates that question data exists, returns 404 if question not found in contest
// 7) Combines visible and hidden test cases into a single array for comprehensive testing
// 8) Validates that at least one test case exists, returns 400 error if no test cases found
// 9) Prepares batch submission payload for Judge0 API:
//    - Maps each test case to a submission object with source_code, language_id, stdin (input), and expected_output
//    - Creates array of submission objects for batch processing
// 10) Sends batch request to Judge0 API using createJudge0Request helper with batch mode enabled
// 11) Receives execution results for all test cases from Judge0 API
// 12) Processes results sequentially to find first failure:
//     - Checks each result's status.id (status 3 = "Accepted")
//     - If any test case fails (status.id !== 3), immediately returns failure verdict with:
//       * Test case name (Visible/Hidden Test Case number)
//       * Status description (Wrong Answer, Time Limit Exceeded, etc.)
//       * Execution time and memory usage
//     - Short-circuits on first failure (doesn't check remaining test cases)
// 13) If all test cases pass (status.id === 3 for all), returns success verdict with:
//     - verdict: "Accepted"
//     - Total test cases passed count
//     - Congratulatory message
// 14) In case of Judge0 API errors, network errors, or exceptions, uses handleJudge0Error helper to format and return error response
// Note: This function does NOT save results to database - it only evaluates code and returns verdict
// The frontend must call submitContest (studentController) separately to record the submission
const handleSubmitCode = async (req, res) => {
  const { source_code, language_id, problem_id, question_number = '1' } = req.body;

  // Validate required fields
  if (!source_code || !language_id || !problem_id) {
    return res.status(400).json({
      success: false,
      message: 'Source code, language ID, and problem ID are required.'
    });
  }

  try {
    // Step 1: Fetch the problem and its test cases from Firebase
    const problemRef = db.collection('contestProblems').doc(problem_id);
    const problemDoc = await problemRef.get();

    if (!problemDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found.'
      });
    }

    const problem = problemDoc.data();
    const questionData = problem.questions?.[question_number];

    if (!questionData) {
      return res.status(404).json({
        success: false,
        message: 'Question data not found in contest.'
      });
    }

    const { visibleTestCases = [], hiddenTestCases = [] } = questionData;
    const allTestCases = [...visibleTestCases, ...hiddenTestCases];

    if (allTestCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This problem has no test cases.'
      });
    }

    // Step 2: Prepare the batch submission payload for Judge0
    const submissions = allTestCases.map(testCase => ({
      source_code: source_code.trim(),
      language_id: parseInt(language_id),
      stdin: testCase.input,
      expected_output: testCase.output,
    }));

    // Step 3: Send the batch submission to Judge0
    const requestOptions = createJudge0Request({ submissions }, true);
    const response = await axios.request(requestOptions);
    const results = response.data;

    // Step 4: Process the results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const statusId = result.status.id;

      // status.id 3 = "Accepted"
      if (statusId !== 3) {
        const testCaseNum = i + 1;
        const isHidden = i >= visibleTestCases.length;
        const testCaseName = isHidden
          ? `Hidden Test Case ${testCaseNum - visibleTestCases.length}`
          : `Visible Test Case ${testCaseNum}`;

        return res.status(200).json({
          success: false,
          verdict: result.status.description,
          onTestCase: testCaseName,
          time: result.time,
          memory: result.memory
        });
      }
    }

    // Step 5: All test cases passed
    return res.status(200).json({
      success: true,
      verdict: 'Accepted',
      message: `Congratulations! Passed all ${allTestCases.length} test cases.`,
      totalTestCases: allTestCases.length
    });

  } catch (error) {
    const errorInfo = handleJudge0Error(error);
    return res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
      error: errorInfo.details
    });
  }
};

module.exports = {
  handleRunCode,
  handleSubmitCode,
};
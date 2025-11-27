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

/**
 * @desc    Run code against custom input
 * @route   POST /api/judge/run
 */
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

/**
 * @desc    Submit code for grading against all test cases
 * @route   POST /api/judge/submit
 */
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
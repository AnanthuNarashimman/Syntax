const { db, admin } = require("../config/firebase");

// Function for creating quizzes

// 1) Gets necessary informations from the route '/api/admin/create-contest'.
// 2) Checks if the number of questions macthes the value in "numberOfQuestions".
// 3) Checks if each question has four options and correct answer.
// 4) Logs an acknowledgement message of what quiz it is going to create.
// 5) An "eventData" dictionary is created with appropriate values.
// 6) The "eventData" is added to the collection "events".
// 7) The id of the created event it's entire data is passed back.
async function handleQuizCreation(req, res, data) {
  try {
    const {
      contestTitle,
      contestDescription,
      duration,
      numberOfQuestions,
      pointsPerProgram,
      questions,
      contestType,
      contestMode,
      topicsCovered,
      allowedDepartments,
    } = data;

    // Validate quiz questions structure
    if (!Array.isArray(questions) || questions.length !== numberOfQuestions) {
      return res.status(400).json({
        message:
          "Quiz questions must be an array with length matching numberOfQuestions.",
      });
    }

    // Validate each quiz question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (
        !question.question ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        !question.correctAnswer
      ) {
        return res.status(400).json({
          message: `Question ${
            i + 1
          } is incomplete. Each question must have a question text, 4 options, and a correct answer.`,
        });
      }

      // Validate that correct answer exists in options
      if (!question.options.includes(question.correctAnswer)) {
        return res.status(400).json({
          message: `Question ${
            i + 1
          }: Correct answer must be one of the provided options.`,
        });
      }
    }

    console.log("Creating quiz with data:", {
      contestTitle,
      contestDescription,
      contestType,
      contestMode,
      numberOfQuestions,
      pointsPerProgram,
    });

    const eventData = {
      eventTitle: contestTitle,
      eventDescription: contestDescription,
      durationMinutes: parseInt(duration),
      numberOfQuestions: numberOfQuestions,
      pointsPerQuestion: parseInt(pointsPerProgram),
      totalScore: numberOfQuestions * parseInt(pointsPerProgram),
      questions: questions.map((q, index) => ({
        questionId: `q_${contestTitle.replace(/\s/g, "_").toLowerCase()}_${
          index + 1
        }_${Date.now()}`,
        questionNumber: index + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })),

      // Meta data for the event
      status: "queue", // Initial status is queue
      participants: [],
      submissions: [],
      organizer: "Syntax",
      rules: "Answer all questions correctly",
      bannerImageUrl: "",
      leaderboardEnabled: true,
      eventType: contestType, // "quiz" or "contest"
      eventMode: contestMode, // "strict" or "practice"
      topicsCovered: topicsCovered,
      allowedDepartments: allowedDepartments || "Any department",

      createdBy: req.user.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const eventRef = await db.collection("events").add(eventData);

    res.status(201).json({
      message: "Event created successfully!",
      eventId: eventRef.id,
      event: {
        id: eventRef.id,
        ...eventData,
      },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      message: "Failed to create event. Please check server logs.",
      error: error.message,
    });
  }
}


// Function for creating coding contests

// 1) Gets necessary informations from the route '/api/admin/create-contest'.
// 2) Checks if the number of questions macthes the value in "numberOfQuestions".
// 3) Creates an empty array "problems".
// 4) Destructures the "questions" from the frontend as "questionData" and checks each question has necessary details such as input and output formats, test cases and more
// 5) After verifying each question it constructs a dictionary "problemData" from the question.
// 6) Pushes the "problemData" to the array "problems".
// 7) This prcoess is done for each question.
// 8) A dictionary "eventData" is created with necessary information including the "problems" array.
// 9) The eventData is added to the firebase db in collection named "events".
async function handleCodingContestCreation(req, res, data) {
  try {
    const {
      contestTitle,
      contestDescription,
      duration,
      numberOfQuestions,
      pointsPerProgram,
      questions,
      selectedLanguage,
      contestType,
      contestMode,
      topicsCovered,
      allowedDepartments,
    } = data;

    // Validate coding contest questions structure
    if (Object.keys(questions).length !== numberOfQuestions) {
      return res.status(400).json({
        message:
          "Number of questions provided does not match the configured count.",
      });
    }

    console.log("Sample question data:", questions[1]);

    const problems = [];
    for (let i = 1; i <= numberOfQuestions; i++) {
      const questionData = questions[i];

      if (
        !questionData ||
        !questionData.problem ||
        !questionData.example ||
        !Array.isArray(questionData.testCases) ||
        questionData.testCases.length === 0
      ) {
        return res.status(400).json({
          message: `Problem ${i} is incomplete. Missing problem statement, example, or test cases.`,
        });
      }

      if (!questionData.example.input || !questionData.example.output) {
        return res.status(400).json({
          message: `Problem ${i} example is incomplete (missing input or output).`,
        });
      }

      // Validate input/output formats
      if (
        !questionData.problemDetails ||
        !questionData.problemDetails.inputFormat ||
        !questionData.problemDetails.outputFormat
      ) {
        return res.status(400).json({
          message: `Problem ${i} is missing input or output format specifications.`,
        });
      }

      // Validate starter code
      if (
        !questionData.starterCode ||
        !questionData.starterCode.python ||
        !questionData.starterCode.java
      ) {
        return res.status(400).json({
          message: `Problem ${i} is missing starter code for Python or Java.`,
        });
      }

      for (let j = 0; j < questionData.testCases.length; j++) {
        const tc = questionData.testCases[j];
        if (!tc.input || !tc.output) {
          return res.status(400).json({
            message: `Problem ${i}, Test Case ${
              j + 1
            } is incomplete (missing input or output).`,
          });
        }
      }

      const problemObject = {
        contestProblemCode: String.fromCharCode(64 + i), // A, B, C, ...
        points: parseInt(pointsPerProgram),
        questionId: `cp_${contestTitle
          .replace(/\s/g, "_")
          .toLowerCase()}_${i}_${Date.now()}`,

        title: `Problem ${String.fromCharCode(64 + i)}: ${questionData.problem
          .split("\n")[0]
          .substring(0, 50)}...`,
        description: questionData.problem,
        difficulty: "Undefined",
        topicsCovered: topicsCovered,
        estimatedTimeMinutes: 20,
        languagesSupported:
          selectedLanguage === "both" ? ["python", "java"] : [selectedLanguage],

        problemDetails: {
          inputFormat: questionData.problemDetails.inputFormat,
          outputFormat: questionData.problemDetails.outputFormat,
          constraints: [],
          hint: "",
        },
        starterCode: {
          python: questionData.starterCode.python,
          java: questionData.starterCode.java,
          javascript: "",
          cpp: "",
        },

        examples: [
          {
            input: questionData.example.input,
            output: questionData.example.output,
            explanation: "",
          },
        ],

        testCases: questionData.testCases.map((tc, idx) => ({
          testCaseId: `tc_${i}_${idx}`,
          input: tc.input,
          expectedOutput: tc.output,
          isHidden: true,
          description: `Test Case ${idx + 1} for Problem ${String.fromCharCode(
            64 + i
          )}`,
        })),

        timeLimitMs: 1000,
        memoryLimitMb: 256,
      };

      console.log(`Problem ${i} created:`, {
        inputFormat: problemObject.problemDetails.inputFormat,
        outputFormat: problemObject.problemDetails.outputFormat,
        pythonStarterCode:
          problemObject.starterCode.python.substring(0, 50) + "...",
        javaStarterCode:
          problemObject.starterCode.java.substring(0, 50) + "...",
      });

      problems.push(problemObject);
    }

    const eventData = {
      eventTitle: contestTitle,
      eventDescription: contestDescription,
      durationMinutes: parseInt(duration),
      numberOfPrograms: numberOfQuestions,
      pointsPerProgram: parseInt(pointsPerProgram),
      problems: problems,

      // Meta data for the event
      status: "queue", // Initial status is queue
      participants: [],
      submissions: [],
      organizer: "Syntax",
      rules: "Code on your own",
      bannerImageUrl: "",
      leaderboardEnabled: true,
      eventType: contestType, // "quiz" or "contest"
      eventMode: contestMode, // "strict" or "practice"
      topicsCovered: topicsCovered,
      allowedDepartments: allowedDepartments || "Any department", // Added department field

      createdBy: req.user.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const eventRef = await db.collection("events").add(eventData);

    res.status(201).json({
      message: "Event created successfully!",
      eventId: eventRef.id,
      event: {
        id: eventRef.id,
        ...eventData,
      },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      message: "Failed to create event. Please check server logs.",
      error: error.message,
    });
  }
}



module.exports = {
  handleQuizCreation,
  handleCodingContestCreation,
};
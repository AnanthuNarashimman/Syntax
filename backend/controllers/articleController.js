const { db, admin } = require("../config/firebase");

// Article Creation
// 1) Gets required data from the request
// 2) Creates a document with the data and user id
// 3) Pushes it to the firebase
// 4) In case of errors or exceptions appropriate logs will be made
const createArticle = async (req, res) => {
    try {
        const {
            title,
            description,
            topicsCovered,
            allowedDepartments,
            articleContent,
            articleLink,
        } = req.body;
        if (!title || !description || !topicsCovered || !allowedDepartments) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        if (!articleContent && !articleLink) {
            return res.status(400).json({
                message: "Either article content or article link must be provided.",
            });
        }
        if (articleContent && typeof articleContent !== "string") {
            return res
                .status(400)
                .json({ message: "Article content must be a string." });
        }
        if (articleLink && typeof articleLink !== "string") {
            return res
                .status(400)
                .json({ message: "Article link must be a string." });
        }
        const articleData = {
            title,
            description,
            topicsCovered,
            allowedDepartments,
            articleContent: articleContent || null,
            articleLink: articleLink || null,
            uploader: req.user.userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection("articles").add(articleData);
        res
            .status(201)
            .json({ message: "Article created successfully!", articleId: docRef.id });
    } catch (error) {
        console.error("Error creating article:", error);
        res
            .status(500)
            .json({ message: "Failed to create article.", error: error.message });
    }
}

// Get articles specific to admin
// 1) Gets user id from request
// 2) Fetches articles whose 'createdBy' matches with the user id
// 3) Sorts articles based on upload time
// 4) Sends it back to the client
// 5) In case of errors or exceptions appropriate logs are made
const getAdminArticles = async(req, res) => {
    try {
    // Get current admin's userId from the authenticated request
    const userId = req.user.userId;

    // Fetch only articles created by the current admin
    const snapshot = await db
      .collection("articles")
      .where("uploader", "==", userId)
      .get();

    const articles = [];
    snapshot.forEach((doc) => {
      articles.push({ id: doc.id, ...doc.data() });
    });

    // Sort articles by createdAt in descending order (newest first)
    articles.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt?._seconds * 1000) || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt?._seconds * 1000) || new Date(0);
      return bTime - aTime;
    });

    res.status(200).json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch articles.", error: error.message });
  }
}

// Gets articles for students
// 1) Gets articles from firebase where the user department is in allowed departments
// 2) Sorts it based on upload time and sends it back to the user
// 3) In case of errors or exceptions, appropriate logs are made
const getStudentArticles = async(req, res) => {
    try {
        const articlesSnapshot = await db.collection('articles')
            .where('allowedDepartments', 'in', [req.user.department, 'Any department'])
            .get();

        const articles = []

        articlesSnapshot.forEach(doc => {
            articles.push({
                id: doc.id,
                ...doc.data()
            });
        }); 

        
        articles.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt?._seconds * 1000) || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt?._seconds * 1000) || new Date(0);
            return bTime - aTime;
        });

        res.status(200).json({
            message: 'Articles retrieved successfully!',
            articles
        });

    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({
            message: 'Failed to fetch articles. Please try again.',
            error: error.message
        });
    }
}

// Delete article
// 1) Gets article ID from request parameters
// 2) Verifies the article exists and was created by the current user (admin)
// 3) Deletes the article from Firebase
// 4) In case of errors or exceptions, appropriate logs are made
const deleteArticle = async (req, res) => {
    try {
        const articleId = req.params.id;
        const userId = req.user.userId;

        console.log('Delete request received for article ID:', articleId);
        console.log('Requesting user ID:', userId);

        if (!articleId) {
            return res.status(400).json({ message: "Article ID is required." });
        }

        // Check if article exists
        const articleRef = db.collection("articles").doc(articleId);
        const articleDoc = await articleRef.get();

        if (!articleDoc.exists) {
            console.log('Article not found:', articleId);
            return res.status(404).json({ message: "Article not found." });
        }

        const articleData = articleDoc.data();
        console.log('Article found, uploader:', articleData.uploader);

        // Verify the current user is the uploader
        if (articleData.uploader !== userId) {
            console.log('Unauthorized delete attempt by user:', userId);
            return res.status(403).json({ 
                message: "You are not authorized to delete this article." 
            });
        }

        // Delete the article
        await articleRef.delete();
        console.log('Article deleted successfully:', articleId);

        res.status(200).json({ 
            message: "Article deleted successfully!",
            articleId: articleId
        });
    } catch (error) {
        console.error("Error deleting article:", error);
        res.status(500).json({ 
            message: "Failed to delete article.", 
            error: error.message 
        });
    }
}

module.exports = {
    createArticle,
    getAdminArticles,
    getStudentArticles,
    deleteArticle
}
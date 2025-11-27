const { db, admin } = require("../config/firebase");

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

const getAdminArticles = async(req, res) => {
    try {
    const snapshot = await db
      .collection("articles")
      .orderBy("createdAt", "desc")
      .get();
    const articles = [];
    snapshot.forEach((doc) => {
      articles.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch articles.", error: error.message });
  }
}


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
        }); // ✅ Close the forEach loop here

        // ✅ Sort and respond OUTSIDE the loop
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

module.exports = {
    createArticle,
    getAdminArticles,
    getStudentArticles
}
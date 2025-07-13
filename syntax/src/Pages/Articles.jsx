import { useEffect, useState, Fragment } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import { BookOpen, X } from 'lucide-react';
import '../Styles/PageStyles/Articles.css'; // Import the new CSS file
import { marked } from 'marked';

function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line
  }, []);

  async function fetchArticles() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/articles', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to fetch articles.');
        setArticles([]);
      } else {
        setArticles(data.articles || []);
      }
    } catch (err) {
      setError('Failed to fetch articles.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }

  function openModal(title, content) {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalContent('');
    setModalTitle('');
  }

  return (
    <div className="Article_Dashboard">
      <AdminNavbar />
      <div className="Article_MainContent">
        <header className="Article_DashboardHeader">
          <div className="Article_HeaderContent">
            <h1>Articles</h1>
            <p>Browse uploaded and linked articles</p>
          </div>
        </header>
        <div className="Article_ContentGrid">
          <div className="Article_Card Article_FullWidth">
            <div className="Article_CardHeader">
              <h2>All Articles</h2>
            </div>
            <div className="Article_List">
              {loading ? (
                <p className="Article_LoadingText">Loading articles...</p>
              ) : error ? (
                <p className="Article_ErrorText">{error}</p>
              ) : articles.length === 0 ? (
                <p className="Article_LoadingText">No articles found.</p>
              ) : (
                articles.map((article, idx) => (
                  <Fragment key={article.id || idx}>
                    <div className="Article_Card_Row">
                      <div className="Article_Info">
                        <h4>{article.title}</h4>
                        <p>{article.description}</p>
                        <p><strong>Topics:</strong> {article.topicsCovered}</p>
                        <p><strong>Allowed Departments:</strong> {article.allowedDepartments}</p>
                      </div>
                      <div className="Article_Actions">
                        {article.articleLink ? (
                          <a 
                            href={article.articleLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="Article_BtnSecondary"
                          >
                            View Article
                          </a>
                        ) : article.articleContent ? (
                          <button 
                            className="Article_BtnSecondary" 
                            onClick={() => openModal(article.title, article.articleContent)}
                          >
                            View
                          </button>
                        ) : (
                          <span className="Article_NoContentText">No content</span>
                        )}
                      </div>
                    </div>
                    {idx < articles.length - 1 && <hr className="Article_Divider" />}
                  </Fragment>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal for viewing article content */}
      {modalOpen && (
        <div className="Article_ModalOverlay" onClick={closeModal}>
          <div className="Article_ModalContent" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeModal}
              className="Article_ModalCloseBtn"
              aria-label="Close"
            >
              <X size={28} />
            </button>
            <h2 className="Article_ModalTitle">{modalTitle}</h2>
            <div 
              className="Article_ModalArticleContent"
              dangerouslySetInnerHTML={{ __html: marked.parse(modalContent) }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Articles;
import { useEffect, useState } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import { BookOpen, X, ExternalLink, FileText, Tag, Users } from 'lucide-react';
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
            <div className="Article_HeaderIcon">
              <BookOpen size={32} />
            </div>
            <div className="Article_HeaderText">
              <h1>Articles & Resources</h1>
              <p>Explore our curated collection of programming articles and learning resources</p>
            </div>
          </div>
        </header>
        <div className="Article_ContentGrid">
          {loading ? (
            <div className="Article_LoadingContainer">
              <div className="Article_LoadingSpinner"></div>
              <p className="Article_LoadingText">Loading articles...</p>
            </div>
          ) : error ? (
            <div className="Article_ErrorContainer">
              <p className="Article_ErrorText">{error}</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="Article_EmptyContainer">
              <BookOpen size={48} />
              <p className="Article_EmptyText">No articles found.</p>
              <p className="Article_EmptySubtext">Check back later for new content!</p>
            </div>
          ) : (
            <div className="Article_CardsGrid">
              {articles.map((article, idx) => (
                <div key={article.id || idx} className="Article_Card Article_IndividualCard">
                  <div className="Article_CardContent">
                    <div className="Article_CardHeader">
                      <h3 className="Article_CardTitle">{article.title}</h3>
                      <div className="Article_CardType">
                        {article.articleLink ? (
                          <ExternalLink size={16} />
                        ) : (
                          <FileText size={16} />
                        )}
                      </div>
                    </div>
                    
                    <p className="Article_CardDescription">{article.description}</p>
                    
                    <div className="Article_CardMeta">
                      <div className="Article_MetaItem">
                        <Tag size={14} />
                        <span className="Article_MetaLabel">Topics:</span>
                        <span className="Article_MetaValue">{article.topicsCovered}</span>
                      </div>
                      <div className="Article_MetaItem">
                        <Users size={14} />
                        <span className="Article_MetaLabel">Departments:</span>
                        <span className="Article_MetaValue">{article.allowedDepartments}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="Article_CardFooter">
                    {article.articleLink ? (
                      <a 
                        href={article.articleLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="Article_BtnPrimary"
                      >
                        <ExternalLink size={16} />
                        View Article
                      </a>
                    ) : article.articleContent ? (
                      <button 
                        className="Article_BtnPrimary" 
                        onClick={() => openModal(article.title, article.articleContent)}
                      >
                        <FileText size={16} />
                        Read Article
                      </button>
                    ) : (
                      <span className="Article_NoContent">
                        <FileText size={16} />
                        No content available
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
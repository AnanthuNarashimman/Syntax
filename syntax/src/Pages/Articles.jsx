import { useEffect, useState, Fragment } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import { BookOpen, X } from 'lucide-react';
import '../Styles/PageStyles/AdminDashboard.css';
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
    <div className="admin-dashboard">
      <AdminNavbar />
      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Articles</h1>
            <p>Browse uploaded and linked articles</p>
          </div>
        </header>
        <div className="content-grid">
          <div className="card full-width">
            <div className="card-header">
              <h2>All Articles</h2>
            </div>
            <div className="contest-list">
              {loading ? (
                <p>Loading articles...</p>
              ) : error ? (
                <p style={{ color: 'red' }}>{error}</p>
              ) : articles.length === 0 ? (
                <p>No articles found.</p>
              ) : (
                articles.map((article, idx) => (
                  <Fragment key={article.id || idx}>
                    <div className="article-card-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', padding: '2rem 0' }}>
                      <div className="article-info" style={{ flex: 1 }}>
                        <h4 style={{ margin: 0 }}>{article.title}</h4>
                        <p style={{ margin: '0.5rem 0 0 0' }}>{article.description}</p>
                        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600 }}>Topics: <span style={{ fontWeight: 400 }}>{article.topicsCovered}</span></p>
                        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600 }}>Allowed Departments: <span style={{ fontWeight: 400 }}>{article.allowedDepartments}</span></p>
                      </div>
                      <div className="article-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', minWidth: '180px' }}>
                        {article.articleLink ? (
                          <a href={article.articleLink} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ width: '140px', textAlign: 'center' }}>View Article</a>
                        ) : article.articleContent ? (
                          <button className="btn-secondary" style={{ width: '140px' }} onClick={() => openModal(article.title, article.articleContent)}>
                            View
                          </button>
                        ) : (
                          <span>No content</span>
                        )}
                      </div>
                    </div>
                    {idx < articles.length - 1 && <hr className="article-divider" style={{ width: '100%', margin: '0', border: 'none', borderTop: '1px solid #e2e8f0' }} />}
                  </Fragment>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal for viewing article content */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2.5rem 2.5rem 2rem 2.5rem',
              maxWidth: '900px',
              width: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1.2rem',
                right: '1.2rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                zIndex: 10
              }}
              aria-label="Close"
            >
              <X size={28} />
            </button>
            <h2 style={{ marginTop: 0 }}>{modalTitle}</h2>
            <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '0.5rem', fontSize: '1rem', margin: 0 }}
              dangerouslySetInnerHTML={{ __html: marked.parse(modalContent) }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Articles; 
import { useEffect, useState } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import { BookOpen, X, ExternalLink, FileText, Tag, Users, Trash2 } from 'lucide-react';
import '../Styles/PageStyles/Articles.css'; // Import the new CSS file
import { marked } from 'marked';
import { useAlert } from '../contexts/AlertContext';

function Articles() {
  const { showSuccess, showError } = useAlert();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        const fetchedArticles = data.articles || [];
        console.log('Fetched articles count:', fetchedArticles.length);
        console.log('Sample article IDs:', fetchedArticles.slice(0, 3).map(a => ({ id: a.id, title: a.title })));

        // Verify all articles have IDs
        const articlesWithoutIds = fetchedArticles.filter(a => !a.id);
        if (articlesWithoutIds.length > 0) {
          console.error(`WARNING: ${articlesWithoutIds.length} articles missing IDs:`, articlesWithoutIds);
        }

        setArticles(fetchedArticles);
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

  function openDeleteModal(article) {
    setArticleToDelete(article);
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false);
    setArticleToDelete(null);
  }

  async function handleDeleteArticle() {
    console.log('=== handleDeleteArticle called ===');
    console.log('articleToDelete:', articleToDelete);
    console.log('articleToDelete type:', typeof articleToDelete);
    console.log('articleToDelete.id:', articleToDelete?.id);
    console.log('articleToDelete.id type:', typeof articleToDelete?.id);
    console.log('articleToDelete keys:', Object.keys(articleToDelete || {}));

    if (!articleToDelete || !articleToDelete.id) {
      console.error('ERROR: Invalid article - no ID found');
      showError('Invalid article selected');
      return;
    }

    try {
      setDeleteLoading(true);
      console.log('Deleting article with ID:', articleToDelete.id);
      console.log('Full article object:', JSON.stringify(articleToDelete, null, 2));

      const url = `/api/articles/${articleToDelete.id}`;
      console.log('DELETE request URL:', url);
      console.log('Encoded URL:', encodeURI(url));

      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      console.log('Response content-type:', response.headers.get('content-type'));

      // Read response as text first (only reads stream once)
      const responseText = await response.text();
      console.log('Response text:', responseText.substring(0, 200));

      // Check if response is OK
      if (!response.ok) {
        let errorMessage = 'Failed to delete article';
        try {
          const data = JSON.parse(responseText);
          errorMessage = data.message || errorMessage;
        } catch (e) {
          // Response is not JSON (might be HTML error page)
          console.error('Non-JSON response:', responseText.substring(0, 200));
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Parse the text as JSON for success case
      const data = JSON.parse(responseText);
      showSuccess(data.message || 'Article deleted successfully!');
      closeDeleteModal();
      fetchArticles(); // Refresh the list
    } catch (err) {
      console.error('Error deleting article:', err);
      showError(err.message || 'Failed to delete article');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="Article_Dashboard">
      <AdminNavbar />
      <div className="Article_MainContent">
        <div className="Article_HeaderSection">
          <h1>Articles & Resources</h1>
          <p>Explore our curated collection of programming articles and learning resources</p>
        </div>

        {!loading && !error && (
          <div className="Article_StatsOverview">
            <div className="Article_StatCard">
              <div className="stat-icon-wrapper">
                <BookOpen className="stat-icon" />
              </div>
              <div className="stat-content">
                <h3>Total Articles</h3>
                <span className="stat-number">{articles.length}</span>
              </div>
            </div>
            <div className="Article_StatCard">
              <div className="stat-icon-wrapper">
                <FileText className="stat-icon" />
              </div>
              <div className="stat-content">
                <h3>Internal Content</h3>
                <span className="stat-number">{articles.filter(a => a.articleContent).length}</span>
              </div>
            </div>
            <div className="Article_StatCard">
              <div className="stat-icon-wrapper">
                <ExternalLink className="stat-icon" />
              </div>
              <div className="stat-content">
                <h3>External Links</h3>
                <span className="stat-number">{articles.filter(a => a.articleLink).length}</span>
              </div>
            </div>
          </div>
        )}

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
                    <button
                      className="Article_BtnDelete"
                      onClick={() => openDeleteModal(article)}
                      title="Delete Article"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && articleToDelete && (
        <div className="Article_ModalOverlay" onClick={closeDeleteModal}>
          <div className="Article_ModalContent Article_DeleteModal" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeDeleteModal}
              className="Article_ModalCloseBtn"
              aria-label="Close"
              disabled={deleteLoading}
            >
              <X size={28} />
            </button>
            <h2 className="Article_ModalTitle">Delete Article</h2>

            <div className="Article_DeleteContent">
              <p>Are you sure you want to delete the article <strong>"{articleToDelete.title}"</strong>?</p>
              <p className="Article_WarningText">This action cannot be undone and will permanently remove the article.</p>
            </div>

            <div className="Article_ModalActions">
              <button
                className="Article_BtnSecondary"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="Article_BtnDanger"
                onClick={handleDeleteArticle}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Articles;
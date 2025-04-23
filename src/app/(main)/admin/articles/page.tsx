// app/(main)/admin/articles/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, remove, update, push, set } from 'firebase/database';
import { database } from '../../../lib/firebase/config';
import { Article } from '../../../lib/utils/types';
import Image from 'next/image';

export default function ArticleManagement() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentArticle, setCurrentArticle] = useState<Article>({
    id: '',
    title: '',
    description: '',
    author: '',
    link: '',
    pubDate: new Date().toISOString(),
    image: '',
    source: '',
    guid: '',
    categories: [],
    createdAt: new Date().toISOString()
  });
  const [filterText, setFilterText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // For pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Collect unique categories and sources for filters
  const allCategories = [...new Set(articles.flatMap(article => article.categories || []))];
  const allSources = [...new Set(articles.map(article => article.source))];

  useEffect(() => {
    const articlesRef = ref(database, 'articles');
    
    const unsubscribe = onValue(articlesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const articlesArray = Object.keys(data).map(key => {
          const articleData = data[key];
          return {
          ...articleData,
          id: key,
          };
        });
        
        // Sort by publication date (newest first)
        articlesArray.sort((a, b) => {
          return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        });
        
        setArticles(articlesArray);
      } else {
        setArticles([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddArticle = () => {
    setModalMode('add');
    setCurrentArticle({
      id: '',
      title: '',
      description: '',
      author: '',
      link: '',
      pubDate: new Date().toISOString(),
      image: '',
      source: '',
      guid: '',
      categories: [],
      createdAt: new Date().toISOString()
    });
    setShowModal(true);
  };

  const handleEditArticle = (article: Article) => {
    setModalMode('edit');
    setCurrentArticle(article);
    setShowModal(true);
  };

  const handleDeleteArticle = async (id: string) => {

    if (!id) {
      console.error('Cannot delete article: Missing ID');
      alert('Cannot delete article: Missing ID');
      return;
    }

    console.log('attempting to delete article with ID:', id)

    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        const articleRef = ref(database, `articles/${id}`);
        await remove(articleRef);
      } catch (error) {
        console.error('Error deleting article:', error);
        alert('Failed to delete article.');
      }
    }
  };

  const handleDeleteAllArticles = async () => {
    // Double confirmation to prevent accidental deletion
    if (window.confirm('WARNING: Are you sure you want to delete ALL articles? This action cannot be undone.')) {
      if (window.confirm('FINAL WARNING: This will permanently delete ALL articles from the database. Continue?')) {
        try {
          setLoading(true);
          const articlesRef = ref(database, 'articles');
          await remove(articlesRef);
          alert('All articles have been deleted successfully.');
        } catch (error) {
          console.error('Error deleting all articles:', error);
          alert('Failed to delete all articles: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'categories') {
      // Handle categories as comma-separated values
      setCurrentArticle(prev => ({
        ...prev,
        categories: value.split(',').map(cat => cat.trim()).filter(cat => cat !== '')
      }));
    } else {
      setCurrentArticle(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'add') {

        const { ...articleWithoutId } = currentArticle;
        // Generate a new ID
        const newGuid = `manual-${Date.now()}`;
        const newArticleData = {
          ...articleWithoutId,
          guid: newGuid,
          createdAt: new Date().toISOString(),
        };
        
        // Add new article
        const newArticleRef = push(ref(database, 'articles'));
        await set(newArticleRef, newArticleData);
      } else {
        // Update existing article
        const { id, ...articleDataWithoutId } = currentArticle;

        if(!id) {
          console.error('Cannot update article: Missing ID');
          alert('failed to update : missing id');
          return;
        }
        const articleRef = ref(database, `articles/${id}`);
        await update(articleRef, articleDataWithoutId);
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article.');
    }
  };

  // Filter articles based on search text, category, and source
  const filteredArticles = articles.filter(article => {
    const searchTextMatch = filterText === '' || 
      article.title.toLowerCase().includes(filterText.toLowerCase()) ||
      article.description.toLowerCase().includes(filterText.toLowerCase()) ||
      (article.author?.toLowerCase() || '').includes(filterText.toLowerCase());
    
    const categoryMatch = categoryFilter === '' || 
      (article.categories && article.categories.includes(categoryFilter));
    
    const sourceMatch = sourceFilter === '' || article.source === sourceFilter;
    
    return searchTextMatch && categoryMatch && sourceMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const currentItems = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Article Management</h1>
        <div className='flex space-x-3'>
          <button
            onClick={handleAddArticle}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Add New Article
          </button>
          <button
            onClick={handleDeleteAllArticles}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
          >
            Delete All Articles
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search articles..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Categories</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Sources</option>
              {allSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <label className="text-sm text-gray-600 mr-2">Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
              className="border border-gray-300 rounded p-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredArticles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredArticles.length)} of {filteredArticles.length} articles
          </div>
        </div>
      </div>
      
      {currentItems.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500">No articles found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {currentItems.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4 p-4">
                  <div className="relative h-48 w-full">
                    {article.image ? (
                      <Image 
                        src={article.image} 
                        alt={article.title}
                        fill
                        className="object-cover rounded"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded">
                        <p className="text-gray-500">No image</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:w-3/4 p-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {article.source}
                    </span>
                    {article.categories && article.categories.map((category, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <h2 className="text-xl font-bold mb-2">{article.title}</h2>
                  <p className="text-gray-600 mb-4">{article.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        {article.author && `By ${article.author} • `}
                        {new Date(article.pubDate).toLocaleDateString()}
                      </p>
                      <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Original
                      </a>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditArticle(article)}
                        className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => article.id && handleDeleteArticle(article.id)}
                        className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border bg-white text-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show a window of 5 pages around the current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded border ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border bg-white text-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
      
      {/* Add/Edit Article Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl my-8">
            <h2 className="text-2xl font-bold mb-4">
              {modalMode === 'add' ? 'Add New Article' : 'Edit Article'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={currentArticle.title}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={currentArticle.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="author">
                    Author
                  </label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={currentArticle.author}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="source">
                    Source
                  </label>
                  <input
                    type="text"
                    id="source"
                    name="source"
                    value={currentArticle.source}
                    onChange={handleInputChange}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="link">
                  Link
                </label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  value={currentArticle.link}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                  Image URL
                </label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={currentArticle.image}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pubDate">
                  Publication Date
                </label>
                <input
                  type="datetime-local"
                  id="pubDate"
                  name="pubDate"
                  value={currentArticle.pubDate.slice(0, 16)} // Format to YYYY-MM-DDThh:mm
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categories">
                  Categories (comma separated)
                </label>
                <input
                  type="text"
                  id="categories"
                  name="categories"
                  value={currentArticle.categories?.join(', ') || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Tech, Business, AI"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {modalMode === 'add' ? 'Add Article' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
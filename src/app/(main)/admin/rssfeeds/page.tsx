// app/(main)/admin/rssfeeds/page.tsx
'use client';

import { useEffect, useState } from 'react';
// import {useAuth} from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ref, onValue, remove, update, push, set } from 'firebase/database';
import { database, auth } from '../../../lib/firebase/config';
import { RSSFeed } from '../../../lib/utils/types';
import Link from 'next/link';

export default function RSSFeedsManagement() {
  const [rssFeeds, setRssFeeds] = useState<RSSFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentFeed, setCurrentFeed] = useState<RSSFeed>({
    name: '',
    url: '',
    language: 'fr',
    isGeneric: false, // Valeur par défaut pour le nouveau champ
  });
  const [filterText, setFilterText] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const router = useRouter();
  // const { user, isAdmin } = useAuth();

  useEffect(() => {
    const feedsRef = ref(database, 'rssFeeds');
    
    const unsubscribe = onValue(feedsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const feedsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        setRssFeeds(feedsArray);
      } else {
        setRssFeeds([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddFeed = () => {
    setModalMode('add');
    setCurrentFeed({
      name: '',
      url: '',
      language: 'fr',
      isGeneric: false, // Par défaut, les nouveaux flux ne sont pas génériques
    });
    setShowModal(true);
  };

  const handleEditFeed = (feed: RSSFeed) => {
    setModalMode('edit');
    setCurrentFeed({
      ...feed,
      isGeneric: feed.isGeneric ?? false, // Pour les flux existants qui n'ont pas encore ce champ
    });
    setShowModal(true);
  };

  const handleDeleteFeed = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this RSS feed?')) {
      try {
        const feedRef = ref(database, `rssFeeds/${id}`);
        await remove(feedRef);
      } catch (error) {
        console.error('Error deleting feed:', error);
        alert('Failed to delete RSS feed.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentFeed(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCurrentFeed(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'add') {
        // Add new feed
        const newFeedRef = push(ref(database, 'rssFeeds'));
        await set(newFeedRef, {
          ...currentFeed,
          createdAt: new Date().toISOString()
        });
      } else {
        // Update existing feed
        const feedRef = ref(database, `rssFeeds/${currentFeed.id}`);
        await update(feedRef, currentFeed);
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving feed:', error);
      alert('Failed to save RSS feed.');
    }
  };

  const handleUpdateArticles = async () => {
    try {
      setUpdating(true);
      setUpdateMessage('Updating articles from RSS feeds...');
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('you must be logged in to update articles');
      }

      const response = await fetch('/api/update-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Handle potential non-JSON responses
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Failed to parse response");
      }
      
      if (response.ok) {
        let message = result.message || `Articles updated successfully!`;
        
        // Ajouter des détails sur le traitement des flux génériques si disponibles
        if (result.genericStats) {
          message += ` (${result.genericStats.included} generic articles included, ${result.genericStats.skipped} skipped)`;
        }
        
        setUpdateMessage(message);
        // Refresh the page data to show new articles
        router.refresh();
      } else {
        setUpdateMessage(result.message || 'Failed to update articles. Please try again.');
        console.error('Error response:', result);
      }
    } catch (error) {
      console.error('Error updating articles:', error);
      setUpdateMessage(`Error: ${(error as { message?: string }).message || 'Unknown error occurred'}`);
    } finally {
      // Clear message after 5 seconds
      setTimeout(() => {
        setUpdateMessage('');
      }, 5000);
      
      setUpdating(false);
    }
  };
  
  const filteredFeeds = rssFeeds.filter(feed => {
    const searchText = filterText.toLowerCase();
    return (
      feed.name.toLowerCase().includes(searchText) ||
      feed.url.toLowerCase().includes(searchText) ||
      (feed.language && feed.language.toLowerCase().includes(searchText))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">RSS Feeds Management</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/generickeywords" className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg">
            Gérer Mots-clés Génériques
          </Link>
          <button
            onClick={handleUpdateArticles}
            disabled={updating}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Update Articles from Feeds'}
          </button>
          <button
            onClick={handleAddFeed}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Add New Feed
          </button>
        </div>
      </div>
      
      {updateMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          updateMessage.includes('successfully') 
            ? 'bg-green-100 text-green-800' 
            : updateMessage.includes('Failed') 
              ? 'bg-red-100 text-red-800' 
              : 'bg-blue-100 text-blue-800'
        }`}>
          {updateMessage}
        </div>
      )}
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search feeds..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Generic
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFeeds.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No RSS feeds found.
                </td>
              </tr>
            ) : (
              filteredFeeds.map((feed) => (
                <tr key={feed.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{feed.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-xs">{feed.url}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        feed.language === 'fr' ? 'bg-blue-100 text-blue-800' : 
                        feed.language === 'en' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                        }`}>
                        {feed.language === 'fr' ? 'French' : 
                         feed.language === 'en' ? 'English' : 
                         feed.language || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      feed.isGeneric ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {feed.isGeneric ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feed.createdAt ? new Date(feed.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditFeed(feed)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFeed(feed.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add/Edit Feed Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {modalMode === 'add' ? 'Add New RSS Feed' : 'Edit RSS Feed'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={currentFeed.name}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="url">
                  URL
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={currentFeed.url}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="language">
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={currentFeed.language}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isGeneric"
                    checked={currentFeed.isGeneric || false}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Flux RSS Générique
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Cochez cette case si les articles de ce flux doivent d&apos;abord être filtrés par mots-clés avant d&apos;être catégorisés
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )};
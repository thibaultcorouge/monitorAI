// app/(main)/admin/generickeywords/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, remove, push, set } from 'firebase/database';
import { database } from '../../../lib/firebase/config';
import Link from 'next/link';

interface GenericKeyword {
  id?: string;
  value: string;
  createdAt?: string;
}

export default function GenericKeywordsManagement() {
  const [keywords, setKeywords] = useState<GenericKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [filterText, setFilterText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const keywordsRef = ref(database, 'genericKeywords');
    
    try {
      const unsubscribe = onValue(keywordsRef, (snapshot) => {
        // Toujours définir loading à false, que la requête réussisse ou non
        const data = snapshot.val() || {};
        const keywordsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        setKeywords(keywordsArray);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching keywords:", error);
        setKeywords([]);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up keywords listener:", error);
      setKeywords([]);
      setLoading(false);
    }
  }, []);
  
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKeyword.trim()) {
      setStatusMessage('Le mot-clé ne peut pas être vide');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    
    // Check for duplicates
    if (keywords.some(k => k.value.toLowerCase() === newKeyword.toLowerCase())) {
      setStatusMessage('Ce mot-clé existe déjà');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    
    try {
      const newKeywordRef = push(ref(database, 'genericKeywords'));
      await set(newKeywordRef, {
        value: newKeyword,
        createdAt: new Date().toISOString()
      });
      
      setNewKeyword('');
      setStatusMessage('Mot-clé ajouté avec succès');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Error adding keyword:', error);
      setStatusMessage('Erreur lors de l\'ajout du mot-clé');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce mot-clé?')) {
      try {
        const keywordRef = ref(database, `genericKeywords/${id}`);
        await remove(keywordRef);
        setStatusMessage('Mot-clé supprimé avec succès');
        setTimeout(() => setStatusMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting keyword:', error);
        setStatusMessage('Erreur lors de la suppression du mot-clé');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      
      let addedCount = 0;
      let duplicateCount = 0;
      
      for (const line of lines) {
        const keyword = line.trim();
        if (!keyword) continue;
        
        // Check for duplicates both within database and the new keywords
        if (keywords.some(k => k.value.toLowerCase() === keyword.toLowerCase())) {
          duplicateCount++;
          continue;
        }
        
        const newKeywordRef = push(ref(database, 'genericKeywords'));
        await set(newKeywordRef, {
          value: keyword,
          createdAt: new Date().toISOString()
        });
        addedCount++;
      }
      
      setStatusMessage(`Import terminé: ${addedCount} mots-clés ajoutés, ${duplicateCount} doublons ignorés`);
      setTimeout(() => setStatusMessage(''), 5000);
      
      // Clear the file input
      e.target.value = '';
    } catch (error) {
      console.error('Error importing keywords:', error);
      setStatusMessage('Erreur lors de l\'import des mots-clés');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleExport = () => {
    // Create a text content with one keyword per line
    const content = keywords.map(k => k.value).join('\n');
    
    // Create a blob and download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generic-keywords.txt';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const filteredKeywords = keywords.filter(keyword => 
    keyword.value.toLowerCase().includes(filterText.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Gestion des mots-clés génériques</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/rssfeeds" className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
            Retour aux flux RSS
          </Link>
          <label className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg cursor-pointer">
            Importer
            <input 
              type="file" 
              accept=".txt" 
              className="hidden" 
              onChange={handleBulkImport} 
            />
          </label>
          <button
            onClick={handleExport}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Exporter
          </button>
        </div>
      </div>
      
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          statusMessage.includes('succès') 
            ? 'bg-green-100 text-green-800' 
            : statusMessage.includes('Erreur') 
              ? 'bg-red-100 text-red-800' 
              : 'bg-blue-100 text-blue-800'
        }`}>
          {statusMessage}
        </div>
      )}
      
      <div className="mb-6">
        <form onSubmit={handleAddKeyword} className="flex gap-2">
          <input
            type="text"
            placeholder="Nouveau mot-clé..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-lg"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Ajouter
          </button>
        </form>
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher des mots-clés..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <p className="text-gray-700">
            Ces mots-clés seront utilisés pour filtrer les articles provenant des flux RSS marqués comme &quot;génériques&quot;.
            <br />Seuls les articles contenant au moins un de ces mots-clés seront importés.
          </p>
        </div>
        
        {filteredKeywords.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun mot-clé trouvé. Ajoutez des mots-clés pour commencer à filtrer les flux RSS génériques.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredKeywords.map((keyword) => (
              <li key={keyword.id} className="flex justify-between items-center p-4 hover:bg-gray-50">
                <span className="text-gray-700">{keyword.value}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteKeyword(keyword.id!)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
};
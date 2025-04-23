// app/(main)/admin/categorykeywords/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, remove, push, set, update } from 'firebase/database';
import { database } from '../../../lib/firebase/config';
import Link from 'next/link';

interface CategoryKeyword {
  id?: string;
  category: string;
  keywords: string[];
}

export default function CategoryKeywordsManagement() {
  const [categories, setCategories] = useState<CategoryKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    const categoriesRef = ref(database, 'categoryKeywords');
    
    try {
      const unsubscribe = onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val() || {};
        const categoriesArray = Object.keys(data).map(key => ({
          id: key,
          category: data[key].category || '',
          keywords: data[key].keywords || [] // Ensure keywords is always an array
        }));
        
        setCategories(categoriesArray);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching category keywords:", error);
        setCategories([]);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up category keywords listener:", error);
      setCategories([]);
      setLoading(false);
    }
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      setStatusMessage('La catégorie ne peut pas être vide');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    
    // Check for duplicates
    if (categories.some(c => c.category.toLowerCase() === newCategory.toLowerCase())) {
      setStatusMessage('Cette catégorie existe déjà');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    
    try {
      const newCategoryRef = push(ref(database, 'categoryKeywords'));
      await set(newCategoryRef, {
        category: newCategory,
        keywords: [] // Initialize with an empty array
      });
      
      setNewCategory('');
      setStatusMessage('Catégorie ajoutée avec succès');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Error adding category:', error);
      setStatusMessage('Erreur lors de l\'ajout de la catégorie');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie et tous ses mots-clés?')) {
      try {
        const categoryRef = ref(database, `categoryKeywords/${id}`);
        await remove(categoryRef);
        setStatusMessage('Catégorie supprimée avec succès');
        setTimeout(() => setStatusMessage(''), 3000);
        
        // Reset selected category if it was the one deleted
        if (selectedCategory === id) {
          setSelectedCategory(null);
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        setStatusMessage('Erreur lors de la suppression de la catégorie');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      setStatusMessage('Veuillez sélectionner une catégorie');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    
    if (!newKeyword.trim()) {
      setStatusMessage('Le mot-clé ne peut pas être vide');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    
    // Get the current category
    const currentCategory = categories.find(c => c.id === selectedCategory);
    if (!currentCategory) return;
    
    // Initialize keywords array if it doesn't exist
    const currentKeywords = currentCategory.keywords || [];
    
    // Check for duplicates
    if (currentKeywords.some(k => k.toLowerCase() === newKeyword.toLowerCase())) {
      setStatusMessage('Ce mot-clé existe déjà dans cette catégorie');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    
    try {
      // Add the new keyword to the array
      const updatedKeywords = [...currentKeywords, newKeyword];
      
      // Update the category with the new keywords array
      const categoryRef = ref(database, `categoryKeywords/${selectedCategory}`);
      await update(categoryRef, {
        keywords: updatedKeywords
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

  const handleDeleteKeyword = async (categoryId: string, keywordToDelete: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce mot-clé?')) {
      try {
        // Get the current category
        const currentCategory = categories.find(c => c.id === categoryId);
        if (!currentCategory) return;
        
        // Make sure keywords is not undefined
        const currentKeywords = currentCategory.keywords || [];
        
        // Filter out the keyword to delete
        const updatedKeywords = currentKeywords.filter(keyword => keyword !== keywordToDelete);
        
        // Update the category with the filtered keywords array
        const categoryRef = ref(database, `categoryKeywords/${categoryId}`);
        await update(categoryRef, {
          keywords: updatedKeywords
        });
        
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
    if (!file || !selectedCategory) return;
    
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      
      // Get the current category
      const currentCategory = categories.find(c => c.id === selectedCategory);
      if (!currentCategory) return;
      
      // Make sure keywords is not undefined
      const currentKeywords = currentCategory.keywords || [];
      
      // Get current keywords for duplicate checking
      const existingKeywords = new Set(currentKeywords.map(k => k.toLowerCase()));
      
      let addedCount = 0;
      let duplicateCount = 0;
      const newKeywords = [...currentKeywords];
      
      for (const line of lines) {
        const keyword = line.trim();
        if (!keyword) continue;
        
        // Check for duplicates
        if (existingKeywords.has(keyword.toLowerCase())) {
          duplicateCount++;
          continue;
        }
        
        newKeywords.push(keyword);
        existingKeywords.add(keyword.toLowerCase());
        addedCount++;
      }
      
      // Update the category with the new keywords array if anything was added
      if (addedCount > 0) {
        const categoryRef = ref(database, `categoryKeywords/${selectedCategory}`);
        await update(categoryRef, {
          keywords: newKeywords
        });
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

  const handleExport = (categoryId: string) => {
    // Find the category
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    // Make sure keywords is not undefined
    const keywords = category.keywords || [];
    
    // Create a text content with one keyword per line
    const content = keywords.join('\n');
    
    // Create a blob and download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.category.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-keywords.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const handleExportAll = () => {
    // Create a JSON representation of all categories and their keywords
    const content = JSON.stringify(categories, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-category-keywords.json';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

//   const filteredCategories = categories.filter(category => 
//     category.category.toLowerCase().includes(filterText.toLowerCase()) ||
//     (selectedCategory === category.id && (category.keywords || []).some(keyword => 
//       keyword.toLowerCase().includes(filterText.toLowerCase())
//     ))
//   );

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
        <h1 className="text-3xl font-bold">Gestion des mots-clés par catégorie</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin" className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
            Retour au tableau de bord
          </Link>
          {selectedCategory && (
            <>
              <label className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg cursor-pointer">
                Importer des mots-clés
                <input 
                  type="file" 
                  accept=".txt" 
                  className="hidden" 
                  onChange={handleBulkImport} 
                />
              </label>
              <button
                onClick={() => handleExport(selectedCategory)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
              >
                Exporter cette catégorie
              </button>
            </>
          )}
          <button
            onClick={handleExportAll}
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg"
          >
            Exporter toutes les catégories
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
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: Categories management */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Catégories</h2>
            </div>
            
            <div className="p-4">
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Nouvelle catégorie..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-grow p-2 border border-gray-300 rounded-lg"
                />
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                >
                  Ajouter
                </button>
              </form>
              
              {categories.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucune catégorie trouvée. Ajoutez des catégories pour commencer.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {categories.map((category) => (
                    <li 
                      key={category.id} 
                      className={`flex justify-between items-center p-4 hover:bg-gray-50 cursor-pointer ${
                        selectedCategory === category.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => category.id && setSelectedCategory(category.id)}
                    >
                      <div>
                        <span className="text-gray-700 font-medium">{category.category}</span>
                        <span className="ml-2 text-gray-500 text-sm">
                          ({(category.keywords || []).length} mots-clés)
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id!);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column: Keywords management */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {selectedCategory 
                  ? `Mots-clés pour "${categories.find(c => c.id === selectedCategory)?.category}"` 
                  : 'Sélectionnez une catégorie pour gérer ses mots-clés'}
              </h2>
            </div>
            
            {selectedCategory ? (
              <div className="p-4">
                <form onSubmit={handleAddKeyword} className="flex gap-2 mb-4">
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
                
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Rechercher des mots-clés..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                {/* Keywords list */}
                {selectedCategory && (
                  <div>
                    {(categories.find(c => c.id === selectedCategory)?.keywords || []).length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Aucun mot-clé trouvé. Ajoutez des mots-clés pour cette catégorie.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                        {(categories
                          .find(c => c.id === selectedCategory)
                          ?.keywords || [])
                          .filter(keyword => keyword.toLowerCase().includes(filterText.toLowerCase()))
                          .map((keyword, index) => (
                            <li key={index} className="flex justify-between items-center p-4 hover:bg-gray-50">
                              <span className="text-gray-700">{keyword}</span>
                              <button
                                onClick={() => handleDeleteKeyword(selectedCategory, keyword)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Supprimer
                              </button>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                Veuillez sélectionner une catégorie dans la liste à gauche pour gérer ses mots-clés.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
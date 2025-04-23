// app/(main)/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../../lib/firebase/config';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    articles: 0,
    rssFeeds: 0,
    genericKeywords: 0,
    categoryKeywords: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch users count
        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);
        const usersCount = usersSnapshot.exists() ? Object.keys(usersSnapshot.val()).length : 0;
        
        // Fetch articles count
        const articlesRef = ref(database, 'articles');
        const articlesSnapshot = await get(articlesRef);
        const articlesCount = articlesSnapshot.exists() ? Object.keys(articlesSnapshot.val()).length : 0;
        
        // Fetch RSS feeds count
        const rssFeedsRef = ref(database, 'rssFeeds');
        const rssFeedsSnapshot = await get(rssFeedsRef);
        const rssFeedsCount = rssFeedsSnapshot.exists() ? Object.keys(rssFeedsSnapshot.val()).length : 0;
        
        // Fetch generic keywords count
        const genericKeywordsRef = ref(database, 'genericKeywords');
        const genericKeywordsSnapshot = await get(genericKeywordsRef);
        const genericKeywordsCount = genericKeywordsSnapshot.exists() ? Object.keys(genericKeywordsSnapshot.val()).length : 0;
        
        // Fetch category keywords count
        const categoryKeywordsRef = ref(database, 'categoryKeywords');
        const categoryKeywordsSnapshot = await get(categoryKeywordsRef);
        const categoryKeywordsCount = categoryKeywordsSnapshot.exists() ? Object.keys(categoryKeywordsSnapshot.val()).length : 0;
        
        setStats({
          users: usersCount,
          articles: articlesCount,
          rssFeeds: rssFeedsCount,
          genericKeywords: genericKeywordsCount,
          categoryKeywords: categoryKeywordsCount
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Users</h2>
          <p className="text-4xl font-bold text-blue-600">{stats.users}</p>
          <Link href="/admin/users" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
            Manage Users →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Articles</h2>
          <p className="text-4xl font-bold text-green-600">{stats.articles}</p>
          <Link href="/admin/articles" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
            Manage Articles →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">RSS Feeds</h2>
          <p className="text-4xl font-bold text-purple-600">{stats.rssFeeds}</p>
          <Link href="/admin/rssfeeds" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
            Manage RSS Feeds →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Generic Keywords</h2>
          <p className="text-4xl font-bold text-yellow-600">{stats.genericKeywords}</p>
          <Link href="/admin/generickeywords" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
            Manage Keywords →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Category Keywords</h2>
          <p className="text-4xl font-bold text-orange-600">{stats.categoryKeywords}</p>
          <Link href="/admin/categorykeywords" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
            Manage Categories →
          </Link>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            href="/admin/users"
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg text-center font-medium"
          >
            User Management
          </Link>
          <Link
            href="/admin/articles"
            className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg text-center font-medium"
          >
            Article Management
          </Link>
          <Link
            href="/admin/rssfeeds"
            className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg text-center font-medium"
          >
            RSS Feeds Management
          </Link>
          <Link
            href="/admin/generickeywords"
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg text-center font-medium"
          >
            Generic Keywords
          </Link>
          <Link
            href="/admin/categorykeywords"
            className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg text-center font-medium"
          >
            Category Keywords
          </Link>
        </div>
      </div>
    </div>
  );
}
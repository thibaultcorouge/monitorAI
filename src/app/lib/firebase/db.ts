// lib/firebase/db.ts
import { 
    ref, 
    get, 
    set, 
    update, 
    remove, 
    push, 
    query, 
    orderByChild, 
    limitToLast,
    onValue,
  } from 'firebase/database';
  import { database } from './config';
  import { Article, RSSFeed, UserData } from '../../lib/utils/types';
  
  // User operations
  export const getUserById = async (userId: string): Promise<UserData | null> => {
    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        return { uid: userId, ...snapshot.val() } as UserData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  };
  
  export const updateUser = async (userId: string, data: Partial<UserData>): Promise<void> => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };
  
  export const deleteUser = async (userId: string): Promise<void> => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };
  
  // Article operations
  export const getArticleById = async (articleId: string): Promise<Article | null> => {
    try {
      const articleRef = ref(database, `articles/${articleId}`);
      const snapshot = await get(articleRef);
      
      if (snapshot.exists()) {
        return { id: articleId, ...snapshot.val() } as Article;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  };
  
  export const createArticle = async (article: Omit<Article, 'id'>): Promise<string> => {
    try {
      const articlesRef = ref(database, 'articles');
      const newArticleRef = push(articlesRef);
      
      await set(newArticleRef, article);
      
      return newArticleRef.key as string;
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  };
  
  export const updateArticle = async (articleId: string, data: Partial<Article>): Promise<void> => {
    try {
      const articleRef = ref(database, `articles/${articleId}`);
      await update(articleRef, data);
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  };
  
  export const deleteArticle = async (articleId: string): Promise<void> => {
    try {
      const articleRef = ref(database, `articles/${articleId}`);
      await remove(articleRef);
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  };
  
  export const getLatestArticles = async (limit: number = 20): Promise<Article[]> => {
    try {
      const articlesRef = query(
        ref(database, 'articles'),
        orderByChild('pubDate'),
        limitToLast(limit)
      );
      
      const snapshot = await get(articlesRef);
      
      if (snapshot.exists()) {
        const articles = [] as Article[];
        
        snapshot.forEach((childSnapshot) => {
          articles.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
        
        // Reverse to get newest first
        return articles.reverse();
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching latest articles:', error);
      throw error;
    }
  };
  
  // RSS Feed operations
  export const getRSSFeedById = async (feedId: string): Promise<RSSFeed | null> => {
    try {
      const feedRef = ref(database, `rssFeeds/${feedId}`);
      const snapshot = await get(feedRef);
      
      if (snapshot.exists()) {
        return { id: feedId, ...snapshot.val() } as RSSFeed;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      throw error;
    }
  };
  
  export const createRSSFeed = async (feed: Omit<RSSFeed, 'id'>): Promise<string> => {
    try {
      const feedsRef = ref(database, 'rssFeeds');
      const newFeedRef = push(feedsRef);
      
      await set(newFeedRef, {
        ...feed,
        createdAt: new Date().toISOString()
      });
      
      return newFeedRef.key as string;
    } catch (error) {
      console.error('Error creating RSS feed:', error);
      throw error;
    }
  };
  
  export const updateRSSFeed = async (feedId: string, data: Partial<RSSFeed>): Promise<void> => {
    try {
      const feedRef = ref(database, `rssFeeds/${feedId}`);
      await update(feedRef, data);
    } catch (error) {
      console.error('Error updating RSS feed:', error);
      throw error;
    }
  };
  
  export const deleteRSSFeed = async (feedId: string): Promise<void> => {
    try {
      const feedRef = ref(database, `rssFeeds/${feedId}`);
      await remove(feedRef);
    } catch (error) {
      console.error('Error deleting RSS feed:', error);
      throw error;
    }
  };
  
  // General subscription function to listen for real-time updates
  export const subscribeToData = <T>(
    path: string, 
    callback: (data: T[]) => void
  ): (() => void) => {
    const dbRef = ref(database, path);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dataArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as T[];
        
        callback(dataArray);
      } else {
        callback([] as T[]);
      }
    });
    
    return unsubscribe;
  };
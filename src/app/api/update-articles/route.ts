/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'
//app/api/update-articles/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import axios from 'axios';
import { initFirebaseAdmin } from '../../lib/firebase/admin-config';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const adminInstance = initFirebaseAdmin();

// Create parser for RSS feeds with proper handling for various formats
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded'],
      ['category', 'categories', { keepArray: true }], // Ensure categories are always treated as arrays
    ]
  }
});

/**
 * Normalize text for keyword matching (remove accents, lowercase, etc.)
 */
function normalizeText(text : string): string {
  if (!text) return '';

  //convert to lowercase
  const normalized = text.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
  .replace(/[''′`]/g, "'"); // Normalize apostrophes

  return normalized.trim();
}

/**
 * Auto-categorize content function with whole word matching
 */
async function autoCategorizeContent(title : string, description : string, categoryKeywords: Record<string, string[]>) {
  // Create a combined normalized text to search through
  const normalizedText = normalizeText(`${title} ${description}`);
  
  // Convert to a set of words for exact matching (adding space boundaries)
  const textForWordMatching = ` ${normalizedText} `;
  
  // Set to track detected categories (to avoid duplicates)
  const detectedCategories = new Set();
  
  // Check for each category's keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    // Check if any keyword appears as a whole word in the combined text
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      
      // Check for whole word matches by adding word boundaries
      let isMatch = false;
      
      if (normalizedKeyword.includes(' ')) {
        // Multi-word phrase - look for exact phrase with space boundaries
        isMatch = textForWordMatching.includes(` ${normalizedKeyword} `);
      } else {
        // Single word - use regex word boundary
        const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i');
        isMatch = regex.test(normalizedText);
      }
      
      if (isMatch) {
        detectedCategories.add(category);
        break; // Found a match for this category, move to next category
      }
    }
  }
  
  return Array.from(detectedCategories);
}

/**
 * Extract image URL from various RSS feed formats
 */
function extractImageFromItem(item: { 
  enclosure?: { url?: string }; 
  mediaContent?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>; 
  mediaThumbnail?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>; 
  contentEncoded?: string; 
  content?: string; 
}) {
  try {
    // Check enclosure
    if (item.enclosure && item.enclosure.url) {
      return item.enclosure.url;
    }
    
    // Check media:content - handle both array and object structures
    if (item.mediaContent) {
      if (Array.isArray(item.mediaContent)) {
        for (const media of item.mediaContent) {
          if (media && media.$ && media.$.url) {
            return media.$.url;
          }
        }
      } else if (item.mediaContent.$ && item.mediaContent.$.url) {
        return item.mediaContent.$.url;
      }
    }
    
    // Check media:thumbnail
    if (item.mediaThumbnail) {
      if (Array.isArray(item.mediaThumbnail)) {
        for (const thumbnail of item.mediaThumbnail) {
          if (thumbnail && thumbnail.$ && thumbnail.$.url) {
            return thumbnail.$.url;
          }
        }
      } else if (item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
        return item.mediaThumbnail.$.url;
      }
    }
    
    // Extract from contentEncoded if available
    if (item.contentEncoded) {
      const imgMatch = /<img[^>]+src=["']([^"']+)["'][^>]*>/i.exec(item.contentEncoded);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
    }
    
    // Extract from content if available
    if (item.content) {
      const imgMatch = /<img[^>]+src=["']([^"']+)["'][^>]*>/i.exec(item.content);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
    }
    
    // If all else fails, try to find any URL pattern in the contentEncoded
    if (item.contentEncoded) {
      const urlMatch = /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp))/i.exec(item.contentEncoded);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in extractImageFromItem:', error);
    return null;
  }
}

function normalizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Create URL object to standardize format
    const parsedUrl = new URL(url);
    
    // Convert to lowercase
    let normalized = parsedUrl.toString().toLowerCase();
    
    // Remove trailing slash if present
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    // Remove common tracking parameters
    normalized = normalized.split('?')[0]; // Remove query parameters entirely
    
    return normalized;
  } catch (error) {
    // If URL parsing fails, return the original with basic normalization
    console.warn(`URL normalization failed for: ${url}`, error);
    return url.toLowerCase().trim();
  }
}

export async function POST() {
  const startTime = performance.now();

  try {
    console.log("Starting RSS feeds update process");
    
    const adminDb = admin.database();
    
    // Calculate cutoff date (articles older than this will be ignored)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    console.log(`Cutoff date for articles: ${cutoffDate.toISOString()}`);
    
    // 0. FETCH CATEGORY KEYWORDS FROM DATABASE
    console.log("Fetching category keywords from database...");
    const categoryKeywordsSnapshot = await adminDb.ref('categoryKeywords').once('value');
    const categoryKeywords: Record<string, string[]> = {};
    
    if (categoryKeywordsSnapshot.exists()) {
      categoryKeywordsSnapshot.forEach(snapshot => {
        const category = snapshot.val();
        if (category && category.category && Array.isArray(category.keywords)) {
          categoryKeywords[category.category] = category.keywords;
        }
      });
      console.log(`Loaded ${Object.keys(categoryKeywords).length} categories with keywords from database`);
    } else {
      console.log("No category keywords found in database, will use 'General' category for all articles");
    }
    
    // 1. OPTIMIZATION: Get all existing article links at once to avoid individual duplicate checks
    const existingLinksSnapshot = await adminDb.ref('articles').once('value');
    const existingLinks = new Map(); // Using a Map to store link -> id mapping

    if (existingLinksSnapshot.exists()) {
      existingLinksSnapshot.forEach(snapshot => {
        const article = snapshot.val();
        if (article && article.link) {
          existingLinks.set(normalizeUrl(article.link), snapshot.key);
        }
      });
    }
    
    console.log(`Found ${existingLinks.size} existing articles in database`);
    
    // 2. Fetch RSS feed URLs from the database
    const feedsSnapshot = await adminDb.ref('rssFeeds').once('value');
    
    if (!feedsSnapshot.exists()) {
      return NextResponse.json({ message: 'No RSS feeds found.' }, { status: 404 });
    }
    
    const feeds = feedsSnapshot.val();
    
    // Séparer les flux en génériques et non génériques
    interface FeedData {
      id: string;
      url: string;
      source: string;
      language: string;
    }
    const regularFeeds: FeedData[] = [];
    const genericFeeds: FeedData[] = [];
    
    type Feed = {
      url: string;
      name?: string;
      language?: string;
      isGeneric?: boolean;
    };

    Object.entries(feeds).forEach(([id, feed]) => {
      const feedData = {
        id,
        url: (feed as Feed).url,
        source: (feed as Feed).name || 'Unknown Source',
        language: (feed as Feed).language || 'fr'
      };
      
      if ((feed as Feed).isGeneric) {
        genericFeeds.push(feedData);
      } else {
        regularFeeds.push(feedData);
      }
    });
    
    console.log(`Found ${regularFeeds.length} regular feeds and ${genericFeeds.length} generic feeds to process`);
    
    // 3. Process feeds and prepare batch updates
    const newArticles = [];
    const newArticleBatch: Record<string, any> = {};
    let processedCount = 0;
    let skippedOldCount = 0;
    let skippedDuplicateCount = 0;
    let errorCount = 0;
    let genericArticlesSkipped = 0;
    let genericArticlesIncluded = 0;
    
    // 3.1 Récupérer les mots-clés pour le filtrage des feeds génériques
    const keywordsSnapshot = await adminDb.ref('genericKeywords').once('value');
    const genericKeywords : string [] = [];
    
    if (keywordsSnapshot.exists()) {
      keywordsSnapshot.forEach(snapshot => {
        const keyword = snapshot.val();
        if (keyword && keyword.value) {
          genericKeywords.push(normalizeText(keyword.value));
        }
      });
    }
    
    console.log(`Loaded ${genericKeywords.length} generic filter keywords`);
    
    // 3.2 Traiter d'abord les flux RSS non génériques
    for (const feed of regularFeeds) {
      try {
        // Fetch the feed
        const response = await axios.get(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RSS-Reader/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          },
          timeout: 15000
        });
        
        // Parse the feed XML content
        const parsedFeed = await parser.parseString(response.data);
        
        // Traiter chaque élément du flux RSS
        for (const item of parsedFeed.items) {
          try {
            processedCount++;
            
            // Skip if missing required fields
            if (!item.title || !item.link) {
              continue;
            }
            
            // Skip if the article is older than the cutoff date
            if (item.pubDate) {
              const pubDate = new Date(item.pubDate);
              if (pubDate < cutoffDate) {
                skippedOldCount++;
                continue;
              }
            }
            
            // Skip if we already have this article
            const normalizedLink = normalizeUrl(item.link);
            if (existingLinks.has(normalizedLink)) {
              skippedDuplicateCount++;
              continue;
            }
            
            // Extract image from various possible sources in the RSS
            const image = extractImageFromItem(item);


            function extractDescription(item: any): string {
              const raw = item.contentSnippet || item['content:encoded'] || item.description || '';
              return typeof raw === 'string'
                ? raw.replace(/<[^>]+>/g, '').trim()
                : '';
            }
            
            const description = extractDescription(item);
            const categories = await autoCategorizeContent(item.title, description, categoryKeywords);

            if (categories.length === 0) {
              categories.push('General');
            }
            
            // Create article object
            const article = {
              title: item.title,
              // description: item.contentSnippet || '',
              description: description,
              link: item.link,
              pubDate: item.pubDate || new Date().toISOString(),
              source: feed.source,
              image: image,
              author: item.creator || (item as any).author || '',
              categories: categories,
              language: feed.language,
              createdAt: new Date().toISOString(),
              isFromGeneric: false // Indiquer qu'il ne vient pas d'un flux générique
            };
            
            // Add to batch for later insertion
            const newArticleId = adminDb.ref('articles').push().key;
            if (newArticleId) {
              newArticleBatch[newArticleId] = article;
              newArticles.push(article);
              existingLinks.set(normalizedLink, newArticleId);
            } else {
              console.error('Failed to generate a new article ID.');
              errorCount++;
            }
          } catch (itemError) {
            console.error(`Error processing feed item:`, itemError);
            errorCount++;
          }
        }
      } catch (feedError) {
        if (feedError instanceof Error) {
          console.error(`Error processing feed ${feed.url}:`, feedError.message);
        } else {
          console.error(`Error processing feed ${feed.url}:`, feedError);
        }
        errorCount++;
      }
    }
    
    // 3.3 Traiter les flux RSS génériques avec filtrage par mots-clés
    for (const feed of genericFeeds) {
      try {
        // Fetch the feed
        const response = await axios.get(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RSS-Reader/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          },
          timeout: 15000
        });
        
        // Parse the feed XML content
        const parsedFeed = await parser.parseString(response.data);
        
        // Traiter chaque élément du flux RSS générique
        for (const item of parsedFeed.items) {
          try {
            processedCount++;
            
            // Skip if missing required fields
            if (!item.title || !item.link) {
              continue;
            }
            
            // Skip if the article is older than the cutoff date
            if (item.pubDate) {
              const pubDate = new Date(item.pubDate);
              if (pubDate < cutoffDate) {
                skippedOldCount++;
                continue;
              }
            }
            
            // Skip if we already have this article
            const normalizedLink = normalizeUrl(item.link);
            if (existingLinks.has(normalizedLink)) {
              skippedDuplicateCount++;
              continue;
            }
            
            // FILTRAGE SPÉCIFIQUE POUR LES FLUX GÉNÉRIQUES
            // Vérifier si l'article contient au moins un des mots-clés génériques
            if (genericKeywords.length > 0) {
              const description = extractDescription(item);
              const normalizedTitle = normalizeText(item.title);
              const normalizedDescription = normalizeText(description);
              const combinedText = `${normalizedTitle} ${normalizedDescription}`;
              
              // Vérifier si au moins un mot-clé est présent dans le texte
              const matchesKeyword = genericKeywords.some(keyword => 
                combinedText.includes(keyword)
              );
              
              // Ignorer les articles qui ne contiennent aucun mot-clé générique
              if (!matchesKeyword) {
                genericArticlesSkipped++;
                continue;
              }
              
              genericArticlesIncluded++;
            }
            
            // Extract image from various possible sources in the RSS
            const image = extractImageFromItem(item);
            
            function extractDescription(item: any): string {
              const raw = item.contentSnippet || item['content:encoded'] || item.description || '';
              return typeof raw === 'string'
                ? raw.replace(/<[^>]+>/g, '').trim()
                : '';
            }
            
            const description = extractDescription(item);
            const categories = await autoCategorizeContent(item.title, description, categoryKeywords);

            if (categories.length === 0) {
              categories.push('General');
            }
            
            // Create article object
            const article = {
              title: item.title,
              // description: item.contentSnippet || '',
              description: description,
              link: item.link,
              pubDate: item.pubDate || new Date().toISOString(),
              source: feed.source,
              image: image,
              author: item.creator || (item as any).author || '',
              categories: categories,
              language: feed.language,
              createdAt: new Date().toISOString(),
              isFromGeneric: true // Indiquer qu'il vient d'un flux générique
            };
            
            // Add to batch for later insertion
            const newArticleId = adminDb.ref('articles').push().key;
            if (newArticleId) {
              newArticleBatch[newArticleId] = article;
              newArticles.push(article);
              existingLinks.set(normalizedLink, newArticleId);
            } else {
              console.error('Failed to generate a new article ID.');
              errorCount++;
            }
          } catch (itemError) {
            console.error(`Error processing feed item:`, itemError);
            errorCount++;
          }
        }
      } catch (feedError) {
        if (feedError instanceof Error) {
          console.error(`Error processing feed ${feed.url}:`, feedError.message);
        } else {
          console.error(`Error processing feed ${feed.url}:`, feedError);
        }
        errorCount++;
      }
    }
    
    // 4. Batch write all new articles at once
    console.log(`Adding ${Object.keys(newArticleBatch).length} new articles in batch`);
    if (Object.keys(newArticleBatch).length > 0) {
      await adminDb.ref('articles').update(newArticleBatch);
    }
    
    // 5. Delete old articles
    console.log("Finding old articles to delete...");
    const oldArticlesSnapshot = await adminDb.ref('articles').once('value');
    const oldArticleIds: string[] = [];
    
    if (oldArticlesSnapshot.exists()) {
      oldArticlesSnapshot.forEach(snapshot => {
        const article = snapshot.val();
        if (article && article.pubDate) {
          try {
            const pubDate = new Date(article.pubDate);
            if (pubDate < cutoffDate) {
              oldArticleIds.push(snapshot.key);
            }
          } catch (error) {
            console.error(`Error parsing date for article ${snapshot.key}: ${article.pubDate}`);
          }
        }
      });
    }
    
    // Delete old articles in batches
    console.log(`Found ${oldArticleIds.length} old articles to delete`);
    const batchSize = 50;
    let deletedCount = 0;
    
    for (let i = 0; i < oldArticleIds.length; i += batchSize) {
      const batch = oldArticleIds.slice(i, i + batchSize);
      const batchUpdates: Record<string, null> = {};
      
      // Create a batch deletion object
      batch.forEach(id => {
        batchUpdates[`articles/${id}`] = null;
      });
      
      // Execute the batch deletion
      if (Object.keys(batchUpdates).length > 0) {
        await adminDb.ref().update(batchUpdates);
        deletedCount += batch.length;
      }
    }
    
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000;

    console.log(`API execution completed in ${executionTime.toFixed(2)} seconds`);

    return NextResponse.json({
      message: `${newArticles.length} new articles added, ${deletedCount} old articles deleted`,
      newArticlesCount: newArticles.length,
      processedCount,
      skippedOldCount,
      skippedDuplicateCount,
      errorCount,
      deletedCount,
      genericStats: {
        skipped: genericArticlesSkipped,
        included: genericArticlesIncluded
      },
      executionTime: `${executionTime.toFixed(2)} seconds`
    });
  } catch (error) {
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000;

    console.error('Error updating articles:', error);
    return NextResponse.json({ 
      message: 'Failed to update articles.',
      error: error instanceof Error ? error.message : String(error),
      executionTime: `${executionTime.toFixed(2)} seconds`
    }, { status: 500 });
  }
}
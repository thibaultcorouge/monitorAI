"use client";

import { useEffect, useState, useCallback } from "react";
import { ref, onValue, set } from "firebase/database";
import { database } from "../../lib/firebase/config";
import { Article } from "../../lib/utils/types";
import ArticleFilter from "../../components/articleFilter";
import Image from "next/image";
import Banner from "../../components/ui/Banner";
import TransitionLayout from "../../components/TransitionLayout";

// Key for saving the last update time in localStorage (fallback)
const LAST_UPDATE_KEY = "last_rss_update_time";
const FORMATTED_UPDATE_KEY = "last_update_formatted";

// Skeleton loading component with enhanced animation
const ArticleSkeleton = ({ index }: { index: number }) => (
  <div
    className="bg-greenwhite rounded-lg shadow-md overflow-hidden h-full flex flex-col"
    style={{
      opacity: 1,
      animation: `fadeIn 600ms ease-out forwards`,
      animationDelay: `${Math.min(index, 5) * 150}ms`,
    }}
  >
    <div className="relative h-48 w-full bg-gray-200 animate-pulse"></div>
    <div className="p-4 flex flex-col flex-grow">
      <div className="flex items-center gap-2 mb-2 h-8">
        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
      </div>
      <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded mb-2"></div>
      <div className="h-4 w-full bg-gray-200 animate-pulse rounded mb-1"></div>
      <div className="h-4 w-5/6 bg-gray-200 animate-pulse rounded mb-1"></div>
      <div className="h-4 w-4/6 bg-gray-200 animate-pulse rounded mb-4"></div>
      <div className="flex justify-between items-center mt-auto">
        <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-5 w-24 bg-gray-200 animate-pulse rounded"></div>
      </div>
    </div>
  </div>
);

export default function HomePage() {
  // Add CSS keyframes for animations
  useEffect(() => {
    // Add a style tag with our custom animations
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(styleTag);
    
    // Clean up
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  // Get the timestamp from Firebase
  const getLastUpdateTime = useCallback(() => {
    const lastUpdateRef = ref(database, "system/lastRssUpdate");
    
    // Listen for changes to the timestamp in Firebase
    onValue(lastUpdateRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLastUpdateTime(data.formattedTime);
        
        // Also update localStorage as fallback
        localStorage.setItem(LAST_UPDATE_KEY, data.timestamp.toString());
        localStorage.setItem(FORMATTED_UPDATE_KEY, data.formattedTime);
      } else {
        // If no data in Firebase, use localStorage as fallback
        const savedTime = localStorage.getItem(FORMATTED_UPDATE_KEY);
        setLastUpdateTime(savedTime || "Jamais");
      }
    });
  }, []);

  // Function to update the timestamp in Firebase
  const updateTimestamp = async () => {
    const now = new Date();
    const formattedTime =
      now.toLocaleDateString() +
      " à " +
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    try {
      // Update timestamp in Firebase
      await set(ref(database, "system/lastRssUpdate"), {
        timestamp: now.getTime(),
        formattedTime: formattedTime
      });
      
      // Also update localStorage as fallback
      localStorage.setItem(LAST_UPDATE_KEY, now.getTime().toString());
      localStorage.setItem(FORMATTED_UPDATE_KEY, formattedTime);
      
      return formattedTime;
    } catch (error) {
      console.error("Error updating timestamp in Firebase:", error);
      
      // Fallback to local storage
      localStorage.setItem(LAST_UPDATE_KEY, now.getTime().toString());
      localStorage.setItem(FORMATTED_UPDATE_KEY, formattedTime);
      
      return formattedTime;
    }
  };

  // Function to trigger RSS update
  const triggerRssUpdate = async () => {
    setUpdating(true);

    try {
      const response = await fetch("/api/update-articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Échec de la mise à jour des flux RSS");
      }

      const data = await response.json();
      console.log("RSS update successful:", data);
      // Update timestamp in Firebase
      await updateTimestamp();
    } catch (error) {
      console.error("Error updating RSS feeds", error);
    } finally {
      setUpdating(false);
    }
  };

  // Load articles from Firebase
  const loadArticles = useCallback(() => {
    setLoading(true);
    const articlesRef = ref(database, "articles");
    
    // Record the start time to ensure minimum loading duration
    const startTime = Date.now();
    // Minimum duration to show loading state (in milliseconds)
    const minLoadingDuration = 800;

    return onValue(articlesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const articlesArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        // Sort by publication date (newest first)
        articlesArray.sort((a, b) => 
          new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        );

        setArticles(articlesArray);
        setFilteredArticles(articlesArray);
      } else {
        setArticles([]);
        setFilteredArticles([]);
      }
      
      // Calculate remaining time to meet minimum loading duration
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingDuration - elapsedTime);
      
      // Add delay before hiding skeletons for smoother transition
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    });
  }, []);

  // Initial setup
  useEffect(() => {
    getLastUpdateTime();
    const unsubscribe = loadArticles();
    return () => unsubscribe();
  }, [loadArticles, getLastUpdateTime]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilteredArticles: Article[]) => {
    setFilteredArticles(newFilteredArticles);
  }, []);

  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " à " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Create array for skeleton placeholders
  const skeletonCount = 6; // Number of skeleton cards to show
  const skeletonArray = Array(skeletonCount).fill(null);

  return (
    <TransitionLayout>
      <div className="container mx-auto p-4">
        <Banner />
        <div>
          <ArticleFilter
            articles={articles}
            onFilterChange={handleFilterChange}
          />
        </div>

        <div className="flex flex-row justify-between mb-6 mt-10">
          <h1 className="text-3xl font-bold">Dernières nouvelles</h1>
          <div className="flex flex-row items-end gap-2">
            <p>Dernière mise à jour à {lastUpdateTime || "Jamais"}</p>
            <button
              onClick={triggerRssUpdate}
              disabled={updating}
              className={`px-2 py-1 rounded text-sm shadow ${
                updating
                  ? 'bg-darkgreenbutton text-white cursor-not-allowed' 
                  : 'bg-darkgreenbutton text-white bg-darkgreenbutton-hover cursor-pointer transition-all'
              }`}
              title="Mettre à jour les flux RSS"
            >
              {updating ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          {/* Single grid container that handles both states */}
          {filteredArticles.length === 0 && !loading ? (
            <div className="text-center p-8">
              <p className="mt-45 mb-45 text-xl">
                Aucun article ne correspond à vos critères.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Conditionally render either skeletons or content in the same grid */}
              {loading ? 
                skeletonArray.map((_, index) => (
                  <ArticleSkeleton key={`skeleton-${index}`} index={index} />
                ))
              :
                filteredArticles.map((article, index) => (
                <a key={article.id || article.link} href={article.link} target="_blank">
                  <div
                    className="relative"
                    style={{
                      opacity: 0,
                      animation: `fadeIn 600ms ease-out forwards`,
                      animationDelay: `${Math.min(index, 5) * 150}ms`,
                    }}
                  >
                    <div className="bg-greenwhite rounded-lg shadow-md overflow-hidden group h-full flex flex-col hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out">
                      <div className="relative h-48 w-full">
                        {article.image ? (
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="relative h-48 w-full">
                            <Image 
                            src="/images/placeholder-image.png" 
                            alt="" 
                            fill
                            className="object-cover" 
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/>
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex flex-col flex-grow bg-">
                        <div className="flex items-center gap-2 mb-2 h-7 overflow-hidden">
                          <span className="text-xs font-semibold bg-darkgreenbutton shadow-md text-white px-2 py-1 rounded">
                            {article.source}
                          </span>
                          {article.categories &&
                            article.categories.length > 0 && (
                              <div className="flex items-center gap-1 whitespace-nowrap overflow-hidden">
                                {article.categories
                                  .slice(0, 1)
                                  .map((category, index) => (
                                    <span
                                      className="text-xs bg-greenbutton buttontext px-2 py-1 rounded"
                                      key={`${article.id}-category-${index}`}
                                    >
                                      {category}
                                    </span>
                                  ))}
                                {article.categories.length > 1 && (
                                  <span className="text-xs  bg-greenbutton buttontext px-2 py-1 rounded cursor-help">
                                    +{article.categories.length - 1}
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                        <h2 className="text-fontdark text-l font-bold mb-2 h-12 overflow-hidden line-clamp-2">
                          {article.title}
                        </h2>
                        <p className="text-xs mb-4 h-16 overflow-hidden line-clamp-3">
                          {article.description}
                        </p>
                        <div className="flex justify-between items-center mt-auto">
                          <p className="text-xs ">
                            Publié le : {formatDateTime(article.pubDate)}
                          </p>
                          <button className="buttontext text-sm hover:underline cursor-pointer font-medium">
                            En savoir plus
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </TransitionLayout>
  );
}
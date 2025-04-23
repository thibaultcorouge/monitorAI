// components/ArticleFilter.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Article } from "../lib/utils/types";

interface ArticleFilterProps {
  articles: Article[];
  onFilterChange: (filteredArticles: Article[]) => void;
}

export default function ArticleFilter({
  articles,
  onFilterChange,
}: ArticleFilterProps) {
  // Filter states
  const [filterText, setFilterText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");

  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);

  const prevFilteredResultsRef = useRef<Article[]>([]);

  // Apply filters and sorting whenever filter criteria change
  const filteredArticles = useMemo(() => {
    try {
      // Filter articles based on search text, category, and source
      let filtered = articles.filter((article) => {
        const title = article.title || "";
        const description = article.description || "";
        const author = article.author || "";

        const searchTextMatch =
          filterText === "" ||
          title.toLowerCase().includes(filterText.toLowerCase()) ||
          description.toLowerCase().includes(filterText.toLowerCase()) ||
          author.toLowerCase().includes(filterText.toLowerCase());

        const categoryMatch =
          categoryFilter === "" ||
          (article.categories && article.categories.includes(categoryFilter));

        const sourceMatch =
          sourceFilter === "" || article.source === sourceFilter;

        const languageMatch =
          languageFilter === "" || article.language === languageFilter;

        return searchTextMatch && categoryMatch && sourceMatch && languageMatch;
      });

      // Apply sorting
      filtered = [...filtered].sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        } else if (sortBy === "oldest") {
          return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
        } else if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });

      return filtered;
    } catch (error) {
      console.error("Error in filtering", error);
      return articles;
    }
  }, [
    articles,
    filterText,
    categoryFilter,
    sourceFilter,
    languageFilter,
    sortBy,
  ]);

  useEffect(() => {
    if (
      JSON.stringify(prevFilteredResultsRef.current) ===
      JSON.stringify(filteredArticles)
    ) {
      return;
    }
    prevFilteredResultsRef.current = filteredArticles;
    onFilterChange(filteredArticles);
  }, [filteredArticles, onFilterChange]);

  const allCategories = useMemo(
    () => [...new Set(articles.flatMap((article) => article.categories || []))],
    [articles]
  );

  const allSources = useMemo(
    () => [...new Set(articles.map((article) => article.source))],
    [articles]
  );

  const allLanguages = useMemo(
    () => [
      ...new Set(articles.map((article) => article.language).filter(Boolean)),
    ],
    [articles]
  );
  // Reset all filters
  const handleResetFilters = () => {
    setFilterText("");
    setCategoryFilter("");
    setSourceFilter("");
    setLanguageFilter("");
    setSortBy("newest");
  };

  const toggleFilterVisibility = () => {
    setIsAnimating(true);
    setIsFilterVisible(!isFilterVisible);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="bg-greenwhite p-2 rounded-lg shadow-md mb-6 overflow-hidden">
      {/* Filter toggle button */}
      <div className="flex justify-between items-center">
        <div>
          <input
            type="text"
            placeholder="Rechercher des articles..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full md:w-70 inputfocus text-base p-2 input rounded-lg placeholder:text-base"
          />
        </div>
        <button
          onClick={toggleFilterVisibility}
          className="flex items-center text-sm buttontext buttontext-hover"
        >
          {isFilterVisible ? "Masquer les filtres" : "Afficher les filtres"}
          <svg
            className={`ml-1 w-4 h-4 transition-transform ${
              isFilterVisible ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>
      </div>

      {/* Filter content - conditionally visible */}
      <div
        className={`
          transition-all  duration-300 ease
          origin-top 
          ${
            isFilterVisible
              ? "max-h-96 opacity-100 scale-y-100 mt-4"
              : "max-h-0 opacity-0 scale-y-0"
          }
          ${isAnimating ? "overflow-hidden" : ""}
        `}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium  mb-1">
              Catégorie
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Toutes les catégories</option>
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-1">
              Source
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Toutes les sources</option>
              {allSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-1">
              Langue
            </label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Toutes les langues</option>
              {allLanguages.map((language) => (
                <option key={language} value={language}>
                  {language === "en"
                    ? "Anglais"
                    : language === "fr"
                    ? "Français"
                    : language === "es"
                    ? "Espagnol"
                    : language === "de"
                    ? "Allemand"
                    : language === "it"
                    ? "Italien"
                    : language}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-1">
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "newest" | "oldest" | "title")
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="newest">Plus récents d&apos;abord</option>
              <option value="oldest">Plus anciens d&apos;abord</option>
              <option value="title">Titre (A-Z)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleResetFilters} className="bg-darkgreenbutton bg-darkgreenbutton-hover px-4 py-2 rounded-lg transition-colors">
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// components/RssUpdateButton.tsx
'use client';

import { useState } from 'react';


export default function RssUpdateButton() {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateClick = async () => {

        if (isUpdating) return;

        setIsUpdating(true);
    
    try {
      const response = await fetch('/api/update-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update RSS feeds');
      }

      await response.json();
    } catch (err) {
        console.error('Error updating RSS feeds:', err);
        alert('Failed to update RSS feeds. Please try again later.');
    } finally {
        setIsUpdating(false);
    }
  };


  return (
    <button
      onClick={handleUpdateClick}
      disabled={isUpdating}
      className={`px-2 py-1 rounded text-sm ${
        isUpdating 
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
          : 'bg-darkgreenbutton text-white bg-darkgreenbutton-hover'
      }`}
      title="Mettre à jour les flux RSS"
    >
      {isUpdating ? (
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
  );

}
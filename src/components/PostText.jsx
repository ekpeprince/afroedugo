import React, { useMemo } from 'react';
import LinkPreview from './LinkPreview';

// Regular expressions for detecting URLs and Hashtags
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const HASHTAG_REGEX = /(#[a-zA-Z0-9_]+)/g;

export default function PostText({ text, onHashtagClick }) {
  // Extract all URLs from the text for the LinkPreview components
  const extractedUrls = useMemo(() => {
    if (!text) return [];
    const matches = text.match(URL_REGEX);
    return matches ? Array.from(new Set(matches)) : []; // unique URLs
  }, [text]);

  // Parse text into clickable segments
  const parsedContent = useMemo(() => {
    if (!text) return null;
    
    // Split by URLs first
    const parts = text.split(URL_REGEX);
    
    return parts.map((part, i) => {
      if (part.match(URL_REGEX)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      
      // Then split the remaining text by Hashtags
      const subParts = part.split(HASHTAG_REGEX);
      return subParts.map((subPart, j) => {
        if (subPart.match(HASHTAG_REGEX)) {
          return (
            <span 
              key={`${i}-${j}`} 
              onClick={(e) => {
                e.stopPropagation();
                if (onHashtagClick) onHashtagClick(subPart);
              }}
              className="text-blue-500 font-semibold cursor-pointer hover:underline"
            >
              {subPart}
            </span>
          );
        }
        return <span key={`${i}-${j}`}>{subPart}</span>;
      });
    });
  }, [text, onHashtagClick]);

  return (
    <div>
      <p className="text-gray-900 text-[15px] leading-relaxed whitespace-pre-wrap">
        {parsedContent}
      </p>
      
      {/* Render a link preview for the first URL found */}
      {extractedUrls.length > 0 && (
        <LinkPreview url={extractedUrls[0]} />
      )}
    </div>
  );
}

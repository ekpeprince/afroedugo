import React, { useMemo, useState, useRef, useEffect } from 'react';
import LinkPreview from './LinkPreview';

// Regular expressions for detecting URLs, Hashtags, and Mentions
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const HASHTAG_REGEX = /(#[a-zA-Z0-9_]+)/g;
const MENTION_REGEX = /(@\[[^\]]+\]\([^)]+\))/g;

export default function PostText({ 
  text, 
  onHashtagClick, 
  onMentionClick,
  expandable = false,
  initiallyExpanded = false,
  maxCollapsedHeight = 160
}) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (initiallyExpanded) {
      setIsExpanded(true);
    }
  }, [initiallyExpanded]);

  // Check if text exceeds height or line threshold
  useEffect(() => {
    if (!expandable) return;
    if (contentRef.current) {
      const isHeightOverflow = contentRef.current.scrollHeight > maxCollapsedHeight + 20;
      const isLineCountOverflow = text ? (text.length > 250 || (text.match(/\n/g) || []).length >= 5) : false;
      setCanExpand(isHeightOverflow || isLineCountOverflow);
    }
  }, [text, expandable, maxCollapsedHeight]);

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
      
      // Then split by Mentions
      const mentionParts = part.split(MENTION_REGEX);
      return mentionParts.map((mPart, k) => {
        if (mPart.match(MENTION_REGEX)) {
          const match = mPart.match(/^@\[([^\]]+)\]\(([^)]+)\)$/);
          if (match) {
            const displayName = match[1];
            const userId = match[2];
            return (
              <span
                key={`${i}-${k}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMentionClick) onMentionClick({ userId, displayName });
                }}
                className="text-primary font-bold cursor-pointer hover:underline"
              >
                @{displayName}
              </span>
            );
          }
        }
        
        // Finally split the remaining text by Hashtags
        const subParts = mPart.split(HASHTAG_REGEX);
        return subParts.map((subPart, j) => {
          if (subPart.match(HASHTAG_REGEX)) {
            return (
              <span 
                key={`${i}-${k}-${j}`} 
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
          return <span key={`${i}-${k}-${j}`}>{subPart}</span>;
        });
      });
    });
  }, [text, onHashtagClick, onMentionClick]);

  const isTruncated = expandable && canExpand && !isExpanded;

  return (
    <div className="relative">
      <div
        ref={contentRef}
        style={isTruncated ? { maxHeight: `${maxCollapsedHeight}px` } : undefined}
        className={`transition-all duration-300 relative ${
          isTruncated ? 'overflow-hidden' : ''
        }`}
      >
        <p className="text-gray-900 dark:text-gray-100 text-[15px] leading-relaxed whitespace-pre-wrap">
          {parsedContent}
        </p>

        {/* Render a link preview when expanded or when not truncated */}
        {!isTruncated && extractedUrls.length > 0 && (
          <LinkPreview url={extractedUrls[0]} />
        )}

        {/* Subtle gradient fade overlay when collapsed */}
        {isTruncated && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none" />
        )}
      </div>

      {/* "See more" / "See less" button */}
      {expandable && canExpand && (
        <div className="mt-1.5 flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-primary hover:text-primary-dark font-bold text-xs flex items-center gap-1 py-1 hover:underline cursor-pointer transition-colors"
          >
            <span>{isExpanded ? 'See less' : 'See more'}</span>
            <span className="text-[10px] transform transition-transform duration-200">
              {isExpanded ? '▲' : '▼'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useMemo } from 'react';
import { useUsersSearch } from '../hooks/useUsersSearch';

export default function MentionDropdown({ searchQuery, onSelect, position = 'bottom' }) {
  const { searchUsers, loading } = useUsersSearch();

  const matchedUsers = useMemo(() => {
    return searchUsers(searchQuery);
  }, [searchQuery, searchUsers]);

  if (loading) return null;
  if (matchedUsers.length === 0) return null;

  const positionClasses = position === 'top' 
    ? 'bottom-full mb-2 left-0' 
    : 'top-full mt-2 left-0';

  return (
    <div className={`absolute z-50 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden ${positionClasses}`}>
      <div className="max-h-48 overflow-y-auto py-1">
        {matchedUsers.map(user => (
          <button
            key={user.uid}
            onClick={(e) => {
              e.preventDefault();
              onSelect(user);
            }}
            className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="" 
              className="w-8 h-8 rounded-full object-cover shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {user.displayName}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

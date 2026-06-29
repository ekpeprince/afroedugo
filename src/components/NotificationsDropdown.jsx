import React, { useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationsDropdown({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead, clearNotification, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-900">Notifications {unreadCount > 0 && <span className="ml-1 bg-primary text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}</h3>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="max-h-96 overflow-y-auto no-scrollbar">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-3xl opacity-30 mb-2 block">🔔</span>
            <p className="text-gray-500 font-medium text-sm">No notifications yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <li 
                key={n.id} 
                className={`flex gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${!n.read ? 'bg-primary/5' : ''}`}
                onClick={() => {
                  if (!n.read) markAsRead(n.id);
                }}
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    {n.title}
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {n.createdAt?.toDate ? (() => {
                      const date = n.createdAt.toDate();
                      const now = new Date();
                      const diffMs = now - date;
                      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                      if (diffHrs < 1) return 'Just now';
                      if (diffHrs < 24) return `${diffHrs}h ago`;
                      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    })() : 'Just now'}
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); clearNotification(n.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  title="Clear"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

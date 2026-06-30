'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

export default function NotificationsClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    clearNotification, 
    markAllAsRead 
  } = useNotifications();

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      await markAsRead(n.id);
    }
    
    // Router redirect based on notification's link value
    if (n.link === 'community') {
      router.push('/community');
    } else if (n.link === 'profile') {
      router.push('/profile');
    } else if (n.link === 'housing') {
      router.push('/housing');
    } else if (n.link === 'schools') {
      router.push('/schools');
    } else if (n.link === 'services') {
      router.push('/services');
    } else if (n.link === 'chat') {
      router.push('/chat');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      const promises = notifications.map(n => clearNotification(n.id));
      await Promise.all(promises);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return { emoji: '❤️', bgColor: 'bg-red-50 dark:bg-red-500/10 text-red-500' };
      case 'reply':
      case 'comment':
        return { emoji: '💬', bgColor: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' };
      case 'status':
        return { emoji: '📋', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' };
      case 'chat':
        return { emoji: '✉️', bgColor: 'bg-primary/10 text-primary' };
      default:
        return { emoji: '🔔', bgColor: 'bg-gray-50 dark:bg-gray-800 text-gray-500' };
    }
  };

  const formatNotificationTime = (createdAt) => {
    if (!createdAt?.toDate) return 'Just now';
    const date = createdAt.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-5xl mb-4">🔔</span>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Join AfroEduGo</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6 font-medium text-sm">
          Log in to view and manage your community alerts, comment replies, and status updates.
        </p>
        <button
          onClick={() => router.push('/auth')}
          className="bg-primary hover:scale-105 active:scale-95 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg shadow-primary/20"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 flex flex-col pb-20">
      
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl z-20 px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/community')} 
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl transition-colors font-bold text-gray-700 dark:text-gray-300"
            title="Go Back"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-2.5 py-0.5 animate-pulse">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        {/* Global Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-black text-primary hover:underline px-3 py-2 rounded-xl hover:bg-primary/5 transition-all"
              >
                Mark all read
              </button>
            )}
            <button 
              onClick={handleClearAll}
              className="text-xs font-black text-gray-400 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all"
            >
              Clear all
            </button>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main className="flex-1 mt-20 p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin inline-block"></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-300">
            <span className="text-5xl mb-4 block">✨</span>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">All Caught Up!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              You don't have any notifications right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const iconData = getNotificationIcon(n.type);
              
              return (
                <div 
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`bg-white dark:bg-gray-900 p-4 rounded-3xl border transition-all flex gap-4 items-center cursor-pointer group relative ${
                    !n.read 
                      ? 'border-primary/20 shadow-md shadow-primary/5 bg-primary/[0.01]' 
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
                  }`}
                >
                  {/* Category Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${iconData.bgColor}`}>
                    {iconData.emoji}
                  </div>

                  {/* Message Details */}
                  <div className="flex-grow min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-ping"></span>
                      )}
                    </div>
                    <p className="text-gray-650 dark:text-gray-300 text-xs font-semibold leading-relaxed break-words">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block mt-1">
                      {formatNotificationTime(n.createdAt)}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(n.id);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-850 text-gray-450 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

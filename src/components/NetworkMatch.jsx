import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function NetworkMatch({ onStartChat, onViewProfile }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'));
        const snapshot = await getDocs(q);
        const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const matches = useMemo(() => {
    if (!profile || !user) return [];

    const myCountry = (profile.country || '').toLowerCase().trim();
    const mySchool = (profile.school || '').toLowerCase().trim();
    const myMajor = (profile.major || '').toLowerCase().trim();
    const myInterests = (profile.interests || []).map(i => i.toLowerCase().trim());

    const scoredUsers = users
      .filter(u => u.id !== user.uid) // Exclude self
      .map(u => {
        let score = 0;
        let reasons = [];

        const theirCountry = (u.country || '').toLowerCase().trim();
        const theirSchool = (u.school || '').toLowerCase().trim();
        const theirMajor = (u.major || '').toLowerCase().trim();
        const theirInterests = (u.interests || []).map(i => i.toLowerCase().trim());

        if (myCountry && myCountry === theirCountry) {
          score += 20;
          reasons.push('Same Country');
        }
        if (mySchool && mySchool === theirSchool) {
          score += 30;
          reasons.push('Same School');
        }
        if (myMajor && myMajor === theirMajor) {
          score += 30;
          reasons.push('Same Major');
        }

        const sharedInterests = myInterests.filter(i => theirInterests.includes(i));
        if (sharedInterests.length > 0) {
          score += 20; // Up to 20 points for interests
          reasons.push(`${sharedInterests.length} Shared Interest(s)`);
        }

        return { ...u, matchScore: score, matchReasons: reasons };
      });

    // Sort by score descending, then filter out 0 score if you want, but showing all is fine.
    return scoredUsers.sort((a, b) => b.matchScore - a.matchScore);
  }, [users, profile, user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile?.school && !profile?.major && !profile?.country) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-5xl mb-4">🎯</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Complete your profile to find matches</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
          Add your Country, School, and Major in your profile to discover students with similar backgrounds and interests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-primary font-bold text-lg">Your Network Matches</h2>
          <p className="text-primary/70 text-sm">We found these students based on your profile.</p>
        </div>
        <div className="text-3xl">🤝</div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-20 text-gray-400 font-bold">No other users found yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {matches.map(match => (
            <div key={match.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => onViewProfile(match)}
                  className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shrink-0 cursor-pointer hover:ring-2 ring-primary/50 transition-all"
                >
                  {match.photoURL ? (
                    <img src={match.photoURL} alt={match.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                      {match.displayName?.[0]?.toUpperCase() || '👤'}
                    </div>
                  )}
                </button>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start">
                    <button onClick={() => onViewProfile(match)} className="font-bold text-gray-900 dark:text-white truncate hover:underline text-left">
                      {match.displayName || 'Unknown User'}
                    </button>
                    {match.matchScore > 0 && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                        {match.matchScore}% Match
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {match.school || match.major || 'No school added'}
                  </p>
                  
                  {match.matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.matchReasons.map((r, i) => (
                        <span key={i} className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => onStartChat(match.id, match.displayName)}
                    className="w-full mt-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold text-xs py-2 rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    ✉️ Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

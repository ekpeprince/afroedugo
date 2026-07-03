import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// Simple hook to fetch and cache users for mention search
let cachedUsers = null;

export const useUsersSearch = () => {
  const [users, setUsers] = useState(cachedUsers || []);
  const [loading, setLoading] = useState(!cachedUsers);

  useEffect(() => {
    if (cachedUsers) return;

    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersList = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        cachedUsers = usersList;
        setUsers(usersList);
      } catch (err) {
        console.error("Failed to fetch users for search", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const searchUsers = (query) => {
    if (!query) return users.slice(0, 10);
    const lowerQuery = query.toLowerCase();
    return users
      .filter(u => u.displayName?.toLowerCase().includes(lowerQuery))
      .slice(0, 10); // return top 10 matches
  };

  return { users, loading, searchUsers };
};

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useFirestore = (collectionName, orderByField = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let q = collection(db, collectionName);
    
    if (orderByField) {
      q = query(q, orderBy(orderByField, 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = [];
      snapshot.docs.forEach(doc => {
        results.push({ ...doc.data(), id: doc.id });
      });
      setData(results);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, orderByField]);

  return { data, loading, error };
};

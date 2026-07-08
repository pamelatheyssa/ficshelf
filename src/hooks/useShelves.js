import { useState, useEffect } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, where, serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useShelves(userId) {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setShelves([]); setLoading(false); return; }
    const q = query(collection(db, 'shelves'), where('userId', '==', userId));
    const unsub = onSnapshot(q, (snap) => {
      setShelves(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR')));
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  const addShelf = (name, color = '#A78BFA') =>
    addDoc(collection(db, 'shelves'), { name, color, userId, createdAt: serverTimestamp() });

  const updateShelf = (id, data) =>
    updateDoc(doc(db, 'shelves', id), data);

  const deleteShelf = (id) =>
    deleteDoc(doc(db, 'shelves', id));

  return { shelves, loading, addShelf, updateShelf, deleteShelf };
}

import { useState, useEffect } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, where, serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFanfics(userId) {
  const [fanfics, setFanfics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setFanfics([]); setLoading(false); return; }
    const q = query(collection(db, 'fanfics'), where('userId', '==', userId));
    const unsub = onSnapshot(q, (snap) => {
      setFanfics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  const addFanfic = (data) =>
    addDoc(collection(db, 'fanfics'), { ...data, userId, createdAt: serverTimestamp() });

  const updateFanfic = (id, data) =>
    updateDoc(doc(db, 'fanfics', id), data);

  const deleteFanfic = (id) =>
    deleteDoc(doc(db, 'fanfics', id));

  const markAsRead = (id, rating, summary, wordCount, readDate, chapData, favorite) =>
    updateDoc(doc(db, 'fanfics', id), {
      status: 'read',
      rating: rating || null,
      summary: summary || '',
      wordCount: wordCount ? Number(wordCount) : null,
      readDate: readDate || null,
      chapters: chapData?.chapters || null,
      totalChapters: chapData?.totalChapters || null,
      totalChaptersUnknown: chapData?.totalChaptersUnknown || false,
      favorite: favorite || false,
      readAt: serverTimestamp(),
    });

  return { fanfics, loading, addFanfic, updateFanfic, deleteFanfic, markAsRead };
}

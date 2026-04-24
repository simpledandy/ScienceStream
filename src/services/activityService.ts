import { db, doc, setDoc, deleteDoc, getDoc, updateDoc, increment, serverTimestamp } from '../lib/firebase';

export const toggleLike = async (userId: string, songId: string) => {
  const likeRef = doc(db, 'users', userId, 'likes', songId);
  const songRef = doc(db, 'songs', songId);
  
  const likeSnap = await getDoc(likeRef);
  
  if (likeSnap.exists()) {
    // Unlike
    await deleteDoc(likeRef);
    await updateDoc(songRef, {
      likesCount: increment(-1)
    });
    return false;
  } else {
    // Like
    await setDoc(likeRef, {
      songId,
      createdAt: serverTimestamp()
    });
    await updateDoc(songRef, {
      likesCount: increment(1)
    });
    return true;
  }
};

export const checkIsLiked = async (userId: string, songId: string) => {
  const likeRef = doc(db, 'users', userId, 'likes', songId);
  const snap = await getDoc(likeRef);
  return snap.exists();
};

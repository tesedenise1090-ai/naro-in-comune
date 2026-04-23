import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  doc,
  getDocs
} from 'firebase/firestore';

export const NewsInteractionService = {

  // Subscribe to likes for a specific news item
  subscribeToLikes: (newsId: string | number, callback: (likesCount: number, userLikedLikeId: string | null) => void, userId?: string) => {
    const q = query(collection(db, 'news_likes'), where('newsId', '==', String(newsId)));
    
    return onSnapshot(q, (snapshot) => {
      const likesCount = snapshot.size;
      let userLikedLikeId: string | null = null;
      
      if (userId) {
        const userLikeDoc = snapshot.docs.find(d => d.data().userId === userId);
        if (userLikeDoc) {
          userLikedLikeId = userLikeDoc.id;
        }
      }
      
      callback(likesCount, userLikedLikeId);
    });
  },

  // Toggle like (add if doesn't exist, delete if exists)
  toggleLike: async (newsId: string | number, userId: string, existingLikeId: string | null) => {
    try {
      if (existingLikeId) {
        await deleteDoc(doc(db, 'news_likes', existingLikeId));
        return false; // Now unliked
      } else {
        await addDoc(collection(db, 'news_likes'), {
          newsId: String(newsId),
          userId: userId
        });
        return true; // Now liked
      }
    } catch (e) {
      console.error("Error toggling like:", e);
      throw e;
    }
  },

  // Subscribe to comments for a specific news item
  subscribeToComments: (newsId: string | number, callback: (comments: any[]) => void) => {
    const q = query(collection(db, 'news_comments'), where('newsId', '==', String(newsId)));
    
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort in JS because we might not have a composite index for newsId + createdAt
      comments.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeA - timeB; // Oldest first, we can reverse it in UI if needed
      });
      callback(comments);
    });
  },

  // Add a comment
  addComment: async (newsId: string | number, userId: string, userName: string, textContent: string) => {
    try {
      await addDoc(collection(db, 'news_comments'), {
        newsId: String(newsId),
        userId,
        userName,
        textContent,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error adding comment:", e);
      throw e;
    }
  }

};

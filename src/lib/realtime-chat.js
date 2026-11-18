import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "./firebase.js";

const CHAT_COLLECTION = "chat_messages";

/**
 * Subscribe to real-time chat messages from Firestore
 * Automatically triggers callback on any new message from any device.
 */
export function subscribeToMessages(callback, onError) {
  try {
    const q = query(
      collection(db, CHAT_COLLECTION),
      orderBy("createdAt", "asc"),
      limit(200)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            // Fallback for timestamps
            at: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.at || new Date().toISOString(),
          };
        });
        callback(msgs);
      },
      (err) => {
        console.warn("[Firebase] Firestore snapshot listener warning:", err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error("[Firebase] Subscription setup error:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Send a new real-time message to Firestore
 */
export async function sendRealtimeMessage({ text, authorId, authorName, authorPfp, replyTo = null }) {
  if (!text || !text.trim()) return null;
  const colRef = collection(db, CHAT_COLLECTION);
  return await addDoc(colRef, {
    text: text.trim(),
    authorId: authorId || "sin",
    authorName: authorName || "Sincere",
    authorPfp: authorPfp || "/pfp/guest.svg",
    replyTo: replyTo || null,
    reactions: [],
    createdAt: serverTimestamp(),
    at: new Date().toISOString(),
  });
}

/**
 * Toggle emoji reaction on a message
 */
export async function toggleRealtimeReaction(msgId, emoji, userKey = "you") {
  if (!msgId || !emoji) return;
  const docRef = doc(db, CHAT_COLLECTION, msgId);
  // We can update the reaction array
  // Local optimistic update or fetch-and-update
}

/**
 * Delete message from Firestore
 */
export async function deleteRealtimeMessage(msgId) {
  if (!msgId) return;
  const docRef = doc(db, CHAT_COLLECTION, msgId);
  return await deleteDoc(docRef);
}

import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { queueApprovalEmail, getGmailComposeUrl, getMailtoUrl, ADMIN_EMAIL } from "./email-service.js";

/**
 * Real-time listener for all registered users in Firestore
 */
export function subscribeToUsers(callback, onError) {
  try {
    const colRef = collection(db, "users");
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          docId: d.id,
          ...d.data(),
        }));
        callback(list);
      },
      (err) => {
        console.warn("[Admin] Users subscription warning:", err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error("[Admin] Setup error:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Approve a pending user account and queue approval notification email
 */
export async function approveUser({ username, displayName, email }) {
  if (!username) return;
  const clean = username.trim().toLowerCase();
  const userRef = doc(db, "users", clean);

  await updateDoc(userRef, {
    status: "approved",
    approved: true,
    approvedAt: new Date().toISOString(),
  });

  let gmailUrl = null;
  let mailtoUrl = null;

  if (email) {
    // 1. Queue in Firestore 'mail' collection (Firebase Trigger Email extension standard)
    await queueApprovalEmail({
      toEmail: email,
      toName: displayName || username,
      username: clean,
    });

    // 2. Generate direct 1-click Gmail and mailto links from tejjinsta003@gmail.com
    gmailUrl = getGmailComposeUrl({
      toEmail: email,
      toName: displayName || username,
      username: clean,
    });

    mailtoUrl = getMailtoUrl({
      toEmail: email,
      toName: displayName || username,
      username: clean,
    });
  }

  return {
    success: true,
    username: clean,
    email,
    gmailUrl,
    mailtoUrl,
  };
}

/**
 * Reject / Delete a user account
 */
export async function rejectUser(username) {
  if (!username) return;
  const clean = username.trim().toLowerCase();
  const userRef = doc(db, "users", clean);
  return await deleteDoc(userRef);
}

/**
 * Revoke approval for an existing user (moves back to pending)
 */
export async function revokeUser(username) {
  if (!username) return;
  const clean = username.trim().toLowerCase();
  const userRef = doc(db, "users", clean);
  return await updateDoc(userRef, {
    status: "pending",
    approved: false,
    revokedAt: new Date().toISOString(),
  });
}

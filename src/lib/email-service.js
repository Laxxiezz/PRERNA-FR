import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

export const ADMIN_EMAIL = "tejjinsta003@gmail.com";

/**
 * Generate a prefilled direct Gmail compose URL so Tej can send from tejjinsta003@gmail.com in 1 click
 */
export function getGmailComposeUrl({ toEmail, toName, username, siteUrl }) {
  const origin = siteUrl || (typeof window !== "undefined" ? window.location.origin : "https://imreallysorry.vercel.app");
  const subject = `✨ Access Approved — Welcome to Meri Duniya ❤️`;
  const body = `Hey ${toName || username} 🌸,

Great news! Tej has reviewed and approved your access request for account @${username}.

Welcome to Meri Duniya ✨ — our private space crafted with secret letters, photo memories, interactive magic surprises, and live chat.

Your Account Details:
• User ID: @${username}
• Password: (The one you set during registration)

Click here to unlock and enter:
${origin}

See you inside!

With warmth,
Tej ⚡
(${ADMIN_EMAIL})`;

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Generate a standard mailto: link
 */
export function getMailtoUrl({ toEmail, toName, username, siteUrl }) {
  const origin = siteUrl || (typeof window !== "undefined" ? window.location.origin : "https://imreallysorry.vercel.app");
  const subject = `✨ Access Approved — Welcome to Meri Duniya ❤️`;
  const body = `Hey ${toName || username} 🌸,\n\nGreat news! Tej has reviewed and approved your access request for account @${username}.\n\nWelcome to Meri Duniya ✨ — our private space.\n\nLogin URL: ${origin}\nUser ID: @${username}\n\nSee you inside!\n\nWarm regards,\nTej (${ADMIN_EMAIL})`;

  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Queue approval email in Firestore 'mail' collection (Firebase Trigger Email Extension standard)
 */
export async function queueApprovalEmail({ toEmail, toName, username, siteUrl }) {
  if (!toEmail) return null;
  const origin = siteUrl || (typeof window !== "undefined" ? window.location.origin : "https://imreallysorry.vercel.app");

  try {
    const colRef = collection(db, "mail");
    return await addDoc(colRef, {
      to: [toEmail],
      from: ADMIN_EMAIL,
      replyTo: ADMIN_EMAIL,
      message: {
        subject: `✨ Access Approved — Welcome to Meri Duniya ❤️`,
        text: `Hey ${toName || username} 🌸,\n\nGreat news! Tej has approved your account (@${username}).\n\nWelcome to Meri Duniya ✨ — you can now log in using your ID and password:\n${origin}\n\nWarm regards,\nTej (${ADMIN_EMAIL})`,
        html: `
          <div style="background-color: #060204; padding: 36px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 520px; margin: 0 auto; background: linear-gradient(165deg, #1a0610 0%, #090205 100%); border: 1px solid rgba(225, 29, 72, 0.35); border-radius: 24px; padding: 36px 28px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(225, 29, 72, 0.18); color: #ffffff;">
              
              <!-- Top Glowing Badge -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; background: radial-gradient(circle, rgba(225, 29, 72, 0.35) 0%, rgba(15, 3, 7, 0.9) 70%); border: 1.5px solid rgba(244, 63, 94, 0.6); box-shadow: 0 0 25px rgba(225, 29, 72, 0.45); font-size: 28px;">
                  🌸
                </div>
                <div style="margin-top: 14px;">
                  <span style="display: inline-block; padding: 4px 14px; border-radius: 999px; background: rgba(225, 29, 72, 0.15); border: 1px solid rgba(244, 63, 94, 0.35); color: #fda4af; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">
                    Access Approved
                  </span>
                </div>
                <h1 style="font-size: 26px; font-weight: 600; color: #fff1f2; margin: 12px 0 6px; letter-spacing: -0.01em;">
                  Welcome to Meri Duniya ✨
                </h1>
                <p style="color: rgba(255, 220, 230, 0.65); font-size: 14px; margin: 0;">
                  Your private door has been unlocked by Tej
                </p>
              </div>

              <!-- Main Card Body -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(225, 29, 72, 0.18); border-radius: 16px; padding: 22px; margin-bottom: 24px;">
                <p style="font-size: 15px; color: #ffe4e6; margin: 0 0 12px; line-height: 1.6;">
                  Hey <strong>${toName || username}</strong>,
                </p>
                <p style="font-size: 14px; color: rgba(255, 235, 245, 0.85); margin: 0 0 16px; line-height: 1.6;">
                  Tej has approved your request. You can now explore the secret letters, live chat, photo memories, and the interactive magic vault!
                </p>
                
                <!-- Account Info Box -->
                <div style="background: rgba(12, 3, 6, 0.7); border-radius: 12px; padding: 14px 18px; border: 1px solid rgba(255, 255, 255, 0.08); font-size: 13px;">
                  <div style="margin-bottom: 8px; color: rgba(255, 255, 255, 0.85);">
                    <span style="color: rgba(255, 255, 255, 0.45); display: inline-block; width: 80px;">User ID:</span>
                    <strong style="color: #fca5a5; font-family: monospace;">@${username}</strong>
                  </div>
                  <div style="color: rgba(255, 255, 255, 0.85);">
                    <span style="color: rgba(255, 255, 255, 0.45); display: inline-block; width: 80px;">Status:</span>
                    <span style="color: #34d399; font-weight: 600;">Active & Approved ✅</span>
                  </div>
                </div>
              </div>

              <!-- Call to Action Button -->
              <div style="text-align: center; margin: 30px 0 24px;">
                <a href="${origin}" style="display: inline-block; padding: 14px 36px; border-radius: 999px; background: linear-gradient(135deg, #e11d48 0%, #be123c 50%, #881337 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.03em; box-shadow: 0 8px 24px rgba(225, 29, 72, 0.5);">
                  ✨ Enter Meri Duniya →
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.45); line-height: 1.5;">
                <p style="margin: 0 0 4px;">Sent with warmth from <strong>Tej</strong></p>
                <p style="margin: 0; color: #fda4af;">${ADMIN_EMAIL}</p>
              </div>

            </div>
          </div>
        `,
      },
      createdAt: serverTimestamp(),
      status: "pending",
    });
  } catch (err) {
    console.warn("Queue email in Firestore warning:", err);
    return null;
  }
}

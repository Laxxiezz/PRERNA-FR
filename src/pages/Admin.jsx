import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, ACCOUNTS } from "../lib/AuthContext.jsx";
import { subscribeToUsers, approveUser, rejectUser, revokeUser } from "../lib/admin.js";
import { ADMIN_EMAIL, getGmailComposeUrl } from "../lib/email-service.js";
import ParticleBackground from "../components/ParticleBackground.jsx";
import SideNav from "../components/SideNav.jsx";
import "../styles/admin.css";

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4500);
  };

  useEffect(() => {
    const unsub = subscribeToUsers((list) => {
      setUsers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <ParticleBackground subtle />
        <SideNav />
        <div className="admin-restricted-card">
          <div className="admin-lock-ring">🔒</div>
          <h2>Restricted Access</h2>
          <p>This portal is reserved for Tej to review and approve access requests.</p>
          <button type="button" className="admin-btn-back" onClick={() => navigate("/chat")}>
            Return to Chat →
          </button>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter((u) => u.status === "pending" || u.approved === false);
  const approvedUsers = users.filter((u) => u.status === "approved" || u.approved === true);

  const handleApprove = async (userObj) => {
    const { username, displayName, email } = userObj;
    setActionId(username);
    try {
      const res = await approveUser({ username, displayName, email });
      if (email && res?.gmailUrl) {
        // Automatically open prefilled Gmail window from tejjinsta003@gmail.com
        window.open(res.gmailUrl, "_blank", "noopener,noreferrer");
        showToast(`✅ Approved & opened Gmail to notify ${email}!`);
      } else {
        showToast(`✅ Approved access for ${displayName || username}!`);
      }
    } catch (err) {
      showToast("❌ Failed to approve: " + err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (username, displayName) => {
    if (!confirm(`Are you sure you want to reject @${username}?`)) return;
    setActionId(username);
    try {
      await rejectUser(username);
      showToast(`Rejected request for ${displayName || username}.`);
    } catch (err) {
      showToast("❌ Failed to reject: " + err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleRevoke = async (username, displayName) => {
    if (!confirm(`Revoke access for @${username}? They won't be able to log in until approved again.`)) return;
    setActionId(username);
    try {
      await revokeUser(username);
      showToast(`Revoked access for ${displayName || username}.`);
    } catch (err) {
      showToast("❌ Failed to revoke: " + err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="admin-page">
      <ParticleBackground subtle />
      <SideNav />

      <main className="admin-container">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-title">
            <span className="admin-badge">🛡️ Admin Portal</span>
            <h1>Access Approvals</h1>
            <p className="admin-subtitle">
              Manage permission requests. When you approve a visitor, a notification is queued and Gmail is opened from <code>{ADMIN_EMAIL}</code> so they know they can log in.
            </p>
          </div>

          <div className="admin-header-actions">
            <Link to="/chat" className="admin-pill-link">
              💬 Go to Chat
            </Link>
          </div>
        </header>

        {toast && <div className="admin-toast">{toast}</div>}

        {/* Pending Requests Section */}
        <section className="admin-section">
          <div className="admin-section-header">
            <h2>
              ⏳ Pending Requests
              <span className={`admin-counter ${pendingUsers.length > 0 ? "has-pending" : ""}`}>
                {pendingUsers.length}
              </span>
            </h2>
            <span className="admin-section-sub">Users waiting for your approval to enter</span>
          </div>

          {loading ? (
            <div className="admin-empty-state">Connecting to Cloud Firestore...</div>
          ) : pendingUsers.length === 0 ? (
            <div className="admin-empty-state">
              <span className="empty-icon">✨</span>
              <p>No pending access requests. All caught up!</p>
            </div>
          ) : (
            <div className="admin-grid">
              {pendingUsers.map((u) => (
                <div key={u.docId || u.username} className="admin-user-card is-pending">
                  <div className="user-card-head">
                    <img src={u.pfp || "/pfp/guest.svg"} alt="" className="user-card-pfp" />
                    <div className="user-card-meta">
                      <strong className="user-card-name">{u.displayName || u.username}</strong>
                      <span className="user-card-handle">@{u.username}</span>
                      <span className="user-card-house">{u.house || "Gryffindor"}</span>
                    </div>
                  </div>

                  {u.email && (
                    <div className="user-card-email-box">
                      <span className="email-label">Notification Email:</span>
                      <span className="email-val">✉️ {u.email}</span>
                    </div>
                  )}

                  <div className="user-card-date">
                    Requested: {u.createdAt ? new Date(u.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now"}
                  </div>

                  <div className="user-card-actions">
                    <button
                      type="button"
                      className="admin-btn approve-btn"
                      disabled={actionId === u.username}
                      onClick={() => handleApprove(u)}
                    >
                      {actionId === u.username ? "Approving..." : "✅ Approve & Notify"}
                    </button>
                    <button
                      type="button"
                      className="admin-btn reject-btn"
                      disabled={actionId === u.username}
                      onClick={() => handleReject(u.username, u.displayName)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Members Section */}
        <section className="admin-section">
          <div className="admin-section-header">
            <h2>
              👥 Approved Members
              <span className="admin-counter">{approvedUsers.length + ACCOUNTS.length}</span>
            </h2>
            <span className="admin-section-sub">People with active access to the website</span>
          </div>

          <div className="admin-grid">
            {/* Founders / Core Accounts */}
            {ACCOUNTS.map((acc) => (
              <div key={acc.username} className="admin-user-card is-founder">
                <div className="user-card-head">
                  <img src={acc.pfp} alt="" className="user-card-pfp" />
                  <div className="user-card-meta">
                    <strong className="user-card-name">{acc.displayName}</strong>
                    <span className="user-card-handle">@{acc.username}</span>
                    <span className="user-card-tag">{acc.role === "admin" ? "⚡ Admin / Owner" : "🌸 Core Member"}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Approved Registered Cloud Users */}
            {approvedUsers.map((u) => (
              <div key={u.docId || u.username} className="admin-user-card is-approved">
                <div className="user-card-head">
                  <img src={u.pfp || "/pfp/guest.svg"} alt="" className="user-card-pfp" />
                  <div className="user-card-meta">
                    <strong className="user-card-name">{u.displayName || u.username}</strong>
                    <span className="user-card-handle">@{u.username}</span>
                    <span className="user-card-house">{u.house || "Member"}</span>
                  </div>
                </div>

                {u.email && (
                  <div className="user-card-email-box">
                    <span className="email-val">✉️ {u.email}</span>
                  </div>
                )}

                <div className="user-card-actions">
                  {u.email && (
                    <a
                      href={getGmailComposeUrl({ toEmail: u.email, toName: u.displayName, username: u.username })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn email-btn"
                      title={`Send email from ${ADMIN_EMAIL}`}
                    >
                      ✉️ Open Mail
                    </a>
                  )}
                  <button
                    type="button"
                    className="admin-btn revoke-btn"
                    disabled={actionId === u.username}
                    onClick={() => handleRevoke(u.username, u.displayName)}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

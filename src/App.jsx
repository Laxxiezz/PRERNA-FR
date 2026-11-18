import { useCallback, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ParticleBackground from "./components/ParticleBackground.jsx";
import HeartIntro from "./components/HeartIntro.jsx";
import ApologyEngine from "./components/ApologyEngine.jsx";
import FinalScreen from "./components/FinalScreen.jsx";
import SideNav from "./components/SideNav.jsx";
import { AuthProvider, useAuth } from "./lib/AuthContext.jsx";
import LoginModal from "./components/LoginModal.jsx";

// Route-level code splitting: pages load on-demand, keeping landing & blast animations silky smooth
const Home = lazy(() => import("./pages/Home.jsx"));
const FullLetter = lazy(() => import("./pages/FullLetter.jsx"));
const NewMsgs = lazy(() => import("./pages/NewMsgs.jsx"));
const Chat = lazy(() => import("./pages/Chat.jsx"));
const Memories = lazy(() => import("./pages/Memories.jsx"));
const Icons = lazy(() => import("./pages/Icons.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));

function Experience() {
  const [phase, setPhase] = useState("heart"); // heart | messages
  const [finished, setFinished] = useState(false);
  const [key, setKey] = useState(0);
  const [burst, setBurst] = useState(0);

  const handleEnter = useCallback(() => {
    setBurst((b) => b + 1);
    setPhase("messages");
  }, []);

  const handleComplete = useCallback(() => {
    setFinished(true);
  }, []);

  const handleReplay = useCallback(() => {
    setFinished(false);
    setPhase("heart");
    setKey((k) => k + 1);
  }, []);

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <ParticleBackground burst={burst} subtle={finished} />
      <SideNav />

      {phase === "heart" && <HeartIntro key={`heart-${key}`} onEnter={handleEnter} />}

      {phase === "messages" && (
        <main id="main" className="engine-host">
          <ApologyEngine key={`engine-${key}`} onComplete={handleComplete} />
        </main>
      )}

      {finished && <FinalScreen />}

      {finished && (
        <div className="replay-wrap" role="status" aria-live="polite" style={{ bottom: "86px" }}>
          <button type="button" className="replay-btn" onClick={handleReplay} aria-label="Replay from the beginning">
            replay
          </button>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <Suspense fallback={<div className="page-lazy-loader" aria-hidden="true" />}>
      <Routes>
        <Route path="/" element={<Experience />} />
        <Route path="/home" element={<Home />} />
        <Route path="/full-letter" element={<FullLetter />} />
        <Route path="/new-msgs" element={<NewMsgs />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/memories" element={<Memories />} />
        <Route path="/icons" element={<Icons />} />
        <Route path="/admin" element={<Admin />} />
        {/* fallback — any unknown goes to experience */}
        <Route path="*" element={<Experience />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

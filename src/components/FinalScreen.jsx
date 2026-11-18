import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GravityLetters from "./GravityLetters.jsx";

export default function FinalScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Reveal smoothly right after the last message fades out
    const id = window.setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={`final-screen ${visible ? "is-visible" : ""}`} aria-live="polite">
      {/* Gravity Letters: interactive slice, shatter & sand pour headline */}
      <div className="final-gravity-letters">
        <GravityLetters
          text="Your Tejuuu"
          colors={["#FFFFFF", "#7c08d5ff"]}
          grainSize={6}
          anchor="top"
        />
      </div>

      <Link to="/full-letter" className="full-letter-link" aria-label="Read the full letter">
        Read the full letter
      </Link>
    </div>
  );
}

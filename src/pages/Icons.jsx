import { useState } from "react";
import SideNav from "../components/SideNav.jsx";
import ParticleBackground from "../components/ParticleBackground.jsx";
import ScratchCard from "../components/ScratchCard.jsx";
import LumosChamber from "../components/LumosChamber.jsx";
import { Sparkles, Wand2, Ticket } from "lucide-react";
import "../styles/scratch-magic.css";

export default function Icons() {
  const [activeTab, setActiveTab] = useState("scratch"); // "scratch" | "lumos"

  return (
    <div className="magic-vault-page">
      <ParticleBackground subtle />
      <SideNav />

      <main className="magic-vault-container">
        {/* Header */}
        <header className="vault-header">
          <span className="vault-badge-pill">
            <Sparkles size={13} /> Interactive Keepsake
          </span>
          <h1>The Magic Vault</h1>
          <p className="vault-subtitle">
            A private chamber crafted with interactive surprises, secret scratch cards, and Hogwarts spells — just for you.
          </p>
        </header>

        {/* Mode Switch Tabs */}
        <nav className="vault-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "scratch"}
            className={`vault-tab-btn ${activeTab === "scratch" ? "is-active" : ""}`}
            onClick={() => setActiveTab("scratch")}
          >
            <Ticket size={16} /> Secret Scratch Cards
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "lumos"}
            className={`vault-tab-btn ${activeTab === "lumos" ? "is-active" : ""}`}
            onClick={() => setActiveTab("lumos")}
          >
            <Wand2 size={16} /> Lumos Wand Chamber
          </button>
        </nav>

        {/* Tab 1: Secret Scratch Cards */}
        {activeTab === "scratch" && (
          <section className="scratch-section">
            <div className="scratch-grid">
              {/* Card 1: Rose Gold Note */}
              <ScratchCard
                id="card-1"
                badge="Secret Note"
                title="A Gentle Reminder"
                foilTitle="Scratch with finger ✨"
                foilTheme="rose"
              >
                <span className="scratch-card-icon">🌸</span>
                <p className="scratch-card-text">
                  You have this rare, pure warmth that makes difficult days softer and ordinary moments special.
                  Don't ever let anything dull your genuine heart. You are deeply cherished.
                </p>
                <span className="scratch-voucher-tag">💌 FROM TEJ • ALWAYS</span>
              </ScratchCard>

              {/* Card 2: Crimson Velvet Voucher */}
              <ScratchCard
                id="card-2"
                badge="Official Voucher"
                title="2 AM Rants & Hug Pass"
                foilTitle="Scratch for Voucher 🎟️"
                foilTheme="crimson"
              >
                <span className="scratch-card-icon">🎧</span>
                <p className="scratch-card-text">
                  Redeemable anytime: Valid for 2 AM calls, endless listening with zero judgment, and having someone
                  in your corner no matter what. Non-transferable!
                </p>
                <span className="scratch-voucher-tag">🎟️ LIFETIME VALIDITY • 24/7</span>
              </ScratchCard>

              {/* Card 3: Golden Treat Coupon */}
              <ScratchCard
                id="card-3"
                badge="Special Coupon"
                title="Coffee & Favorite Dessert"
                foilTitle="Scratch for Treat 🍰"
                foilTheme="gold"
              >
                <span className="scratch-card-icon">☕</span>
                <p className="scratch-card-text">
                  Next time you have a tiring day or craving: Your favorite coffee + dessert, completely sponsored by me.
                  No debate allowed, you just pick the place!
                </p>
                <span className="scratch-voucher-tag">🍰 100% REDEEMABLE ANYTIME</span>
              </ScratchCard>

              {/* Card 4: Silver Hogwarts Charm */}
              <ScratchCard
                id="card-4"
                badge="Hogwarts Charm"
                title="The Lumos Promise"
                foilTitle="Scratch for Magic ⚡"
                foilTheme="silver"
              >
                <span className="scratch-card-icon">⚡</span>
                <p className="scratch-card-text">
                  "Happiness can be found even in the darkest of times, if one only remembers to turn on the light."
                  Whenever life feels heavy, remember you never have to walk in the dark alone.
                </p>
                <span className="scratch-voucher-tag">✨ ALWAYS • MISCHIEF MANAGED</span>
              </ScratchCard>
            </div>
          </section>
        )}

        {/* Tab 2: Lumos Chamber */}
        {activeTab === "lumos" && <LumosChamber />}
      </main>
    </div>
  );
}

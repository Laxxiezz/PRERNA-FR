import { useMemo, useState, useCallback } from "react";
import { ArrowLeft, Camera, Check, Compass, Heart, LockKeyhole, Sparkles, Eye, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import SideNav from "../components/SideNav.jsx";
import ParticleBackground from "../components/ParticleBackground.jsx";
import CelebrationCursor from "../components/CelebrationCursor.jsx";
import LoveCounter from "../components/LoveCounter.jsx";
import { memories } from "../data/memories.js";
import { videoMemoriesByTargetId } from "../data/video-memories.js";
import MiniMemoryVideo from "../components/MiniMemoryVideo.jsx";
import MemoryLightboxModal from "../components/MemoryLightboxModal.jsx";
import "../styles/memories.css";

const categoryCopy = {
  Pyaaari: "the soft, silly pieces that somehow say the most",
  Lovelyy: "the quiet little moments worth finding again",
  Kahheir: "pretty things that refused to be forgotten",
  Kaatil: "the looks that need absolutely no explanation",
  Noor: "a little extra glow, hidden in plain sight",
  "Real 💗": "the unfiltered bits — exactly as they were",
  Family: "the people who quietly belong to the story",
  "Peeru's bachpan": "tiny-you, old memories, permanent evidence",
  Mahendi: "little details, little art, little chaos",
  FOOD: "because apparently memories need snacks",
  Books: "things that belong on the shelf and in the story",
  Words: "screenshots that somehow became keepsakes",
  "House Blueprint": "future plans drawn before they existed",
  "Phool with Flower": "small beautiful things, caught at the right moment",
  Taaatoos: "random details that deserved to survive",
  Aankhhe: "one tiny detail that says enough",
  "Chaats SS": "proof that conversations become memories too",
};

const noteBank = [
  "You probably walked past this one once. I didn't.",
  "A tiny moment. Somehow it stayed.",
  "This one has no explanation. It just feels like you.",
  "If you found this, you were paying attention.",
  "Not everything important looks important at first.",
  "I kept this because the feeling was bigger than the photo.",
  "Some memories don't ask to be remembered. They just are.",
  "This was ordinary then. It isn't ordinary to me now.",
  "A little piece of a day I would happily replay.",
  "There is more here than the picture is willing to tell you.",
  "Found you. Or maybe you found this memory.",
  "This one belongs in the quiet corner of the heart.",
  "No grand story. Just a moment I didn't want to lose.",
  "Keep looking. The best things are rarely announced.",
  "I could explain this one. I would rather let it stay a feeling.",
  "Somewhere between a normal day and a forever memory.",
  "This is your reminder that little things count.",
  "The camera caught the picture. It didn't catch everything else.",
  "A secret hiding in plain sight.",
  "This one made the archive for a reason.",
  "If memories had fingerprints, this one would be unmistakable.",
  "One more tiny piece of the story.",
  "There are days I remember because of moments exactly like this.",
  "I like this one more than I can reasonably explain.",
  "A photograph, with a little bit of unfinished feeling attached.",
  "This is the kind of ordinary I would choose again.",
  "You found another one. Don't get too confident.",
  "Somewhere in here is a version of us I never want to forget.",
  "This little square holds more than it should.",
  "No clue why this one matters. It just does.",
  "A soft reminder: the small moments were never actually small.",
  "This one can stay between us.",
  "You weren't supposed to find this so quickly.",
  "There is a whole story hiding behind this frame.",
  "The details are the part I remember most.",
  "One of those moments that quietly became important.",
  "I saved the picture. The feeling saved itself.",
  "This is what a memory looks like before it becomes nostalgia.",
  "A little evidence that beautiful days can be messy too.",
  "Found another. Keep going.",
  "This one deserves a tiny pause.",
  "If you smile at this, the note did its job.",
  "Some pictures are timestamps for feelings.",
  "This memory has no expiry date.",
  "A small thing I would still choose to keep.",
  "Nothing dramatic. Just something worth keeping close.",
  "The best archives are slightly chaotic.",
  "This one was hiding because it likes attention only after being found.",
  "A quiet little hello from another day.",
  "This is your clue that there are still more.",
  "A memory doesn't need to be perfect to be precious.",
  "This one carries its own little atmosphere.",
  "The photo is here. The rest is yours to remember.",
  "Another ordinary moment that somehow became ours.",
  "I left this here because it felt right.",
  "There is always one more thing worth noticing.",
  "A tiny bookmark in a much bigger story.",
  "This one belongs exactly where you found it.",
  "Some things are better discovered than explained.",
  "You found the hidden line. Now look at the photo again.",
  "A little chaos. A little beauty. Very on brand.",
  "This is one of the reasons the archive exists.",
  "A quiet memory wearing a loud little disguise.",
  "If this could talk, it would probably tease you first.",
  "This one survived the delete button. That says enough.",
  "A small piece of a much longer story.",
  "The clue was never really the clue. The feeling was.",
  "One last thing: don't rush past the next one.",
  "You made it here. Keep the little things.",
];

const chapterOrder = [
  "Lovelyy", "Noor", "Words", "Peeru's bachpan", "Phool with Flower", "Kahheir",
  "Taaatoos", "Chaats SS", "Kaatil", "Real 💗", "Aankhhe", "Family",
  "Pyaaari", "FOOD", "House Blueprint", "Mahendi", "Books",
];

const gardenDecor = ["♡", "✿", "୨୧", "✦", "❀", "˖", "☼", "♡", "✧", "❁"];

function getNote(item, index) {
  return noteBank[(index * 7 + item.label.length * 3) % noteBank.length];
}

function DoodleField() {
  return (
    <div className="memory-doodle-field" aria-hidden="true">
      <span className="doodle-float d1">♡</span>
      <span className="doodle-float d2">✦</span>
      <span className="doodle-float d3">↝</span>
      <span className="doodle-float d4">˚</span>
      <span className="doodle-float d5">❀</span>
      <span className="doodle-word w1">look closer</span>
      <span className="doodle-word w2">psst…</span>
      <span className="doodle-word w3">something tiny is hiding here</span>
    </div>
  );
}

function GardenDecor({ index }) {
  return (
    <div className={`garden-decor decor-${index % 6}`} aria-hidden="true">
      <span className="garden-bow">୨୧</span>
      <span className="garden-flower">{gardenDecor[index % gardenDecor.length]}</span>
      <span className="garden-sparkle">✦</span>
      <span className="garden-dash">— ♡ —</span>
    </div>
  );
}

function HiddenPhoto({ item, index, found, onFind, onZoom }) {
  const note = getNote(item, index);
  const tilt = ((index * 13) % 7) - 3;
  const orientation = item.orientation || "portrait";

  const handleCardClick = () => {
    if (!found) {
      onFind(item.id);
    } else if (onZoom) {
      onZoom(item, note);
    }
  };

  return (
    <article
      className={`hunt-card ori-${orientation} hunt-${index % 6} ${found ? "is-found" : ""}`}
      style={{ "--tilt": `${tilt}deg` }}
    >
      <div className="hunt-pin" aria-hidden="true" />
      <div className="photo-sticker sticker-left" aria-hidden="true">♡</div>
      <div className="photo-sticker sticker-right" aria-hidden="true">✦</div>

      <button
        type="button"
        className="hunt-photo-button"
        onClick={handleCardClick}
        aria-label={found ? `View full memory for ${item.label}` : `Discover hidden memory ${index + 1}`}
      >
        <span className="hunt-photo-frame">
          <span className="photo-washi washi-top" aria-hidden="true" />
          <span className="photo-washi washi-side" aria-hidden="true" />
          <img
            src={item.src}
            alt={item.alt || item.label}
            loading="lazy"
            decoding="async"
            className="hunt-img"
          />

          {!found && (
            <span className="hunt-cover">
              <span className="cover-heart">♡</span>
              <LockKeyhole size={17} />
              <small>open this little secret</small>
              <i>tap to peek</i>
            </span>
          )}

          <span className="hunt-sheen" />
        </span>
      </button>

      <div className="photo-caption">
        <span className="caption-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="caption-line" />
        <span className="caption-label">{item.label}</span>
        {found ? <Check size={13} className="found-check" /> : <Sparkles size={12} />}
      </div>

      <div className={`hidden-note ${found ? "visible" : ""}`} aria-live="polite">
        <span className="note-tape" aria-hidden="true" />
        <span className="note-heart">♡</span>
        <p>{note}</p>
        <small>{found ? "memory unlocked · tap photo to zoom" : "there's something here"}</small>
      </div>
    </article>
  );
}

export default function Memories() {
  const [active, setActive] = useState("All");
  const [found, setFound] = useState(() => new Set());
  const [modalData, setModalData] = useState(null); // { item, isVideo, note, index }

  const filtered = useMemo(
    () => active === "All" ? memories : memories.filter((item) => item.label === active),
    [active]
  );

  const categories = useMemo(
    () => chapterOrder.filter((cat) => memories.some((m) => m.label === cat)),
    []
  );

  const discover = (id) => {
    setFound((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  const revealAll = () => {
    setFound(new Set(memories.map((m) => m.id)));
  };

  const reset = () => setFound(new Set());

  const openPhotoModal = (item, note) => {
    const idx = memories.findIndex((m) => m.id === item.id);
    setModalData({
      item,
      isVideo: false,
      note,
      index: idx,
    });
  };

  const openVideoModal = (video) => {
    setModalData({
      item: video,
      isVideo: true,
      note: video.caption || "A living memory preserved in motion.",
      index: -1,
    });
  };

  const closeModal = () => setModalData(null);

  const handleNext = useCallback(() => {
    if (!modalData || modalData.index === -1) return;
    const nextIdx = (modalData.index + 1) % memories.length;
    const nextItem = memories[nextIdx];
    const nextNote = getNote(nextItem, nextIdx);
    setModalData({
      item: nextItem,
      isVideo: false,
      note: nextNote,
      index: nextIdx,
    });
  }, [modalData]);

  const handlePrev = useCallback(() => {
    if (!modalData || modalData.index === -1) return;
    const prevIdx = (modalData.index - 1 + memories.length) % memories.length;
    const prevItem = memories[prevIdx];
    const prevNote = getNote(prevItem, prevIdx);
    setModalData({
      item: prevItem,
      isVideo: false,
      note: prevNote,
      index: prevIdx,
    });
  }, [modalData]);

  return (
    <div className="memories-page hunt-page">
      <CelebrationCursor
        particleSize={24}
        burstCount={22}
        spillInterval={45}
      />
      <ParticleBackground subtle />
      <SideNav />
      <DoodleField />

      <main className="memories-shell">
        <header className="hunt-hero">
          <Link to="/home" className="back-link">
            <ArrowLeft size={16} /> back to our space
          </Link>
          <p className="memory-kicker">
            <Compass size={14} /> a tiny memory garden
          </p>
          <h1>
            Some memories<br />
            <em>grow quietly.</em>
          </h1>
          <p className="hero-lede">
            I didn't want to put everything in a gallery. So I left little pieces along a winding path instead.
            Look around, open the tiny secrets, and hover over motion keepsakes to hear their voices.
          </p>

          <div className="hunt-status">
            <div className="hunt-progress">
              <span>
                <strong>{found.size}</strong> / {memories.length} little keepsakes found
              </span>
              <div className="progress-track">
                <span style={{ width: `${(found.size / memories.length) * 100}%` }} />
              </div>
            </div>
            <span className="hunt-whisper">take your time ♡</span>
          </div>
        </header>

        {/* Instructions Bar with Peek All & Reset */}
        <section className="hunt-instructions">
          <div className="instruction-icon">
            <Camera size={18} />
          </div>
          <div className="instruction-text">
            <strong>Walk slowly along the path</strong>
            <p>
              Photos are tucked along the path. <b>Tap a photo</b> to open its secret note. <b>Hover over mini video frames</b> to hear their voice.
            </p>
          </div>
          <div className="instruction-actions">
            {found.size < memories.length && (
              <button type="button" onClick={revealAll} className="peek-all-btn">
                <Eye size={13} /> peek all
              </button>
            )}
            {found.size > 0 && (
              <button type="button" onClick={reset} className="reset-hunt">
                <RotateCcw size={13} /> start again
              </button>
            )}
          </div>
        </section>

        {/* Love Counter */}
        <section className="hunt-counter">
          <LoveCounter />
        </section>

        {/* Chapter Navigation Filter */}
        <nav className="hunt-chapters" aria-label="Jump to memory chapter">
          <button
            className={active === "All" ? "active" : ""}
            onClick={() => setActive("All")}
          >
            all memories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={active === cat ? "active" : ""}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* The Winding Memory Scrapbook Path */}
        <div className="hunt-map">
          <div className="hunt-thread" aria-hidden="true" />

          {filtered.map((item, index) => {
            const globalIndex = memories.findIndex((m) => m.id === item.id);
            const chapterChanged =
              active === "All" && index > 0 && filtered[index - 1].label !== item.label;
            const videoItem = videoMemoriesByTargetId[item.id];

            return (
              <div className="hunt-row" key={item.id}>
                {chapterChanged && (
                  <div className="chapter-divider">
                    <span className="divider-bow">୨୧</span>
                    <span>{item.label}</span>
                    <i>{categoryCopy[item.label] || "another little chapter"}</i>
                  </div>
                )}
                {index === 0 && (
                  <div className="chapter-divider first-divider">
                    <span className="divider-bow">୨୧</span>
                    <span>{item.label}</span>
                    <i>{categoryCopy[item.label] || "the first little chapter"}</i>
                  </div>
                )}

                {/* Organic Video Slot (Placed in the empty space opposite the photo!) */}
                {videoItem && (
                  <MiniMemoryVideo
                    video={videoItem}
                    onExpand={openVideoModal}
                  />
                )}

                {/* Scrapbook Decor */}
                <GardenDecor index={globalIndex} />

                {/* The Photo Keepsake Card */}
                <HiddenPhoto
                  item={item}
                  index={globalIndex}
                  found={found.has(item.id)}
                  onFind={discover}
                  onZoom={openPhotoModal}
                />
              </div>
            );
          })}
        </div>

        <footer className="hunt-footer">
          {found.size === memories.length ? (
            <>
              <Heart size={28} fill="currentColor" />
              <h2>You found the whole garden.</h2>
              <p>Now you know where all the quiet little pieces were hiding.</p>
            </>
          ) : (
            <>
              <span className="footer-dots">✿ · ♡ · ✿</span>
              <h2>There are still little things growing.</h2>
              <p>
                Don't rush the page. Leave some corners unexplored until you feel like looking again.
              </p>
            </>
          )}
          <Link to="/full-letter">leave the garden → read the letter</Link>
        </footer>
      </main>

      {/* Full HD Zoom Modal */}
      {modalData && (
        <MemoryLightboxModal
          item={modalData.item}
          isVideo={modalData.isVideo}
          note={modalData.note}
          onClose={closeModal}
          onPrev={modalData.index !== -1 ? handlePrev : null}
          onNext={modalData.index !== -1 ? handleNext : null}
        />
      )}
    </div>
  );
}

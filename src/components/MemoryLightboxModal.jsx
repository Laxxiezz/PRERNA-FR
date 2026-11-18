import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Sparkles } from "lucide-react";

export default function MemoryLightboxModal({
  item, // photo item or video item
  isVideo = false,
  note = "",
  onClose,
  onPrev,
  onNext
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  if (!item) return null;

  return (
    <div className="memory-lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="memory-lightbox-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="lightbox-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {onPrev && (
          <button
            type="button"
            className="lightbox-nav-btn prev"
            onClick={onPrev}
            aria-label="Previous memory"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {onNext && (
          <button
            type="button"
            className="lightbox-nav-btn next"
            onClick={onNext}
            aria-label="Next memory"
          >
            <ChevronRight size={24} />
          </button>
        )}

        <div className="lightbox-media-container">
          {isVideo ? (
            <video
              src={item.src}
              controls
              autoPlay
              playsInline
              className="lightbox-video"
            />
          ) : (
            <img
              src={item.src}
              alt={item.alt || "Memory"}
              className="lightbox-img"
            />
          )}
        </div>

        <div className="lightbox-meta">
          <div className="lightbox-header">
            <span className="lightbox-chapter">{item.chapter || item.label}</span>
            <span className="lightbox-title">{item.title || item.alt || "Memory keepsake"}</span>
            <span className="lightbox-heart"><Heart size={16} fill="currentColor" /></span>
          </div>

          {note && (
            <div className="lightbox-note">
              <span className="note-tape" aria-hidden="true" />
              <p>"{note}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


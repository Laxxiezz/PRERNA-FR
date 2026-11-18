import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Maximize2 } from "lucide-react";

/**
 * Global helper to ensure only ONE video plays voice at any given time.
 */
function muteAllOtherVideos(currentVideoEl) {
  if (typeof document === "undefined") return;
  const allVids = document.querySelectorAll(".mini-video-element");
  allVids.forEach((el) => {
    if (el !== currentVideoEl && !el.muted) {
      el.muted = true;
      el.dispatchEvent(new Event("volumechange"));
    }
  });
}

export default function MiniMemoryVideo({ video, onExpand = null }) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Sync state if video muted changed externally
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const handleVolumeChange = () => {
      if (el.muted && isHovered) {
        setIsHovered(false);
      }
    };

    el.addEventListener("volumechange", handleVolumeChange);
    return () => el.removeEventListener("volumechange", handleVolumeChange);
  }, [isHovered]);

  // When scrolling away, mute automatically
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && videoRef.current && !videoRef.current.muted) {
            videoRef.current.muted = true;
            setIsHovered(false);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    muteAllOtherVideos(el);
    el.muted = false;
    el.volume = 1.0;
    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    setIsHovered(false);
  }, []);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;

    const nextMuted = !el.muted;
    if (!nextMuted) {
      muteAllOtherVideos(el);
    }
    el.muted = nextMuted;
    if (!nextMuted) {
      el.volume = 1.0;
      el.play().catch(() => {});
    }
    setIsHovered(!nextMuted);
  }, []);

  const handleExpand = (e) => {
    e.stopPropagation();
    if (onExpand) {
      if (videoRef.current) videoRef.current.muted = true;
      setIsHovered(false);
      onExpand(video);
    }
  };

  const sideClass = video.side === "left" ? "slot-left-side" : "slot-right-side";

  return (
    <div
      ref={containerRef}
      className={`mini-slot mini-video-slot ${sideClass} ${isHovered ? "is-hovered" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${video.title} - ${isHovered ? "voice playing, click to mute" : "hover or tap to hear voice"}`}
    >
      <span className="mini-video-tape" aria-hidden="true" />
      <span className="mini-video-pin" aria-hidden="true" />

      <div className="mini-video-inner">
        <video
          ref={videoRef}
          src={video.src}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="mini-video-element"
        />

        <div className={`mini-video-badge ${isHovered ? "active" : ""}`} aria-hidden="true">
          {isHovered ? (
            <>
              <Volume2 size={12} className="badge-icon-playing" />
              <span className="sound-wave-bars">
                <span className="sw-bar b1" />
                <span className="sw-bar b2" />
                <span className="sw-bar b3" />
              </span>
              <span className="badge-text">voice</span>
            </>
          ) : (
            <>
              <VolumeX size={11} className="badge-icon-muted" />
              <span className="badge-text">hover</span>
            </>
          )}
        </div>

        {onExpand && (
          <button
            type="button"
            className="mini-video-expand"
            onClick={handleExpand}
            title="Watch in full size"
            aria-label="Watch in full size"
          >
            <Maximize2 size={12} />
          </button>
        )}
      </div>

      <div className="mini-video-caption">
        <span className="mini-video-decor">{video.decor || "♡"}</span>
        <span className="mini-video-title">{video.title}</span>
      </div>
    </div>
  );
}

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { GravityLettersEngine } from "./gravityLettersEngine.js";

const GravityLetters = forwardRef(function GravityLetters({ className = "", style, children, ...opts }, ref) {
  const host = useRef(null);
  const eng = useRef(null);

  useEffect(() => {
    eng.current = new GravityLettersEngine(host.current, opts);
    return () => { eng.current?.destroy(); eng.current = null; };
  }, []);

  useEffect(() => { eng.current?.setOptions(opts); }, [JSON.stringify(opts)]);

  useImperativeHandle(ref, () => ({
    collapse: (x, y) => eng.current?.collapse(x, y),
    rebuild: () => eng.current?.rebuild(),
  }), []);

  return (
    <div ref={host} className={className}
      style={{ position: "relative", width: "100%", height: "100%", minHeight: 240, outline: "none", ...style }}>
      {children && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          {children}
        </div>
      )}
    </div>
  );
});

export default GravityLetters;


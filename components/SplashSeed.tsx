"use client";

import { useEffect, useState } from "react";

type Props = {
  onDone: () => void;
};

export default function SplashSeed({ onDone }: Props) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const quick = window.setTimeout(() => {
        setIsLeaving(true);
        window.setTimeout(onDone, 420);
      }, 1200);
      return () => window.clearTimeout(quick);
    }

    const leaveTimer = window.setTimeout(() => setIsLeaving(true), 7800);
    const doneTimer = window.setTimeout(onDone, 9000);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className={`splash-seed ${isLeaving ? "is-leaving" : ""}`}>
      <div className="scene" aria-hidden>
        <div className="soil" />
        <div className="seed" />
        <span className="root root-1" />
        <span className="root root-2" />
        <span className="root root-3" />
        <div className="stem" />
        <div className="leaf leaf-l" />
        <div className="leaf leaf-r" />
        <div className="bud">
          <span className="bud-petal p1" />
          <span className="bud-petal p2" />
          <span className="bud-petal p3" />
          <span className="bud-petal p4" />
          <span className="bud-petal p5" />
          <span className="bud-petal p6" />
        </div>
      </div>
      <div className="s-brand">
        <p className="s-title font-display">Jardin Esperanza</p>
        <p className="s-subtitle">Flores y plantas con amor</p>
      </div>
      <div className="s-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

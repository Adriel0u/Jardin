"use client";

import { useEffect, useState } from "react";

type Props = {
  onDone: () => void;
};

export default function SplashFlower({ onDone }: Props) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const leaveTimer = window.setTimeout(() => setIsLeaving(true), 900);
      const doneTimer = window.setTimeout(onDone, 1300);

      return () => {
        window.clearTimeout(leaveTimer);
        window.clearTimeout(doneTimer);
      };
    }

    const leaveTimer = window.setTimeout(() => setIsLeaving(true), 4200);
    const doneTimer = window.setTimeout(onDone, 4800);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className={`jv4-loader ${isLeaving ? "is-leaving" : ""}`}>
      <div className="jv4-wrap">
        <div className="jv4-logo-pulse" aria-hidden>
          <div className="jv4-ring jv4-ring1" />
          <div className="jv4-ring jv4-ring2" />
          <div className="jv4-ring jv4-ring3" />

          <div className="jv4-petal q1" />
          <div className="jv4-petal q2" />
          <div className="jv4-petal q3" />
          <div className="jv4-petal q4" />
          <div className="jv4-petal q5" />
          <div className="jv4-petal q6" />

          <div className="jv4-center">
            <span className="jv4-ce">e</span>
            <span className="jv4-cg">GARDEN</span>
          </div>
        </div>
        <p className="jv4-title font-display">Jardin Esperanza</p>
        <p className="jv4-sub">Flores y plantas con amor</p>

        <div className="jv4-bar-wrap" aria-hidden>
          <div className="jv4-bar" />
        </div>
      </div>
    </div>
  );
}

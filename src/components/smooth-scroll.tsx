"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    function configure() {
      lenis?.destroy();
      lenis = undefined;
      if (preference.matches) return;
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.12,
        smoothWheel: true,
        syncTouch: false,
        anchors: { offset: -85 },
        stopInertiaOnNavigate: true,
        prevent: (node) => Boolean(node.closest("[data-lenis-prevent]")),
      });
      syncDialogLock();
    }
    function syncDialogLock() {
      if (document.body.hasAttribute("data-scroll-locked")) lenis?.stop();
      else lenis?.start();
    }
    const observer = new MutationObserver(syncDialogLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-scroll-locked"],
    });
    preference.addEventListener("change", configure);
    configure();
    return () => {
      preference.removeEventListener("change", configure);
      observer.disconnect();
      lenis?.destroy();
    };
  }, []);
  return null;
}

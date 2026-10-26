"use client";

import { useEffect, useRef } from "react";

/**
 * Shared modal dismissal behaviour: Escape-to-close plus background scroll lock.
 *
 * Why a module-level counter instead of a per-component `document.body.style`
 * write: modals stack. Dayprint opens Daily Receipt from inside the context
 * panel, and Weekly Digest from inside the receipt; the Constellation canvas can
 * open on top of the archive. With naive locking, closing the inner modal would
 * restore `overflow` while the outer one is still mounted, and the page behind
 * it would start scrolling again. The counter only unlocks when the last modal
 * unmounts.
 *
 * The previous state is captured rather than hardcoded to "" so that a page
 * which deliberately sets `overflow: hidden` gets it back.
 */
let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

function lockScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    const body = document.body;
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
    // Compensate for the disappearing scrollbar so the layout doesn't jump
    // sideways when the lock kicks in.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlockScroll() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPaddingRight;
  }
}

interface UseModalDismissOptions {
  /** Pass `false` to disable (e.g. a non-dismissable onboarding step). */
  enabled?: boolean;
  /** Lock background scroll. Default true. */
  lockScroll?: boolean;
}

/**
 * Wires Escape and scroll-locking for a modal. Call once per modal component.
 *
 * @example
 * useModalDismiss(onClose);
 */
export function useModalDismiss(
  onClose: () => void,
  { enabled = true, lockScroll: shouldLock = true }: UseModalDismissOptions = {}
) {
  // Keep the latest callback without re-binding the listener on every render.
  // Modal `onClose` props are almost always inline arrows, so depending on the
  // identity directly would tear down and re-add the listener constantly.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Let an inner widget (an open dropdown, a nested editor) claim Escape
      // first; it calls preventDefault to signal that.
      if (e.defaultPrevented) return;
      e.preventDefault();
      onCloseRef.current();
    };

    window.addEventListener("keydown", handleKeyDown);
    if (shouldLock) lockScroll();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (shouldLock) unlockScroll();
    };
  }, [enabled, shouldLock]);
}

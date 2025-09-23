"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  count: number;
  onClick?: () => void;
  tooltip?: string;
};

export default function WishlistIcon({ count, onClick, tooltip }: Props) {
  return (
    <button
      aria-label={`Wishlist${count > 0 ? `, ${count} items` : ""}`}
      aria-live="polite"
      onClick={onClick}
      className="relative h-10 w-10 grid place-items-center rounded-md hover:bg-secondary/50 transition-all duration-200 active:duration-100 outline-none focus-visible:ring-2 ring-offset-2 ring-black motion-safe:hover:-translate-y-px motion-safe:hover:scale-[1.02] motion-safe:hover:shadow motion-safe:active:scale-95 motion-safe:active:shadow-sm group"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-black/80 hover:stroke-black" aria-hidden="true">
        <path d="M12 21s-6.5-4.55-9-8.5C1.5 9 3.5 6 6.5 6c1.74 0 3.41.81 4.5 2.08C12.09 6.81 13.76 6 15.5 6 18.5 6 20.5 9 21 12.5 18.5 16.45 12 21 12 21z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-black text-white font-bold text-[11px] border border-white"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
      {tooltip && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] whitespace-nowrap rounded-md bg-black/90 text-white text-[11px] px-2 py-1 opacity-0 translate-y-1 motion-safe:transition-all motion-safe:duration-150 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100"
        >
          {tooltip}
        </span>
      )}
    </button>
  );
}

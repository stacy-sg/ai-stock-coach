import type { Signal } from "./types";

/** CSS var() references into the --signal-*-ring tokens in globals.css —
 * for spots (SVG stroke, inline text color) that can't take a class. */
export const SIGNAL_RING_VAR: Record<Signal, string> = {
  BUY: "var(--signal-buy-ring)",
  HOLD: "var(--signal-hold-ring)",
  WATCH: "var(--signal-watch-ring)",
  SELL: "var(--signal-sell-ring)",
};

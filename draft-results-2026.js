// OFFICIAL 2026 NFL DRAFT RESULTS - AFC Northerners
// Draft held in Pittsburgh, April 23-25, 2026.
// Map of pick ID (matching draft-order-2026.js) → drafted player name.
// Seeds the tracker's "Actual pick" fields; manual entries in the tracker override.
//
// Only web-corroborated picks are included below. Draft-night trades changed
// pick ownership vs the pre-draft order (CLE traded #6 to KC, moved to #9) —
// draft-order-2026.js reflects the corrected round-1 ownership.
// Fill remaining picks from the NFL.com/ESPN draft trackers.

window.DRAFT_RESULTS_2026_VERSION = '2026-v1-partial';

window.DRAFT_RESULTS_2026 = {
    // ═══ ROUND 1 (corroborated picks) ═══
    "pick-1":  "Fernando Mendoza",      // QB, Indiana — Raiders
    "pick-3":  "Jeremiyah Love",        // RB, Notre Dame — Cardinals
    "pick-4":  "Carnell Tate",          // WR, Ohio State — Titans
    "pick-6":  "Mansoor Delane",        // CB, LSU — Chiefs (from Browns trade-down)
    "pick-9":  "Spencer Fano",          // OT, Utah — BROWNS (traded down 6→9, gained 3rd + 5th)
    "pick-13": "Ty Simpson",            // QB, Alabama — Rams
    "pick-14": "Olaivavega Ioane",      // G, Penn State — RAVENS
    "pick-20": "Makai Lemon",           // WR, USC — Eagles
    "pick-21": "Max Iheanachor"         // OT, Arizona State — STEELERS

    // ═══ CIN first pick: Cashius Howell, EDGE — #40 overall (round 2).
    // The pre-draft round 2-7 order in draft-order-2026.js does not reflect
    // draft-night trades yet, so round 2+ results are not seeded until the
    // order file is reconciled with the actual selection order.
};

// AFC NORTHERNERS - SEASON CONFIG
// The single place season dates and the current year live.
// Pages read this file so countdowns and labels roll forward automatically —
// update this ONE file each season instead of editing pages.

window.SEASON_CONFIG = {
    seasonYear: 2026,          // the NFL season being covered
    draftYear: 2026,           // the most recent draft (data files use this year suffix)

    // Milestones in chronological order. Countdowns automatically target the
    // next one that hasn't happened yet. Times are US/Eastern.
    milestones: [
        { key: 'draft-2026',   label: '2026 NFL DRAFT',        date: '2026-04-23T20:00:00-04:00', done: true },
        { key: 'kickoff-2026', label: '2026 SEASON KICKOFF',   date: '2026-09-09T20:20:00-04:00' }, // SEA vs NE, Wed Sept 9
        { key: 'playoffs-2027', label: 'PLAYOFFS',             date: '2027-01-16T13:00:00-05:00' }, // approximate wild-card weekend
        { key: 'draft-2027',   label: '2027 NFL DRAFT (D.C.)', date: '2027-04-29T20:00:00-04:00' }
    ]
};

// Returns the next upcoming milestone (or the last one if all have passed).
window.getNextMilestone = function () {
    const now = new Date();
    const ms = window.SEASON_CONFIG.milestones;
    for (const m of ms) {
        if (new Date(m.date) > now) return m;
    }
    return ms[ms.length - 1];
};

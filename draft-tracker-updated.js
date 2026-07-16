/* ==========================================
           DRAFT TRACKER - STATE ARCHITECTURE
           ========================================== */

        const STORAGE_SCHEMA_VERSION = '3';
        const OFFICIAL_VERSION = window.DRAFT_ORDER_2026_VERSION || 'unknown';

        const HOSTS = {
            'Dave':  { team: 'CLE', color: 'host-dave',  name: 'Dave Green' },
            'Chris': { team: 'PIT', color: 'host-chris', name: 'Chris Adkins' },
            'Rob':   { team: 'CIN', color: 'host-rob',   name: 'Rob Gressis' },
            'Jan':   { team: 'BAL', color: 'host-jan',   name: 'Jan-David Soutar' }
        };
        const HOST_ORDER = ['Dave', 'Chris', 'Rob', 'Jan'];

        const AFC_NORTH = ['CLE', 'PIT', 'CIN', 'BAL'];

        const TEAMS = {
            'CLE': { name: 'Browns',     class: 'team-browns',      text: 'text-browns',      font: 'font-browns',    afcNorth: true },
            'PIT': { name: 'Steelers',   class: 'team-steelers',    text: 'text-steelers',    font: 'font-steelers',  afcNorth: true },
            'CIN': { name: 'Bengals',    class: 'team-bengals',     text: 'text-bengals',     font: 'font-bengals',   afcNorth: true },
            'BAL': { name: 'Ravens',     class: 'team-ravens',      text: 'text-ravens',      font: 'font-ravens',    afcNorth: true },
            'ARI': { name: 'Cardinals',  class: 'team-cardinals',   text: 'text-cardinals',   font: '', afcNorth: false },
            'ATL': { name: 'Falcons',    class: 'team-falcons',     text: 'text-falcons',     font: '', afcNorth: false },
            'CAR': { name: 'Panthers',   class: 'team-panthers',    text: 'text-panthers',    font: '', afcNorth: false },
            'CHI': { name: 'Bears',      class: 'team-bears',       text: 'text-bears',       font: '', afcNorth: false },
            'DAL': { name: 'Cowboys',    class: 'team-cowboys',     text: 'text-cowboys',     font: '', afcNorth: false },
            'DET': { name: 'Lions',      class: 'team-lions',       text: 'text-lions',       font: '', afcNorth: false },
            'GB':  { name: 'Packers',    class: 'team-packers',     text: 'text-packers',     font: '', afcNorth: false },
            'LA':  { name: 'Rams',       class: 'team-rams',        text: 'text-rams',        font: '', afcNorth: false },
            'MIN': { name: 'Vikings',    class: 'team-vikings',     text: 'text-vikings',     font: '', afcNorth: false },
            'NO':  { name: 'Saints',     class: 'team-saints',      text: 'text-saints',      font: '', afcNorth: false },
            'NYG': { name: 'Giants',     class: 'team-giants',      text: 'text-giants',      font: '', afcNorth: false },
            'PHI': { name: 'Eagles',     class: 'team-eagles',      text: 'text-eagles',      font: '', afcNorth: false },
            'SF':  { name: '49ers',      class: 'team-49ers',       text: 'text-49ers',       font: '', afcNorth: false },
            'SEA': { name: 'Seahawks',   class: 'team-seahawks',    text: 'text-seahawks',    font: '', afcNorth: false },
            'TB':  { name: 'Buccaneers', class: 'team-buccaneers',  text: 'text-buccaneers',  font: '', afcNorth: false },
            'WAS': { name: 'Commanders', class: 'team-commanders',  text: 'text-commanders',  font: '', afcNorth: false },
            'DEN': { name: 'Broncos',    class: 'team-broncos',     text: 'text-broncos',     font: '', afcNorth: false },
            'KC':  { name: 'Chiefs',     class: 'team-chiefs',      text: 'text-chiefs',      font: '', afcNorth: false },
            'LV':  { name: 'Raiders',    class: 'team-raiders',     text: 'text-raiders',     font: '', afcNorth: false },
            'LAC': { name: 'Chargers',   class: 'team-chargers',    text: 'text-chargers',    font: '', afcNorth: false },
            'IND': { name: 'Colts',      class: 'team-colts',       text: 'text-colts',       font: '', afcNorth: false },
            'JAC': { name: 'Jaguars',    class: 'team-jaguars',     text: 'text-jaguars',     font: '', afcNorth: false },
            'HOU': { name: 'Texans',     class: 'team-texans',      text: 'text-texans',      font: '', afcNorth: false },
            'TEN': { name: 'Titans',     class: 'team-titans',      text: 'text-titans',      font: '', afcNorth: false },
            'BUF': { name: 'Bills',      class: 'team-bills',       text: 'text-bills',       font: '', afcNorth: false },
            'MIA': { name: 'Dolphins',   class: 'team-dolphins',    text: 'text-dolphins',    font: '', afcNorth: false },
            'NE':  { name: 'Patriots',   class: 'team-patriots',    text: 'text-patriots',    font: '', afcNorth: false },
            'NYJ': { name: 'Jets',       class: 'team-jets',        text: 'text-jets',        font: '', afcNorth: false }
        };

        let draftPicks = [];
        let currentRound = 1;
        let filters = { team: 'all', host: 'all', result: 'all' };
        const STORAGE_KEY = 'afcNorthernersDraftOverlay2026';
        const HOST_PICKS_KEY = 'afcn_host_picks_2026';

        function loadHostPicks() {
            try {
                const saved = localStorage.getItem(HOST_PICKS_KEY);
                if (saved) {
                    const data = JSON.parse(saved);
                    return data.picks || {};
                }
            } catch (e) {}
            return window.HOST_PICKS_2026 || {};
        }

        function initializeDraftBoard() {
            const officialPicks = buildOfficialPicks();
            const overlay = loadOverlay();
            draftPicks = mergePicks(officialPicks, overlay);
            renderPicks();
            updateStats();
        }

        function buildOfficialPicks() {
            const official = window.DRAFT_ORDER_2026 || [];
            const hostPicks = loadHostPicks();
            const results = window.DRAFT_RESULTS_2026 || {};
            return official.map(base => {
                const id = base.id || `pick-${base.overall}`;
                return {
                    id,
                    overall: base.overall,
                    round: base.round,
                    pickInRound: base.pickInRound,
                    team: base.team,
                    isAFCNorth: base.isAFCNorth !== undefined ? base.isAFCNorth : AFC_NORTH.includes(base.team),
                    // Official results file (if committed) seeds actuals; overlay can override
                    actualPlayer: results[id] || '',
                    userPick: '',
                    notes: '',
                    hostPredictions: hostPicks[id] || null
                };
            });
        }

        function loadOverlay() {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (!saved) return {};
                const data = JSON.parse(saved);
                // Migrate older schemas: preserve actualPlayer, userPick, notes
                if (data.schemaVersion !== STORAGE_SCHEMA_VERSION) {
                    if (data.overlay) {
                        const migrated = {};
                        Object.entries(data.overlay).forEach(([id, v]) => {
                            if (v.actualPlayer || v.userPick || v.notes) {
                                migrated[id] = {
                                    actualPlayer: v.actualPlayer || '',
                                    userPick: v.userPick || '',
                                    notes: v.notes || ''
                                };
                            }
                        });
                        return migrated;
                    }
                    return {};
                }
                if (data.officialVersion !== OFFICIAL_VERSION) {
                    console.log('Draft order version changed, resetting overlay');
                    return {};
                }
                return data.overlay || {};
            } catch (e) {
                console.error('Error loading overlay:', e);
                return {};
            }
        }

        function mergePicks(officialPicks, overlay) {
            return officialPicks.map(pick => {
                const o = overlay[pick.id];
                if (o) {
                    return {
                        ...pick,
                        actualPlayer: o.actualPlayer || pick.actualPlayer,
                        userPick: o.userPick || '',
                        notes: o.notes || ''
                    };
                }
                return pick;
            });
        }

        function saveDraftState() {
            const overlay = {};
            draftPicks.forEach(pick => {
                if (pick.actualPlayer || pick.userPick || pick.notes) {
                    overlay[pick.id] = {
                        actualPlayer: pick.actualPlayer,
                        userPick: pick.userPick,
                        notes: pick.notes
                    };
                }
            });
            const data = {
                schemaVersion: STORAGE_SCHEMA_VERSION,
                officialVersion: OFFICIAL_VERSION,
                overlay,
                savedAt: new Date().toISOString()
            };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.error('Save failed:', e);
            }
        }

        function renderPicks() {
            const container = document.getElementById('picksContainer');
            container.innerHTML = '';

            let filteredPicks = draftPicks;

            if (currentRound !== 'all') {
                filteredPicks = filteredPicks.filter(p => p.round === parseInt(currentRound));
            }
            if (filters.team === 'afc-north') {
                filteredPicks = filteredPicks.filter(p => p.isAFCNorth);
            } else if (filters.team !== 'all') {
                filteredPicks = filteredPicks.filter(p => p.team === filters.team);
            }
            if (filters.host !== 'all') {
                filteredPicks = filteredPicks.filter(p => p.hostPredictions && p.hostPredictions[filters.host]);
            }
            if (filters.result === 'correct') {
                filteredPicks = filteredPicks.filter(p =>
                    p.actualPlayer && p.hostPredictions &&
                    HOST_ORDER.some(h => p.hostPredictions[h] &&
                        p.actualPlayer.toLowerCase().trim() === p.hostPredictions[h].toLowerCase().trim())
                );
            } else if (filters.result === 'wrong') {
                filteredPicks = filteredPicks.filter(p =>
                    p.actualPlayer && p.hostPredictions &&
                    !HOST_ORDER.some(h => p.hostPredictions[h] &&
                        p.actualPlayer.toLowerCase().trim() === p.hostPredictions[h].toLowerCase().trim())
                );
            } else if (filters.result === 'pending') {
                filteredPicks = filteredPicks.filter(p => !p.actualPlayer);
            }

            filteredPicks.forEach(pick => {
                const team = TEAMS[pick.team] || { name: pick.team, class: '', text: 'text-gray-400', font: '', afcNorth: false };
                const hp = pick.hostPredictions;
                const actual = pick.actualPlayer ? pick.actualPlayer.toLowerCase().trim() : '';
                const hasActual = !!pick.actualPlayer;

                // Host prediction columns (read-only) + Your Pick input column
                const hostCols = HOST_ORDER.map(h => {
                    const pred = hp && hp[h];
                    const isOk = hasActual && pred && actual === pred.toLowerCase().trim();
                    const hostColor = HOSTS[h].color;
                    return `<div class="bg-zinc-900/80 rounded px-2 py-1 min-w-0">
                        <div class="text-[10px] font-bold ${hostColor} mb-0.5 tracking-wider">${h.toUpperCase()}</div>
                        <div class="text-xs font-mono truncate ${pred ? (isOk ? 'text-green-400 font-bold' : 'text-gray-300') : 'text-zinc-800'}">${pred || '—'}</div>
                    </div>`;
                }).join('');

                const userPred = pick.userPick ? pick.userPick.toLowerCase().trim() : '';
                const userOk = hasActual && userPred && actual === userPred;
                const userCol = `<div class="bg-zinc-900/80 rounded px-2 py-1 min-w-0">
                    <div class="text-[10px] font-bold text-blue-400 mb-0.5 tracking-wider">YOU</div>
                    <input type="text" placeholder="your pick"
                        value="${pick.userPick.replace(/"/g, '&quot;')}"
                        list="prospects-list"
                        onchange="updatePick('${pick.id}', 'userPick', this.value)"
                        class="bg-transparent border-none outline-none text-xs font-mono w-full ${pick.userPick ? (userOk ? 'text-green-400 font-bold' : 'text-blue-300') : 'text-zinc-600'}"
                        style="padding:0">
                </div>`;

                // Per-host + user result chips
                let resultChips = '';
                if (hasActual) {
                    const hostChips = hp ? HOST_ORDER.map(h => {
                        if (!hp[h]) return '';
                        const ok = actual === hp[h].toLowerCase().trim();
                        return `<span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold ${ok ? 'badge-correct' : 'badge-wrong'}">${h} ${ok ? '✓' : '✗'}</span>`;
                    }).join('') : '';
                    const youChip = pick.userPick
                        ? `<span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold ${userOk ? 'badge-correct' : 'badge-wrong'}">You ${userOk ? '✓' : '✗'}</span>`
                        : '';
                    resultChips = hostChips + youChip;
                }

                const div = document.createElement('div');
                div.className = `pick-row flex items-center gap-2 p-2 rounded border border-zinc-800 ${team.class} ${pick.isAFCNorth ? 'afc-north-pick' : ''}`;
                div.dataset.pickId = pick.id;

                div.innerHTML = `
                    <div class="w-12 text-center flex-shrink-0">
                        <div class="font-mono text-base font-bold text-white">#${pick.overall}</div>
                        <div class="text-xs text-gray-500 font-mono">R${pick.round}</div>
                    </div>
                    <div class="w-14 text-center flex-shrink-0">
                        <div class="font-bold ${team.text} ${team.font || ''} text-base leading-tight">${pick.team}</div>
                        ${pick.isAFCNorth ? '<div class="text-[10px] text-yellow-500 font-bold">AFC N</div>' : ''}
                    </div>
                    <div class="flex-1 grid grid-cols-5 gap-1 min-w-0">${hostCols}${userCol}</div>
                    <div class="w-40 flex-shrink-0">
                        <input type="text" placeholder="Actual pick..."
                            value="${pick.actualPlayer.replace(/"/g, '&quot;')}"
                            list="prospects-list"
                            onchange="updatePick('${pick.id}', 'actualPlayer', this.value)"
                            class="live-input rounded px-2 py-1 w-full text-sm">
                    </div>
                    <div class="w-40 flex-shrink-0 flex flex-wrap gap-1">${resultChips}</div>
                `;

                container.appendChild(div);
            });
        }

        function updatePick(pickId, field, value) {
            const pick = draftPicks.find(p => p.id === pickId);
            if (pick) {
                pick[field] = value;
                saveDraftState();
                updateStats();
                if (field === 'actualPlayer') {
                    renderPicks();
                }
            }
        }

        function updateStats() {
            const afcNorthWithActual = draftPicks.filter(p => p.isAFCNorth && p.actualPlayer);
            const afcNorthCorrect = afcNorthWithActual.filter(p =>
                p.hostPredictions && HOST_ORDER.some(h =>
                    p.hostPredictions[h] &&
                    p.actualPlayer.toLowerCase().trim() === p.hostPredictions[h].toLowerCase().trim()
                )
            ).length;
            const afcNorthRate = afcNorthWithActual.length > 0
                ? Math.round((afcNorthCorrect / afcNorthWithActual.length) * 100)
                : 0;
            document.getElementById('afcNorthRate').textContent = afcNorthRate + '%';
            document.getElementById('afcNorthFraction').textContent = `${afcNorthCorrect}/${afcNorthWithActual.length}`;

            HOST_ORDER.forEach(host => {
                const picks = draftPicks.filter(p =>
                    p.isAFCNorth && p.actualPlayer && p.hostPredictions && p.hostPredictions[host]
                );
                const correct = picks.filter(p =>
                    p.actualPlayer.toLowerCase().trim() === p.hostPredictions[host].toLowerCase().trim()
                ).length;
                document.getElementById(`score${host}`).textContent = correct;
                document.getElementById(`pct${host}`).textContent =
                    picks.length > 0 ? Math.round((correct / picks.length) * 100) + '%' : '0%';
            });

            // User score — AFC North picks where user entered a prediction
            const userPicks = draftPicks.filter(p => p.isAFCNorth && p.actualPlayer && p.userPick);
            const userCorrect = userPicks.filter(p =>
                p.actualPlayer.toLowerCase().trim() === p.userPick.toLowerCase().trim()
            ).length;
            document.getElementById('scoreYou').textContent = userCorrect;
            document.getElementById('pctYou').textContent =
                userPicks.length > 0 ? Math.round((userCorrect / userPicks.length) * 100) + '%' : '0%';
        }

        function setRound(round) {
            currentRound = round;
            document.querySelectorAll('[id^="tab-round-"]').forEach(tab => {
                tab.classList.remove('bg-zinc-700', 'text-white');
                tab.classList.add('text-gray-400');
            });
            const activeTab = document.getElementById(`tab-round-${round === 'all' ? 'all' : round}`);
            if (activeTab) {
                activeTab.classList.remove('text-gray-400');
                activeTab.classList.add('bg-zinc-700', 'text-white');
            }
            renderPicks();
        }

        function applyFilters() {
            filters.team = document.getElementById('filterTeam').value;
            filters.host = document.getElementById('filterHost').value;
            filters.result = document.getElementById('filterResult').value;
            renderPicks();
        }

        function clearActuals() {
            if (!confirm('Clear all actual drafted players?')) return;
            draftPicks.forEach(pick => { pick.actualPlayer = ''; });
            saveDraftState();
            renderPicks();
            updateStats();
        }

        function exportData() {
            const overlay = {};
            draftPicks.forEach(pick => {
                if (pick.actualPlayer || pick.userPick || pick.notes) {
                    overlay[pick.id] = {
                        actualPlayer: pick.actualPlayer,
                        userPick: pick.userPick,
                        notes: pick.notes
                    };
                }
            });
            const data = {
                schemaVersion: STORAGE_SCHEMA_VERSION,
                officialVersion: OFFICIAL_VERSION,
                exportDate: new Date().toISOString(),
                overlay
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `afc-north-draft-overlay-2026-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function importData(input) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.overlay) {
                        alert('Error: Invalid import file format.');
                        return;
                    }
                    // Accept older schemas — only pull actualPlayer/userPick/notes
                    const cleanOverlay = {};
                    Object.entries(data.overlay).forEach(([id, v]) => {
                        if (v.actualPlayer || v.userPick || v.notes) {
                            cleanOverlay[id] = {
                                actualPlayer: v.actualPlayer || '',
                                userPick: v.userPick || '',
                                notes: v.notes || ''
                            };
                        }
                    });
                    draftPicks = mergePicks(draftPicks, cleanOverlay);
                    saveDraftState();
                    renderPicks();
                    updateStats();
                    alert('Import successful!');
                } catch (err) {
                    alert('Error importing file: ' + err.message);
                }
            };
            reader.readAsText(file);
            input.value = '';
        }

        document.addEventListener('DOMContentLoaded', initializeDraftBoard);

<script src="draft-order-2026.js"></script>
    <script>
        /* ==========================================
           DRAFT TRACKER - STATE ARCHITECTURE
           ========================================== */
        
        // Version protection
        const STORAGE_SCHEMA_VERSION = '1';
        const OFFICIAL_VERSION = window.DRAFT_ORDER_2026_VERSION || 'unknown';
        
        // Host configuration
        const HOSTS = {
            'Dave': { team: 'CLE', color: 'host-dave', name: 'Dave Green' },
            'Chris': { team: 'PIT', color: 'host-chris', name: 'Chris Adkins' },
            'Rob': { team: 'CIN', color: 'host-rob', name: 'Rob Gressis' },
            'Jan': { team: 'BAL', color: 'host-jan', name: 'Jan-David Soutar' }
        };

        // AFC North teams
        const AFC_NORTH = ['CLE', 'PIT', 'CIN', 'BAL'];
        
        // Team display config
        const TEAMS = {
            'CLE': { name: 'Browns', class: 'team-browns', text: 'text-browns', font: 'font-browns', afcNorth: true },
            'PIT': { name: 'Steelers', class: 'team-steelers', text: 'text-steelers', font: 'font-steelers', afcNorth: true },
            'CIN': { name: 'Bengals', class: 'team-bengals', text: 'text-bengals', font: 'font-bengals', afcNorth: true },
            'BAL': { name: 'Ravens', class: 'team-ravens', text: 'text-ravens', font: 'font-ravens', afcNorth: true },
            'ARI': { name: 'Cardinals', class: 'team-cardinals', text: 'text-cardinals', font: '', afcNorth: false },
            'ATL': { name: 'Falcons', class: 'team-falcons', text: 'text-falcons', font: '', afcNorth: false },
            'CAR': { name: 'Panthers', class: 'team-panthers', text: 'text-panthers', font: '', afcNorth: false },
            'CHI': { name: 'Bears', class: 'team-bears', text: 'text-bears', font: '', afcNorth: false },
            'DAL': { name: 'Cowboys', class: 'team-cowboys', text: 'text-cowboys', font: '', afcNorth: false },
            'DET': { name: 'Lions', class: 'team-lions', text: 'text-lions', font: '', afcNorth: false },
            'GB': { name: 'Packers', class: 'team-packers', text: 'text-packers', font: '', afcNorth: false },
            'LA': { name: 'Rams', class: 'team-rams', text: 'text-rams', font: '', afcNorth: false },
            'MIN': { name: 'Vikings', class: 'team-vikings', text: 'text-vikings', font: '', afcNorth: false },
            'NO': { name: 'Saints', class: 'team-saints', text: 'text-saints', font: '', afcNorth: false },
            'NYG': { name: 'Giants', class: 'team-giants', text: 'text-giants', font: '', afcNorth: false },
            'PHI': { name: 'Eagles', class: 'team-eagles', text: 'text-eagles', font: '', afcNorth: false },
            'SF': { name: '49ers', class: 'team-49ers', text: 'text-49ers', font: '', afcNorth: false },
            'SEA': { name: 'Seahawks', class: 'team-seahawks', text: 'text-seahawks', font: '', afcNorth: false },
            'TB': { name: 'Buccaneers', class: 'team-buccaneers', text: 'text-buccaneers', font: '', afcNorth: false },
            'WAS': { name: 'Commanders', class: 'team-commanders', text: 'text-commanders', font: '', afcNorth: false },
            'DEN': { name: 'Broncos', class: 'team-broncos', text: 'text-broncos', font: '', afcNorth: false },
            'KC': { name: 'Chiefs', class: 'team-chiefs', text: 'text-chiefs', font: '', afcNorth: false },
            'LV': { name: 'Raiders', class: 'team-raiders', text: 'text-raiders', font: '', afcNorth: false },
            'LAC': { name: 'Chargers', class: 'team-chargers', text: 'text-chargers', font: '', afcNorth: false },
            'IND': { name: 'Colts', class: 'team-colts', text: 'text-colts', font: '', afcNorth: false },
            'JAC': { name: 'Jaguars', class: 'team-jaguars', text: 'text-jaguars', font: '', afcNorth: false },
            'HOU': { name: 'Texans', class: 'team-texans', text: 'text-texans', font: '', afcNorth: false },
            'TEN': { name: 'Titans', class: 'team-titans', text: 'text-titans', font: '', afcNorth: false },
            'BUF': { name: 'Bills', class: 'team-bills', text: 'text-bills', font: '', afcNorth: false },
            'MIA': { name: 'Dolphins', class: 'team-dolphins', text: 'text-dolphins', font: '', afcNorth: false },
            'NE': { name: 'Patriots', class: 'team-patriots', text: 'text-patriots', font: '', afcNorth: false },
            'NYJ': { name: 'Jets', class: 'team-jets', text: 'text-jets', font: '', afcNorth: false }
        };

        // State management
        let draftPicks = [];
        let currentRound = 1;
        let filters = { team: 'all', host: 'all', result: 'all' };
        const STORAGE_KEY = 'afcNorthernersDraftOverlay2026';

        // Initialize the board
        function initializeDraftBoard() {
            // Step 1: Build official picks from source of truth
            const officialPicks = buildOfficialPicks();
            
            // Step 2: Load user overlay from localStorage
            const overlay = loadOverlay();
            
            // Step 3: Merge overlay into official picks
            draftPicks = mergePicks(officialPicks, overlay);
            
            // Step 4: Render
            renderPicks();
            updateStats();
        }

        // Build official picks from window.DRAFT_ORDER_2026
        function buildOfficialPicks() {
            const official = window.DRAFT_ORDER_2026 || [];
            return official.map(base => ({
                // Official immutable fields (source of truth)
                id: base.id || `pick-${base.overall}`,
                overall: base.overall,
                round: base.round,
                pickInRound: base.pickInRound,
                team: base.team,
                isAFCNorth: base.isAFCNorth !== undefined ? base.isAFCNorth : AFC_NORTH.includes(base.team),
                // Mutable user fields (empty by default)
                predictedPlayer: '',
                predictedHost: '',
                actualPlayer: '',
                notes: ''
            }));
        }

        // Load overlay from localStorage with version checking
        function loadOverlay() {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (!saved) return {};
                
                const data = JSON.parse(saved);
                
                // Version check
                if (data.schemaVersion !== STORAGE_SCHEMA_VERSION) {
                    console.log('Schema version mismatch, resetting overlay');
                    return {};
                }
                if (data.officialVersion !== OFFICIAL_VERSION) {
                    console.log('Official draft order changed, resetting overlay');
                    return {};
                }
                
                return data.overlay || {};
            } catch (e) {
                console.error('Error loading overlay:', e);
                return {};
            }
        }

        // Merge overlay into official picks
        function mergePicks(officialPicks, overlay) {
            return officialPicks.map(pick => {
                const overlayData = overlay[pick.id];
                if (overlayData) {
                    return {
                        ...pick,
                        predictedPlayer: overlayData.predictedPlayer || '',
                        predictedHost: overlayData.predictedHost || '',
                        actualPlayer: overlayData.actualPlayer || '',
                        notes: overlayData.notes || ''
                    };
                }
                return pick;
            });
        }

        // Save only overlay data (mutable fields only)
        function saveDraftState() {
            const overlay = {};
            draftPicks.forEach(pick => {
                if (pick.predictedPlayer || pick.predictedHost || pick.actualPlayer || pick.notes) {
                    overlay[pick.id] = {
                        predictedPlayer: pick.predictedPlayer,
                        predictedHost: pick.predictedHost,
                        actualPlayer: pick.actualPlayer,
                        notes: pick.notes
                    };
                }
            });
            
            const data = {
                schemaVersion: STORAGE_SCHEMA_VERSION,
                officialVersion: OFFICIAL_VERSION,
                overlay: overlay,
                savedAt: new Date().toISOString()
            };
            
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.error('Save failed:', e);
            }
        }

        // Render picks to DOM
        function renderPicks() {
            const container = document.getElementById('picksContainer');
            container.innerHTML = '';
            
            let filteredPicks = draftPicks;
            
            // Apply round filter
            if (currentRound !== 'all') {
                filteredPicks = filteredPicks.filter(p => p.round === parseInt(currentRound));
            }
            
            // Apply team filter
            if (filters.team === 'afc-north') {
                filteredPicks = filteredPicks.filter(p => p.isAFCNorth);
            } else if (filters.team !== 'all') {
                filteredPicks = filteredPicks.filter(p => p.team === filters.team);
            }
            
            // Apply host filter
            if (filters.host !== 'all') {
                filteredPicks = filteredPicks.filter(p => p.predictedHost === filters.host);
            }
            
            // Apply result filter
            if (filters.result === 'correct') {
                filteredPicks = filteredPicks.filter(p => p.actualPlayer && p.predictedPlayer && p.actualPlayer.toLowerCase().trim() === p.predictedPlayer.toLowerCase().trim());
            } else if (filters.result === 'wrong') {
                filteredPicks = filteredPicks.filter(p => p.actualPlayer && p.predictedPlayer && p.actualPlayer.toLowerCase().trim() !== p.predictedPlayer.toLowerCase().trim());
            } else if (filters.result === 'pending') {
                filteredPicks = filteredPicks.filter(p => !p.actualPlayer);
            }
            
            filteredPicks.forEach(pick => {
                const team = TEAMS[pick.team];
                const isAFCNorth = pick.isAFCNorth;
                const host = pick.predictedHost ? HOSTS[pick.predictedHost] : null;
                const hasResult = pick.actualPlayer;
                const isCorrect = hasResult && pick.predictedPlayer && pick.actualPlayer.toLowerCase().trim() === pick.predictedPlayer.toLowerCase().trim();
                
                const div = document.createElement('div');
                div.className = `pick-row flex items-center gap-2 p-3 rounded border border-zinc-800 ${team.class} ${isAFCNorth ? 'afc-north-pick' : ''}`;
                div.dataset.pickId = pick.id;
                div.draggable = true;
                
                // Drag/drop handlers
                div.addEventListener('dragstart', handleDragStart);
                div.addEventListener('dragover', handleDragOver);
                div.addEventListener('drop', handleDrop);
                div.addEventListener('dragend', handleDragEnd);
                
                div.innerHTML = `
                    <div class="w-12 text-center">
                        <div class="font-mono text-lg font-bold text-white">#${pick.overall}</div>
                        <div class="text-xs text-gray-500 font-mono">R${pick.round}</div>
                    </div>
                    
                    <div class="w-16 text-center flex-shrink-0">
                        <div class="font-bold ${team.text} ${team.font || ''} text-lg">${pick.team}</div>
                        ${isAFCNorth ? '<div class="text-[10px] text-yellow-500 font-bold">AFC N</div>' : ''}
                    </div>
                    
                    <div class="flex-1 grid grid-cols-4 gap-2 items-center">
                        <input type="text" placeholder="Predicted Player" 
                            value="${pick.predictedPlayer}" 
                            onchange="updatePick('${pick.id}', 'predictedPlayer', this.value)"
                            class="live-input rounded px-2 py-1 w-full">
                            
                        <select onchange="updatePick('${pick.id}', 'predictedHost', this.value)"
                            class="live-input rounded px-2 py-1 w-full bg-zinc-800">
                            <option value="">Host...</option>
                            <option value="Dave" ${pick.predictedHost === 'Dave' ? 'selected' : ''} class="host-dave">Dave</option>
                            <option value="Chris" ${pick.predictedHost === 'Chris' ? 'selected' : ''} class="host-chris">Chris</option>
                            <option value="Rob" ${pick.predictedHost === 'Rob' ? 'selected' : ''} class="host-rob">Rob</option>
                            <option value="Jan" ${pick.predictedHost === 'Jan' ? 'selected' : ''} class="host-jan">Jan</option>
                        </select>
                        
                        <input type="text" placeholder="Actual Player" 
                            value="${pick.actualPlayer}" 
                            onchange="updatePick('${pick.id}', 'actualPlayer', this.value)"
                            class="live-input rounded px-2 py-1 w-full ${hasResult ? (isCorrect ? 'border-green-600' : 'border-red-600') : ''}">
                            
                        <input type="text" placeholder="Notes" 
                            value="${pick.notes}" 
                            onchange="updatePick('${pick.id}', 'notes', this.value)"
                            class="live-input rounded px-2 py-1 w-full text-gray-400">
                    </div>
                    
                    ${hasResult ? `
                        <div class="w-20 text-center">
                            <span class="inline-block px-2 py-1 rounded text-xs font-bold ${isCorrect ? 'badge-correct' : 'badge-wrong'}">
                                ${isCorrect ? '✓ CORRECT' : '✗ WRONG'}
                            </span>
                        </div>
                    ` : '<div class="w-20"></div>'}
                `;
                
                container.appendChild(div);
            });
        }

        // Update pick data
        function updatePick(pickId, field, value) {
            const pick = draftPicks.find(p => p.id === pickId);
            if (pick) {
                pick[field] = value;
                saveDraftState();
                updateStats();
                if (field === 'actualPlayer') {
                    renderPicks(); // Re-render to show result badge
                }
            }
        }

        // Calculate and display stats
        function updateStats() {
            const afcNorthPicks = draftPicks.filter(p => p.isAFCNorth && p.actualPlayer);
            const afcNorthCorrect = afcNorthPicks.filter(p => p.predictedPlayer && p.actualPlayer.toLowerCase().trim() === p.predictedPlayer.toLowerCase().trim()).length;
            const afcNorthRate = afcNorthPicks.length > 0 ? Math.round((afcNorthCorrect / afcNorthPicks.length) * 100) : 0;
            
            document.getElementById('afcNorthRate').textContent = afcNorthRate + '%';
            document.getElementById('afcNorthFraction').textContent = `${afcNorthCorrect}/${afcNorthPicks.length}`;
            
            ['Dave', 'Chris', 'Rob', 'Jan'].forEach(host => {
                const hostPicks = draftPicks.filter(p => p.predictedHost === host && p.actualPlayer && p.isAFCNorth);
                const hostCorrect = hostPicks.filter(p => p.predictedPlayer && p.actualPlayer.toLowerCase().trim() === p.predictedPlayer.toLowerCase().trim()).length;
                const hostRate = hostPicks.length > 0 ? Math.round((hostCorrect / hostPicks.length) * 100) : 0;
                
                document.getElementById(`score${host}`).textContent = hostCorrect;
                document.getElementById(`pct${host}`).textContent = hostRate + '%';
            });
        }

        // Drag/drop handlers - Only swap prediction content, not official order
        let dragSrcId = null;

        function handleDragStart(e) {
            dragSrcId = this.dataset.pickId;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }

        function handleDragOver(e) {
            if (e.preventDefault) e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drop-target');
            return false;
        }

        function handleDragEnd() {
            this.classList.remove('dragging');
            document.querySelectorAll('.pick-row').forEach(row => row.classList.remove('drop-target'));
        }

        function handleDrop(e) {
            if (e.stopPropagation) e.stopPropagation();
            
            const dropTargetId = this.dataset.pickId;
            
            if (dragSrcId && dropTargetId && dragSrcId !== dropTargetId) {
                // Find the picks
                const srcPick = draftPicks.find(p => p.id === dragSrcId);
                const dstPick = draftPicks.find(p => p.id === dropTargetId);
                
                if (srcPick && dstPick) {
                    // Only swap prediction content, not the official slot data
                    const temp = {
                        predictedPlayer: srcPick.predictedPlayer,
                        predictedHost: srcPick.predictedHost,
                        actualPlayer: srcPick.actualPlayer,
                        notes: srcPick.notes
                    };
                    
                    srcPick.predictedPlayer = dstPick.predictedPlayer;
                    srcPick.predictedHost = dstPick.predictedHost;
                    srcPick.actualPlayer = dstPick.actualPlayer;
                    srcPick.notes = dstPick.notes;
                    
                    dstPick.predictedPlayer = temp.predictedPlayer;
                    dstPick.predictedHost = temp.predictedHost;
                    dstPick.actualPlayer = temp.actualPlayer;
                    dstPick.notes = temp.notes;
                    
                    saveDraftState();
                    renderPicks();
                    updateStats();
                }
            }
            
            return false;
        }

        // Round tabs
        function setRound(round) {
            currentRound = round;
            
            // Update tab styling
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

        // Filters
        function applyFilters() {
            filters.team = document.getElementById('filterTeam').value;
            filters.host = document.getElementById('filterHost').value;
            filters.result = document.getElementById('filterResult').value;
            renderPicks();
        }

        // Reset predictions (clear mutable fields only)
        function resetPredictions() {
            if (!confirm('Clear all predictions? This will remove predicted players and hosts, but keep actual draft results and notes.')) return;
            
            draftPicks.forEach(pick => {
                pick.predictedPlayer = '';
                pick.predictedHost = '';
            });
            saveDraftState();
            renderPicks();
            updateStats();
        }

        // Clear actuals
        function clearActuals() {
            if (!confirm('Clear all actual drafted players?')) return;
            
            draftPicks.forEach(pick => {
                pick.actualPlayer = '';
            });
            saveDraftState();
            renderPicks();
            updateStats();
        }

        // Export overlay data only
        function exportData() {
            const overlay = {};
            draftPicks.forEach(pick => {
                if (pick.predictedPlayer || pick.predictedHost || pick.actualPlayer || pick.notes) {
                    overlay[pick.id] = {
                        predictedPlayer: pick.predictedPlayer,
                        predictedHost: pick.predictedHost,
                        actualPlayer: pick.actualPlayer,
                        notes: pick.notes
                    };
                }
            });
            
            const data = {
                schemaVersion: STORAGE_SCHEMA_VERSION,
                officialVersion: OFFICIAL_VERSION,
                exportDate: new Date().toISOString(),
                overlay: overlay
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `afc-north-draft-overlay-2026-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        // Import overlay data
        function importData(input) {
            const file = input.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate
                    if (data.schemaVersion !== STORAGE_SCHEMA_VERSION) {
                        alert('Error: Import file uses an incompatible data format version.');
                        return;
                    }
                    if (data.officialVersion !== OFFICIAL_VERSION) {
                        alert('Error: Import file was created for a different draft order version.');
                        return;
                    }
                    
                    if (!data.overlay) {
                        alert('Error: Invalid import file format.');
                        return;
                    }
                    
                    // Merge into current picks
                    draftPicks = mergePicks(draftPicks, data.overlay);
                    saveDraftState();
                    renderPicks();
                    updateStats();
                    
                    alert('Import successful!');
                } catch (err) {
                    alert('Error importing file: ' + err.message);
                }
            };
            reader.readAsText(file);
            input.value = ''; // Reset input
        }

        // Initialize on load
        document.addEventListener('DOMContentLoaded', initializeDraftBoard);
    </script>
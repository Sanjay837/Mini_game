(function () {
    'use strict';

    // State
    const state = {
        level: 'easy',
        theme: 'candy',
        deck: 'emojis',
        firstPick: null,
        lockBoard: false,
        moves: 0,
        matches: 0,
        totalPairs: 0,
        timerInterval: null,
        secondsElapsed: 0,
    };

    // Elements
    const screens = {
        level: document.getElementById('screen-level'),
        game: document.getElementById('screen-game'),
        win: document.getElementById('screen-win'),
        leaderboard: document.getElementById('screen-leaderboard'),
        dashboard: document.getElementById('screen-dashboard')
    };
    const boardEl = document.getElementById('board');
    const sr = document.getElementById('sr-announcer');
    const timeEl = document.getElementById('time');
    const movesEl = document.getElementById('moves');
    const progressEl = document.getElementById('progress');
    const btnStart = document.getElementById('btn-start');
    const btnLeaderboard = document.getElementById('btn-leaderboard');
    const btnBackHome = document.getElementById('btn-back-home');
    const btnRestart = document.getElementById('btn-restart');
    const btnHomeTop = document.getElementById('btn-home-top');
    const btnHome = document.getElementById('btn-home');
    const btnPlayAgain = document.getElementById('btn-play-again');
    const btnNext = document.getElementById('btn-next');
    const btnHint = document.getElementById('btn-hint');
    const btnPeek = document.getElementById('btn-peek');
    const btnShuffle = document.getElementById('btn-shuffle');
    const difficultyInputs = document.querySelectorAll('input[name="difficulty"]');
    const themeSelect = document.getElementById('theme');
    const deckSelect = document.getElementById('deck');
    const btnTheme = document.getElementById('btn-theme');
    const btnMute = document.getElementById('btn-mute');
    // Settings
    const btnSettings = document.getElementById('btn-settings');
    const settingsBackdrop = document.getElementById('settings-backdrop');
    const btnSettingsClose = document.getElementById('btn-settings-close');
    const btnSettingsSave = document.getElementById('btn-settings-save');
    const btnSettingsCancel = document.getElementById('btn-settings-cancel');
    const musicVolume = document.getElementById('music-volume');
    const sfxVolume = document.getElementById('sfx-volume');
    const animSpeed = document.getElementById('anim-speed');
    const colorblind = document.getElementById('colorblind');
    const haptics = document.getElementById('haptics');
    const confirmRestart = document.getElementById('confirm-restart');
    const musicEnabled = document.getElementById('music-enabled');
    // Dashboard
    const btnDashboard = document.getElementById('btn-dashboard');
    const btnDashPlay = document.getElementById('btn-dash-play');
    const profileName = document.getElementById('profile-name');
    const profileEmoji = document.getElementById('profile-emoji');
    const profileAvatar = document.getElementById('profile-avatar');
    const btnProfileSave = document.getElementById('btn-profile-save');
    const ringProgress = document.getElementById('ring-progress');
    const ringLabel = document.getElementById('ring-label');
    const barChart = document.getElementById('bar-chart');
    const stGames = document.getElementById('st-games');
    const stWins = document.getElementById('st-wins');
    const stBest = document.getElementById('st-best');
    const stLeast = document.getElementById('st-least');
    const stAvgTime = document.getElementById('st-avg-time');
    const stAvgMoves = document.getElementById('st-avg-moves');
    const stStreak = document.getElementById('st-streak');

    // Leaderboard
    const lbSelect = document.getElementById('lb-difficulty');
    const lbList = document.getElementById('lb-list');
    const btnClearLb = document.getElementById('btn-clear-lb');

    // Audio
    const audio = {
        bg: document.getElementById('bg-music'),
        flip: document.getElementById('snd-flip'),
        match: document.getElementById('snd-match'),
        mismatch: document.getElementById('snd-mismatch'),
        victory: document.getElementById('snd-victory'),
        muted: false,
        musicVolume: 0.3,
        sfxVolume: 1
    };

    const EMOJI_DECK = ['🐶', '🐱', '🦊', '🐼', '🐵', '🦁', '🐯', '🐸', '🐨', '🐷', '🐹', '🦄', '🐙', '🐠', '🦋', '🌸', '🍓', '🍍', '🍉', '🍒', '🍇', '🥑', '🥝', '🍩', '🍪', '🍰', '🧁', '🎈', '🎲', '🎵', '⭐', '🌙'];
    const ANIMALS_DECK = ['🐶', '🐱', '🦊', '🐻', '🐯', '🦁', '🐷', '🐭', '🐹', '🐰', '🐨', '🐼', '🐸', '🐵'];
    const FRUITS_DECK = ['🍎', '🍊', '🍋', '🍐', '🍇', '🍓', '🍒', '🍑', '🍍', '🥝', '🍉', '🥭'];

    function getDeckSymbols(deck) {
        switch (deck) {
            case 'animals': return ANIMALS_DECK;
            case 'fruits': return FRUITS_DECK;
            default: return EMOJI_DECK;
        }
    }

    function setScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    function formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateHud() {
        timeEl.textContent = formatTime(state.secondsElapsed);
        movesEl.textContent = String(state.moves);
        const percent = Math.round((state.matches / state.totalPairs) * 100) || 0;
        progressEl.textContent = `${percent}%`;
    }

    function startTimer(initialSeconds = 0) {
        stopTimer();
        state.secondsElapsed = initialSeconds;
        updateHud();
        state.timerInterval = setInterval(() => {
            state.secondsElapsed += 1;
            updateHud();
            saveSession();
        }, 1000);
    }
    function stopTimer() { if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; } }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function buildBoard() {
        const deck = [...getDeckSymbols(state.deck)];
        const sizeMap = { easy: 8, medium: 12, hard: 16 }; // number of pairs
        const pairs = sizeMap[state.level];
        const picked = shuffle(deck).slice(0, pairs);
        const tiles = shuffle([...picked, ...picked]);
        state.totalPairs = pairs;
        state.matches = 0;
        state.moves = 0;
        state.firstPick = null;
        state.lockBoard = false;
        boardEl.innerHTML = '';

        const fragment = document.createDocumentFragment();
        tiles.forEach((symbol, index) => {
            const card = document.createElement('button');
            card.className = 'card-tile';
            card.setAttribute('aria-label', 'Memory card');
            card.setAttribute('data-symbol', symbol);
            card.setAttribute('data-index', String(index));
            card.setAttribute('role', 'gridcell');
            card.setAttribute('aria-rowindex', String(Math.floor(index / 4) + 1));
            card.setAttribute('aria-colindex', String((index % 4) + 1));
            card.innerHTML = `
				<div class="face front">❓</div>
				<div class="face back">${symbol}</div>
			`;
            card.addEventListener('click', onCardClick);
            fragment.appendChild(card);
        });
        boardEl.appendChild(fragment);
        updateHud();
        saveSession();
    }

    // Build board from saved session tiles
    function buildBoardFromSession(savedTiles) {
        const tiles = savedTiles;
        state.firstPick = null;
        state.lockBoard = false;
        boardEl.innerHTML = '';
        const fragment = document.createDocumentFragment();
        tiles.forEach((t, index) => {
            const card = document.createElement('button');
            card.className = 'card-tile';
            card.setAttribute('aria-label', 'Memory card');
            card.setAttribute('data-symbol', t.symbol);
            card.setAttribute('data-index', String(index));
            card.innerHTML = `
			<div class="face front">❓</div>
			<div class="face back">${t.symbol}</div>
		`;
            if (t.flipped) card.classList.add('flipped');
            if (t.matched) card.classList.add('matched');
            card.addEventListener('click', onCardClick);
            fragment.appendChild(card);
        });
        boardEl.appendChild(fragment);
        // restore first pick if exactly one flipped but not matched
        const candidates = [...boardEl.querySelectorAll('.card-tile.flipped:not(.matched)')];
        state.firstPick = candidates.length === 1 ? candidates[0] : null;
        updateHud();
    }

    function onCardClick(e) {
        const card = e.currentTarget;
        if (state.lockBoard) return;
        if (card.classList.contains('flipped')) return;
        flipSound();
        card.classList.add('flipped');
        if (!state.firstPick) {
            state.firstPick = card;
            saveSession();
            return;
        }
        state.moves += 1;
        const match = card.getAttribute('data-symbol') === state.firstPick.getAttribute('data-symbol');
        if (match) {
            matchSound();
            card.classList.add('matched');
            state.firstPick.classList.add('matched');
            state.firstPick = null;
            state.matches += 1;
            updateHud();
            saveSession();
            if (state.matches === state.totalPairs) {
                announce(`All pairs matched in ${formatTime(state.secondsElapsed)} and ${state.moves} moves.`);
                endGame(true);
            }
            return;
        }
        mismatchSound();
        state.lockBoard = true;
        card.classList.add('unmatched');
        state.firstPick.classList.add('unmatched');
        setTimeout(() => {
            card.classList.remove('flipped', 'unmatched');
            state.firstPick.classList.remove('flipped', 'unmatched');
            state.firstPick = null;
            state.lockBoard = false;
            updateHud();
            saveSession();
        }, 650);
    }

    // Screen reader announcements
    function announce(text) { if (sr) sr.textContent = text; }

    function startGame() {
        applyTheme(state.theme);
        setScreen('game');
        buildBoard();
        startTimer();
        playBg();
    }

    function endGame(won) {
        stopTimer();
        if (won) {
            saveScore();
            document.getElementById('final-time').textContent = formatTime(state.secondsElapsed);
            document.getElementById('final-moves').textContent = String(state.moves);
            setScreen('win');
            launchConfetti();
            clearSession();
            updateAggOnWin(state.secondsElapsed, state.moves);
            victorySound();
        }
    }

    // Power-ups
    function useHint() {
        const cards = [...boardEl.querySelectorAll('.card-tile:not(.matched)')];
        if (cards.length < 2) return;
        const map = new Map();
        for (const c of cards) {
            const s = c.getAttribute('data-symbol');
            if (map.has(s)) { map.get(s).push(c); } else { map.set(s, [c]); }
        }
        for (const [, pair] of map) {
            if (pair.length === 2) {
                pair.forEach(c => c.classList.add('hinting'));
                setTimeout(() => pair.forEach(c => c.classList.remove('hinting')), 800);
                break;
            }
        }
    }

    function usePeek() {
        const cards = [...boardEl.querySelectorAll('.card-tile:not(.matched):not(.flipped)')];
        cards.forEach(c => c.classList.add('flipped'));
        setTimeout(() => cards.forEach(c => c.classList.remove('flipped')), 900);
    }

    function useShuffle() {
        const current = [...boardEl.children].map(c => c.getAttribute('data-symbol'));
        const shuffled = shuffle(current);
        [...boardEl.children].forEach((el, i) => {
            el.setAttribute('data-symbol', shuffled[i]);
            el.querySelector('.back').textContent = shuffled[i];
        });
    }

    // Theme
    function applyTheme(theme) {
        document.body.classList.remove('theme-candy', 'theme-ocean', 'theme-forest', 'theme-sunset');
        document.body.classList.add(`theme-${theme}`);
        document.body.dataset.theme = theme;
    }

    // Leaderboard (localStorage)
    function getKey() { return 'mm_scores_v1'; }
    function readScores() {
        try { return JSON.parse(localStorage.getItem(getKey()) || '{}'); } catch { return {}; }
    }
    function writeScores(data) { localStorage.setItem(getKey(), JSON.stringify(data)); }
    function saveScore() {
        const all = readScores();
        const diff = state.level;
        const entry = { time: state.secondsElapsed, moves: state.moves, date: new Date().toISOString() };
        all[diff] = Array.isArray(all[diff]) ? all[diff] : [];
        all[diff].push(entry);
        all[diff].sort((a, b) => a.time - b.time || a.moves - b.moves);
        all[diff] = all[diff].slice(0, 20);
        writeScores(all);
    }
    function renderLeaderboard() {
        const all = readScores();
        const diff = lbSelect.value;
        const list = Array.isArray(all[diff]) ? all[diff] : [];
        lbList.innerHTML = '';
        list.forEach((item, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>#${i + 1}</span><span>${formatTime(item.time)}</span><span>${item.moves} moves</span>`;
            lbList.appendChild(li);
        });
    }

    // Dashboard data
    function readProfile() { try { return JSON.parse(localStorage.getItem('mm_profile_v1') || '{}'); } catch { return {}; } }
    function writeProfile(p) { localStorage.setItem('mm_profile_v1', JSON.stringify(p)); }
    function readAgg() { try { return JSON.parse(localStorage.getItem('mm_agg_v1') || '{"games":0,"wins":0,"bestTime":null,"leastMoves":null,"times":[],"streak":0}'); } catch { return { games: 0, wins: 0, bestTime: null, leastMoves: null, times: [], streak: 0 }; } }
    function writeAgg(a) { localStorage.setItem('mm_agg_v1', JSON.stringify(a)); }
    function updateAggOnWin(time, moves) {
        const a = readAgg();
        const isRecordTime = a.bestTime == null || time <= a.bestTime;
        const isRecordMoves = a.leastMoves == null || moves <= a.leastMoves;
        a.games += 1; a.wins += 1; a.streak += 1;
        a.bestTime = isRecordTime ? time : a.bestTime;
        a.leastMoves = isRecordMoves ? moves : a.leastMoves;
        a.times.push({ time, level: state.level, date: Date.now(), moves });
        a.times = a.times.slice(-10);
        writeAgg(a);
        localStorage.setItem('mm_last_v1', JSON.stringify({ time, moves, won: true, isRecord: (isRecordTime || isRecordMoves) }));
        if (isRecordTime || isRecordMoves) { try { launchConfetti(); } catch { } }
    }
    function updateAggOnLoss() { const a = readAgg(); a.games += 1; a.streak = 0; writeAgg(a); }
    function renderDashboard() {
        const p = readProfile();
        profileName.value = p.name || '';
        profileEmoji.value = p.emoji || '🙂';
        profileAvatar.textContent = p.emoji || '🙂';
        const a = readAgg();
        stGames.textContent = String(a.games || 0);
        stWins.textContent = String(a.wins || 0);
        stBest.textContent = a.bestTime != null ? formatTime(a.bestTime) : '--:--';
        stLeast.textContent = a.leastMoves != null ? String(a.leastMoves) : '--';
        const avgSec = a.times.length ? Math.round(a.times.reduce((s, t) => s + t.time, 0) / a.times.length) : 0;
        const avgMoves = a.times.length ? Math.round(a.times.reduce((s, t) => s + (t.moves || 0), 0) / a.times.length) : 0;
        stAvgTime.textContent = a.times.length ? formatTime(avgSec) : '--:--';
        stAvgMoves.textContent = a.times.length ? String(avgMoves) : '--';
        stStreak.textContent = String(a.streak || 0);
        const winPct = a.games ? Math.round((a.wins / a.games) * 100) : 0;
        ringLabel.textContent = `${winPct}%`;
        const circumference = 2 * Math.PI * 52; // r=52
        ringProgress.setAttribute('stroke-dasharray', `${(winPct / 100) * circumference} ${circumference}`);
        drawBarChart(a.times.map(t => t.time));
        try {
            const lastRaw = JSON.parse(localStorage.getItem('mm_last_v1') || 'null');
            if (lastRaw) {
                document.getElementById('lr-result').textContent = lastRaw.won ? 'Win' : 'Loss';
                document.getElementById('lr-time').textContent = formatTime(lastRaw.time || 0);
                document.getElementById('lr-moves').textContent = String(lastRaw.moves || 0);
                document.getElementById('lr-flags').innerHTML = lastRaw.isRecord ? '<span class="badge">New Record!</span>' : '';
            }
        } catch { }
    }
    function drawBarChart(values) {
        barChart.innerHTML = '';
        const max = Math.max(1, ...values);
        const width = 240, height = 120, pad = 10;
        values.forEach((v, i) => {
            const h = Math.max(4, Math.round((v / max) * (height - pad * 2)));
            const x = pad + i * (width - 2 * pad) / Math.max(1, values.length);
            const y = height - pad - h;
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', String(x));
            rect.setAttribute('y', String(y));
            rect.setAttribute('width', String(12));
            rect.setAttribute('height', String(h));
            rect.setAttribute('rx', '3');
            rect.setAttribute('fill', getComputedStyle(document.body).getPropertyValue('--secondary').trim() || '#7cd1ff');
            barChart.appendChild(rect);
        });
    }

    // Session persistence
    function sessionKey() { return 'mm_session_v1'; }
    function saveSession() {
        try {
            const tiles = [...boardEl.children].map(el => ({
                symbol: el.getAttribute('data-symbol'),
                flipped: el.classList.contains('flipped'),
                matched: el.classList.contains('matched')
            }));
            const data = {
                level: state.level,
                theme: state.theme,
                deck: state.deck,
                moves: state.moves,
                matches: state.matches,
                totalPairs: state.totalPairs,
                secondsElapsed: state.secondsElapsed,
                tiles
            };
            localStorage.setItem(sessionKey(), JSON.stringify(data));
        } catch { }
    }
    function clearSession() { try { localStorage.removeItem(sessionKey()); } catch { } }
    function loadSession() { try { const raw = localStorage.getItem(sessionKey()); return raw ? JSON.parse(raw) : null; } catch { return null; } }

    // Confetti (simple)
    function launchConfetti() {
        const canvas = document.getElementById('confetti');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const pieces = Array.from({ length: 180 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            size: 4 + Math.random() * 6,
            color: `hsl(${Math.random() * 360},90%,60%)`,
            speed: 2 + Math.random() * 3,
            spin: Math.random() * 2 * Math.PI
        }));
        let anim;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                p.y += p.speed;
                p.x += Math.sin((p.y + p.spin) * 0.02) * 1.2;
                if (p.y > canvas.height) p.y = -10;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });
            anim = requestAnimationFrame(draw);
        }
        draw();
        setTimeout(() => cancelAnimationFrame(anim), 3500);
    }

    // Audio helpers
    function applyVolumes() {
        audio.bg.volume = audio.musicVolume;
        audio.flip.volume = audio.sfxVolume;
        audio.match.volume = audio.sfxVolume;
        audio.mismatch.volume = audio.sfxVolume;
        audio.victory.volume = audio.sfxVolume;
    }
    function playBg() { if (!audio.muted && readSettings().musicEnabled !== false) { applyVolumes(); audio.bg.play().catch(() => { }); } }
    function toggleMute() {
        audio.muted = !audio.muted;
        [audio.bg, audio.flip, audio.match, audio.mismatch].forEach(a => a.muted = audio.muted);
        btnMute.textContent = audio.muted ? '🔇' : '🔊';
        if (audio.muted) { audio.bg.pause(); } else { playBg(); }
    }
    function flipSound() { if (!audio.muted) { applyVolumes(); audio.flip.play().catch(() => { }); } }
    function matchSound() { if (!audio.muted) { applyVolumes(); audio.match.play().catch(() => { }); } }
    function mismatchSound() { if (!audio.muted) { applyVolumes(); audio.mismatch.play().catch(() => { }); } }
    function victorySound() { if (!audio.muted) { applyVolumes(); audio.victory.play().catch(() => { }); } }

    // Events
    btnStart.addEventListener('click', (e) => {
        e.preventDefault();
        const checked = [...difficultyInputs].find(i => i.checked);
        state.level = checked ? checked.value : 'easy';
        state.theme = themeSelect.value;
        state.deck = deckSelect.value;
        startGame();
    });
    btnLeaderboard.addEventListener('click', (e) => { e.preventDefault(); setScreen('leaderboard'); renderLeaderboard(); });
    btnDashboard.addEventListener('click', () => { setScreen('dashboard'); renderDashboard(); });
    btnDashPlay.addEventListener('click', () => { setScreen('level'); });
    btnProfileSave.addEventListener('click', () => { writeProfile({ name: profileName.value.trim(), emoji: profileEmoji.value }); renderDashboard(); });
    btnBackHome.addEventListener('click', () => { setScreen('level'); clearSession(); stopTimer(); });
    btnRestart.addEventListener('click', () => {
        const settings = (function () { try { return JSON.parse(localStorage.getItem('mm_settings_v1') || '{}'); } catch { return {}; } })();
        if (settings.confirmRestart && !confirm('Restart current game?')) return;
        buildBoard(); startTimer();
    });
    btnHome.addEventListener('click', () => { setScreen('level'); clearSession(); stopTimer(); });
    btnHomeTop.addEventListener('click', () => { setScreen('level'); clearSession(); stopTimer(); });
    btnPlayAgain.addEventListener('click', () => { setScreen('game'); buildBoard(); startTimer(); });
    btnNext.addEventListener('click', () => {
        state.level = state.level === 'easy' ? 'medium' : state.level === 'medium' ? 'hard' : 'hard';
        setScreen('game'); buildBoard(); startTimer();
    });
    btnHint.addEventListener('click', useHint);
    btnPeek.addEventListener('click', usePeek);
    btnShuffle.addEventListener('click', useShuffle);
    btnTheme.addEventListener('click', () => {
        const themes = ['candy', 'ocean', 'forest', 'sunset'];
        const idx = themes.indexOf(state.theme);
        state.theme = themes[(idx + 1) % themes.length];
        applyTheme(state.theme);
    });
    btnMute.addEventListener('click', toggleMute);
    window.addEventListener('beforeunload', () => stopTimer());
    lbSelect.addEventListener('change', renderLeaderboard);
    btnClearLb.addEventListener('click', () => { localStorage.removeItem(getKey()); renderLeaderboard(); });

    // Settings events
    function openSettings() {
        settingsBackdrop.hidden = false;
        musicVolume.value = String(audio.musicVolume);
        sfxVolume.value = String(audio.sfxVolume);
        animSpeed.value = document.body.classList.contains('reduced-motion') ? 'reduced' : 'normal';
        colorblind.checked = document.body.classList.contains('high-contrast');
        haptics.checked = !!readSettings().haptics;
        confirmRestart.checked = !!readSettings().confirmRestart;
        // Focus trap start
        const focusables = settingsBackdrop.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        function trap(e) {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) { if (document.activeElement === first) { last.focus(); e.preventDefault(); } }
            else { if (document.activeElement === last) { first.focus(); e.preventDefault(); } }
        }
        settingsBackdrop.addEventListener('keydown', trap);
        setTimeout(() => first && first.focus(), 0);
        settingsBackdrop.dataset.trap = '1';
    }
    function closeSettings() {
        settingsBackdrop.hidden = true;
        if (settingsBackdrop.dataset.trap) {
            settingsBackdrop.removeAttribute('data-trap');
        }
        btnSettings.focus();
    }
    function readSettings() { try { return JSON.parse(localStorage.getItem('mm_settings_v1') || '{}'); } catch { return {}; } }
    function writeSettings(s) { localStorage.setItem('mm_settings_v1', JSON.stringify(s)); }
    function applySettings(s) {
        if (!s) return;
        if (typeof s.musicVolume === 'number') audio.musicVolume = s.musicVolume;
        if (typeof s.sfxVolume === 'number') audio.sfxVolume = s.sfxVolume;
        if (s.anim === 'reduced') document.body.classList.add('reduced-motion'); else document.body.classList.remove('reduced-motion');
        if (s.colorblind) document.body.classList.add('high-contrast'); else document.body.classList.remove('high-contrast');
        applyVolumes();
        if (s.musicEnabled === false) { audio.bg.pause(); }
    }
    btnSettings.addEventListener('click', openSettings);
    btnSettingsClose.addEventListener('click', closeSettings);
    btnSettingsCancel.addEventListener('click', closeSettings);
    settingsBackdrop.addEventListener('click', (e) => { if (e.target === settingsBackdrop) closeSettings(); });
    btnSettingsSave.addEventListener('click', () => {
        const s = readSettings();
        const next = {
            ...s,
            musicVolume: Number(musicVolume.value),
            sfxVolume: Number(sfxVolume.value),
            anim: animSpeed.value,
            colorblind: !!colorblind.checked,
            haptics: !!haptics.checked,
            confirmRestart: !!confirmRestart.checked,
            musicEnabled: !!musicEnabled.checked
        };
        writeSettings(next);
        applySettings(next);
        closeSettings();
    });

    // Accessibility: keyboard flip via Enter/Space
    boardEl.addEventListener('keydown', (e) => {
        const focusable = [...boardEl.querySelectorAll('.card-tile')];
        const idx = focusable.indexOf(document.activeElement);
        const cols = 4; // default; grid is responsive but we provide basic navigation
        if (e.key === 'ArrowRight' && idx > -1) { focusable[Math.min(idx + 1, focusable.length - 1)].focus(); e.preventDefault(); }
        if (e.key === 'ArrowLeft' && idx > -1) { focusable[Math.max(idx - 1, 0)].focus(); e.preventDefault(); }
        if (e.key === 'ArrowDown' && idx > -1) { focusable[Math.min(idx + cols, focusable.length - 1)].focus(); e.preventDefault(); }
        if (e.key === 'ArrowUp' && idx > -1) { focusable[Math.max(idx - cols, 0)].focus(); e.preventDefault(); }
        if (e.key === 'Enter' || e.key === ' ') {
            const active = document.activeElement;
            if (active && active.classList.contains('card-tile')) {
                active.click();
                e.preventDefault();
            }
        }
    });

    // Init: apply saved settings, then try session restore
    applySettings((function () { try { return JSON.parse(localStorage.getItem('mm_settings_v1') || '{}'); } catch { return {}; } })());
    // Init: try session restore first
    const restored = loadSession();
    if (restored && Array.isArray(restored.tiles) && restored.tiles.length > 0) {
        state.level = restored.level || state.level;
        state.theme = restored.theme || state.theme;
        state.deck = restored.deck || state.deck;
        state.moves = restored.moves || 0;
        state.matches = restored.matches || 0;
        state.totalPairs = restored.totalPairs || 0;
        applyTheme(state.theme);
        setScreen('game');
        buildBoardFromSession(restored.tiles);
        startTimer(restored.secondsElapsed || 0);
        playBg();
    } else {
        setScreen('level');
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => { });
    }
})();



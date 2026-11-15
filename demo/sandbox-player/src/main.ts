import '../../../module/src/player/savanna-player.ts';
import type { SavannaPlayer } from '../../../module/src/player/savanna-player.ts';

const player = document.getElementById('lesson-player') as SavannaPlayer | null;
const eventLog = document.getElementById('event-log');
const stateText = document.getElementById('state-text');
const timeText = document.getElementById('time-text');
const durationText = document.getElementById('duration-text');
const volumeText = document.getElementById('volume-text');
const captionsText = document.getElementById('captions-text');
const signText = document.getElementById('sign-text');
const adText = document.getElementById('ad-text');
const toggleShortcuts = document.getElementById('toggle-shortcuts') as HTMLInputElement | null;
const btnLoadMock = document.getElementById('btn-load-mock');
const btnLoadStandalone = document.getElementById('btn-load-standalone');
const btnResetChecks = document.getElementById('btn-reset-checks');
const checklistScore = document.getElementById('checklist-score');

function appendLog(message: string): void {
    if (!eventLog) return;
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] ${message}\n`;
    eventLog.textContent = entry + eventLog.textContent;
}

// 14-item checklist tracking
const verifiedShortcuts = new Set<string>();

function markChecked(key: string): void {
    const row = document.querySelector(`.checklist-item[data-key="${key}"]`);
    if (row && !verifiedShortcuts.has(key)) {
        verifiedShortcuts.add(key);
        row.classList.add('passed');
        const statusCell = row.querySelector('.check-status');
        if (statusCell) {
            statusCell.textContent = '✓ Verified';
        }
        if (checklistScore) {
            checklistScore.textContent = `${verifiedShortcuts.size} / 14 Verified`;
        }
    }
}

function updateStateIndicators(): void {
    if (!player || !player.media) return;
    const m = player.media;

    if (stateText) {
        stateText.textContent = m.paused ? 'Paused' : 'Playing';
    }
    if (timeText) {
        timeText.textContent = `${m.currentTime.toFixed(2)}s`;
    }
    if (durationText) {
        durationText.textContent = Number.isFinite(m.duration) ? `${m.duration.toFixed(2)}s` : '--';
    }
    if (volumeText) {
        const pct = Math.round(m.volume * 100);
        volumeText.textContent = `${pct}% (${m.muted ? 'Muted' : 'Unmuted'})`;
    }
    if (captionsText) {
        const tracks = m.textTracks ? Array.from(m.textTracks) : [];
        const active = tracks.find(t => t.mode === 'showing');
        captionsText.textContent = active ? `${active.label || active.language} (${active.mode})` : 'Off';
    }
    if (signText) {
        signText.textContent = player.showSignWindow ? 'Visible' : 'Hidden';
    }
    if (adText) {
        adText.textContent = player.audioDescriptionEnabled ? 'Enabled' : 'Disabled';
    }
}

// Listen for keyboard events on player to check off test items
if (player) {
    player.addEventListener('keydown', (e) => {
        if (player.disableShortcuts) return;
        const target = e.composedPath()[0] as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
            return;
        }

        switch (e.key) {
            case 'k':
            case 'K':
                markChecked('K');
                break;
            case ' ':
                markChecked('Space');
                break;
            case 'j':
            case 'J':
                markChecked('J');
                break;
            case 'l':
            case 'L':
                markChecked('L');
                break;
            case 'ArrowLeft':
                markChecked('ArrowLeft');
                break;
            case 'ArrowRight':
                markChecked('ArrowRight');
                break;
            case 'ArrowUp':
                markChecked('ArrowUp');
                break;
            case 'ArrowDown':
                markChecked('ArrowDown');
                break;
            case 'm':
            case 'M':
                markChecked('M');
                break;
            case 'c':
            case 'C':
                markChecked('C');
                break;
            case 's':
            case 'S':
                markChecked('S');
                break;
            case 'd':
            case 'D':
                markChecked('D');
                break;
            case 'f':
            case 'F':
                markChecked('F');
                break;
            case '?':
                markChecked('?');
                break;
        }
        setTimeout(updateStateIndicators, 50);
    });
}

// C2 Events observed from the player
const eventNames = [
    'savanna:ready',
    'savanna:play',
    'savanna:pause',
    'savanna:seek',
    'savanna:timeupdate',
    'savanna:caption-change',
    'savanna:error',
];

eventNames.forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
        const detail = (event as CustomEvent).detail;
        const detailStr = detail ? JSON.stringify(detail) : 'none';

        if (eventName === 'savanna:timeupdate') {
            updateStateIndicators();
            return;
        }

        updateStateIndicators();
        appendLog(`${eventName} | detail: ${detailStr}`);
    });
});

// Toggle shortcuts property (WCAG 2.1.4 test)
if (toggleShortcuts && player) {
    toggleShortcuts.addEventListener('change', () => {
        player.disableShortcuts = toggleShortcuts.checked;
        appendLog(`Shortcuts ${toggleShortcuts.checked ? 'DISABLED' : 'ENABLED'} via disableShortcuts attribute`);
    });
}

// Switching between L-103 (Full Lesson) and L-102 (Minimal Lesson)
const btnLoadL103 = document.getElementById('btn-load-l103');
const btnLoadL102 = document.getElementById('btn-load-l102');
const pageLessonTitle = document.getElementById('page-lesson-title');
const pageLessonTitleAm = document.getElementById('page-lesson-title-am');
const badgeLessonId = document.getElementById('badge-lesson-id');
const mockDataTitle = document.getElementById('mock-data-title');
const mockRawLink = document.getElementById('mock-raw-link') as HTMLAnchorElement | null;
const mockJsonDisplay = document.getElementById('mock-json-display');
const breadcrumbLesson = document.getElementById('breadcrumb-lesson');

if (btnLoadL103 && player) {
    btnLoadL103.addEventListener('click', async () => {
        player.lesson = 'L-103';
        player.api = 'http://localhost:4010';
        player.lang = 'en';
        if (pageLessonTitle) pageLessonTitle.textContent = 'The Future of the VA Industry';
        if (badgeLessonId) badgeLessonId.textContent = 'Module 2 · Concept 2.1 (L-103)';
        if (breadcrumbLesson) breadcrumbLesson.textContent = 'Concept 2.1: The Future of the VA Industry';
        if (mockDataTitle) mockDataTitle.textContent = 'Active Mock Data (contracts/fixtures/v1/lessons/L-103.json)';
        if (mockRawLink) mockRawLink.href = 'http://localhost:4010/v1/lessons/L-103';
        appendLog('Switched to L-103 (Full Lesson: Sign, AD, Captions, Pack)');

        try {
            const res = await fetch('http://localhost:4010/v1/lessons/L-103');
            if (res.ok && mockJsonDisplay) {
                const data = await res.json();
                mockJsonDisplay.textContent = JSON.stringify(data, null, 2);
            }
        } catch {}
    });
}

if (btnLoadL102 && player) {
    btnLoadL102.addEventListener('click', async () => {
        player.lesson = 'L-102';
        player.api = 'http://localhost:4010';
        player.lang = 'en';
        if (pageLessonTitle) pageLessonTitle.textContent = 'Introduction to Databases';
        if (badgeLessonId) badgeLessonId.textContent = 'Module 1 · Lesson 102 (Minimal)';
        if (breadcrumbLesson) breadcrumbLesson.textContent = 'Lesson 102: Databases (Minimal)';
        if (mockDataTitle) mockDataTitle.textContent = 'Active Mock Data (contracts/fixtures/v1/lessons/L-102.json)';
        if (mockRawLink) mockRawLink.href = 'http://localhost:4010/v1/lessons/L-102';
        appendLog('Switched to L-102 (Minimal Lesson)');

        try {
            const res = await fetch('http://localhost:4010/v1/lessons/L-102');
            if (res.ok && mockJsonDisplay) {
                const data = await res.json();
                mockJsonDisplay.textContent = JSON.stringify(data, null, 2);
            }
        } catch {}
    });
}

// Reset checklist
if (btnResetChecks) {
    btnResetChecks.addEventListener('click', () => {
        verifiedShortcuts.clear();
        document.querySelectorAll('.checklist-item').forEach((row) => {
            row.classList.remove('passed');
            const statusCell = row.querySelector('.check-status');
            if (statusCell) statusCell.textContent = '∯ Not tested';
        });
        if (checklistScore) {
            checklistScore.textContent = '0 / 14 Verified';
        }
        appendLog('Reset testing checklist score.');
    });
}

import '../../../module/src/player/savanna-player.ts';
import '../../../module/src/sign-window/sign-window.ts';
import '../../../module/src/audio-description/audio-description.ts';
import '../../../module/src/offline/offline.ts';
import type { SavannaPlayer } from '../../../module/src/player/savanna-player.ts';

const player = document.getElementById('lesson-player') as SavannaPlayer | null;
const apiBase = window.location.origin;
if (player) player.api = apiBase;
const offline = document.querySelector('savanna-offline') as (HTMLElement & { api: string }) | null;
if (offline) offline.api = apiBase;
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
const observedShortcuts = new Set<string>();

function markChecked(key: string): void {
    const row = document.querySelector(`.checklist-item[data-key="${key}"]`);
    if (row && !observedShortcuts.has(key)) {
        observedShortcuts.add(key);
        row.classList.add('observed');
        const statusCell = row.querySelector('.check-status');
        if (statusCell) {
            statusCell.textContent = 'Key observed';
        }
        if (checklistScore) {
            checklistScore.textContent = `${observedShortcuts.size} / 14 keys observed`;
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

// Switching between the two published sample lesson records.
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
        player.api = apiBase;
        if (offline) offline.setAttribute('lesson-id', 'L-103');
        player.lang = currentHostLang;
        applyHostLanguage(currentHostLang);
        if (mockDataTitle) mockDataTitle.textContent = 'Active Mock Data (contracts/fixtures/v1/lessons/L-103.json)';
        if (mockRawLink) mockRawLink.href = `${apiBase}/v1/lessons/L-103`;
        appendLog('Opened L-103 (Amharic transcript demo; sign video and audio description unavailable)');

        try {
            const res = await fetch(`${apiBase}/v1/lessons/L-103`, {
                headers: { 'X-Savanna-Key': player.apiKey },
            });
            if (res.ok && mockJsonDisplay) {
                const data = await res.json();
                mockJsonDisplay.textContent = JSON.stringify(data, null, 2);
            }
        } catch { }
    });
}

if (btnLoadL102 && player) {
    btnLoadL102.addEventListener('click', async () => {
        player.lesson = 'L-102';
        player.api = apiBase;
        if (offline) offline.setAttribute('lesson-id', 'L-102');
        player.lang = currentHostLang;
        applyHostLanguage(currentHostLang);
        if (mockDataTitle) mockDataTitle.textContent = 'Active Mock Data (contracts/fixtures/v1/lessons/L-102.json)';
        if (mockRawLink) mockRawLink.href = `${apiBase}/v1/lessons/L-102`;
        appendLog('Opened L-102 sample lesson');

        try {
            const res = await fetch(`${apiBase}/v1/lessons/L-102`, {
                headers: { 'X-Savanna-Key': player.apiKey },
            });
            if (res.ok && mockJsonDisplay) {
                const data = await res.json();
                mockJsonDisplay.textContent = JSON.stringify(data, null, 2);
            }
        } catch { }
    });
}

// Contract C4: Bilingual Host Page Localization (English <-> Amharic)
let currentHostLang: 'en' | 'am' = 'en';

const hostI18n = {
    en: {
        brand: 'Learning Portal',
        learner: 'Learner: Demo',
        crumbCourses: 'Courses',
        crumbTrack: 'Savanna Access Kit',
        crumbModule: 'Sample lessons',
        lessonTitleL103: 'Learning through short videos',
        lessonTitleL102: 'Learning through short videos',
        badgeL103: 'L-103 · Amharic transcript demo',
        badgeL102: 'L-102 · Sample lesson',
        durationL103: 'Duration: <strong>120 seconds</strong>',
        durationL102: 'Duration: <strong>120 seconds</strong>',
        btnBefore: 'Previous lesson is not included in this demo',
        btnLoadL103: 'Open L-103 transcript demo',
        btnLoadL102: 'Open L-102 sample lesson',
        btnAfter: 'Next lesson is not included in this demo',
        summaryHeading: 'Lesson Summary',
        summaryCardL103: 'The speaker reflects on learning from online videos and compares short video segments with long lectures. The 4 minute 12 second figure is presented as the speaker’s premise, not as a verified current statistic.',
        summaryCardL102: 'The speaker reflects on learning from online videos and compares short video segments with long lectures. The 4 minute 12 second figure is presented as the speaker’s premise, not as a verified current statistic.',
        kp1: '<strong>4:12:</strong> The speaker presents this as a personal premise, not a verified current statistic.',
        kp2: '<strong>Short and long formats:</strong> The speaker compares short online-video segments with a longer lecture.',
        kp3: '<strong>Interpretation:</strong> This personal reflection does not show that all learning follows one fixed duration.',
        studyNotesLabel: 'Learner Study Notes:',
        studyNotesPlaceholder: 'Type personal study notes here (player shortcuts are safely disabled while typing)...',
        studyNotesAria: 'Learner study notes',
        curriculumHeading: 'Available sample lessons',
        curr0: 'L-102 · Learning through short videos',
        curr1: 'L-103 · Amharic transcript demo',
        detailsHeading: 'Lesson Details',
        sideTrack: 'Demo: <strong>sample video lessons</strong>',
        sideAccess: 'Accessibility: <strong>English and Amharic captions; sign video and audio description unavailable</strong>',
        sideHint: 'Press <kbd>?</kbd> anytime on the player for keyboard shortcuts help.',
        signTitle: 'Sign-language panel (unavailable for this lesson)',
        signHint: 'No verified Ethiopian Sign Language recording is supplied.',
        alxHeroIntro: 'This sample recording reflects on learning from online videos. The speaker compares short video segments with longer lectures; the 4:12 figure is the speaker’s premise, not a verified current statistic.',
        objectivesHeading: 'This sample lesson helps learners:',
        obj1: 'Describe the speaker’s reflection on learning from online videos.',
        obj2: 'Compare the speaker’s view of short video segments with a longer lecture.',
        obj3: 'Recognize that the 4:12 figure is a personal premise, not a verified current statistic.',
        obj4: 'Use the English and Amharic captions and transcript controls.',
        obj5: 'Try keyboard playback controls; sign video and audio description are unavailable for these lesson records.',
    },
    am: {
        brand: 'የትምህርት ፖርታል',
        learner: 'ተማሪ: ማሳያ',
        crumbCourses: 'ኮርሶች',
        crumbTrack: 'ሳቫና አክሰስ ኪት',
        crumbModule: 'የማሳያ ትምህርቶች',
        lessonTitleL103: 'በአጭር ቪዲዮዎች መማር',
        lessonTitleL102: 'በአጭር ቪዲዮዎች መማር',
        badgeL103: 'L-103 · የአማርኛ ግልባጭ ማሳያ',
        badgeL102: 'L-102 · የማሳያ ትምህርት',
        durationL103: 'የቆይታ ጊዜ: <strong>120 ሰከንድ</strong>',
        durationL102: 'የቆይታ ጊዜ: <strong>120 ሰከንድ</strong>',
        btnBefore: 'ያለፈው ትምህርት በዚህ ማሳያ ውስጥ የለም',
        btnLoadL103: 'የ L-103 ግልባጭ ማሳያን ክፈት',
        btnLoadL102: 'የ L-102 ማሳያ ትምህርትን ክፈት',
        btnAfter: 'ቀጣዩ ትምህርት በዚህ ማሳያ ውስጥ የለም',
        summaryHeading: 'የትምህርት ማጠቃለያ',
        summaryCardL103: 'ተናጋሪው ከመስመር ላይ ቪዲዮዎች ስለመማር ያሰላስላል፤ አጭር የቪዲዮ ክፍሎችን ከረጅም ንግግሮች ጋር ያነጻጽራል። የ4 ደቂቃ ከ12 ሰከንድ ቁጥር የተናጋሪው አስተያየት ነው፤ የዛሬ የተረጋገጠ ስታቲስቲክስ አይደለም።',
        summaryCardL102: 'ተናጋሪው ከመስመር ላይ ቪዲዮዎች ስለመማር ያሰላስላል፤ አጭር የቪዲዮ ክፍሎችን ከረጅም ንግግሮች ጋር ያነጻጽራል። የ4 ደቂቃ ከ12 ሰከንድ ቁጥር የተናጋሪው አስተያየት ነው፤ የዛሬ የተረጋገጠ ስታቲስቲክስ አይደለም።',
        kp1: '<strong>4:12:</strong> ተናጋሪው ይህንን እንደ የግል አስተያየት እንጂ የዛሬ የተረጋገጠ ስታቲስቲክስ እንዳልሆነ ያቀርበዋል።',
        kp2: '<strong>አጭርና ረጅም ቅርጾች:</strong> ተናጋሪው አጭር የመስመር ላይ ቪዲዮ ክፍሎችን ከረጅም ንግግር ጋር ያነጻጽራል።',
        kp3: '<strong>ትርጓሜ:</strong> ይህ የግል አስተያየት ሁሉም መማር አንድ ቋሚ ጊዜ እንደሚከተል አያሳይም።',
        studyNotesLabel: 'የተማሪው የጥናት ማስታወሻዎች:',
        studyNotesPlaceholder: 'የግል ጥናት ማስታወሻዎችን እዚህ ይጻፉ (በመጻፍ ወቅት የተጫዋች አቋራጮች በደህና ይቦዝናሉ)...',
        studyNotesAria: 'የተማሪው የጥናት ማስታወሻዎች',
        curriculumHeading: 'ያሉ የማሳያ ትምህርቶች',
        curr0: 'L-102 · በአጭር ቪዲዮዎች መማር',
        curr1: 'L-103 · የአማርኛ ግልባጭ ማሳያ',
        detailsHeading: 'የትምህርት ዝርዝሮች',
        sideTrack: 'ማሳያ: <strong>የቪዲዮ ትምህርቶች</strong>',
        sideAccess: 'ተደራሽነት: <strong>የእንግሊዝኛና የአማርኛ ግርጌ ጽሑፎች አሉ፤ የምልክት ቪዲዮና የድምፅ መግለጫ የሉም</strong>',
        sideHint: 'የቁልፍ ሰሌዳ አቋራጮች እገዛ ለማግኘት በማጫወቻው ላይ በማንኛውም ጊዜ <kbd>?</kbd>ን ይጫኑ።',
        signTitle: 'የምልክት ቋንቋ መስኮት (ለዚህ ትምህርት የለም)',
        signHint: 'የተረጋገጠ የኢትዮጵያ ምልክት ቋንቋ ቀረጻ አልቀረበም።',
        alxHeroIntro: 'ይህ የማሳያ ቀረጻ ከመስመር ላይ ቪዲዮዎች ስለመማር የሚያሰላስል ንግግር ያቀርባል። ተናጋሪው አጭር የቪዲዮ ክፍሎችን ከረጅም ንግግር ጋር ያነጻጽራል፤ የ4:12 ቁጥር የግል አስተያየቱ ነው፣ ዛሬ የተረጋገጠ ስታቲስቲክስ አይደለም።',
        objectivesHeading: 'ይህ የማሳያ ትምህርት ተማሪዎችን የሚያግዘው፦',
        obj1: 'ተናጋሪው ከመስመር ላይ ቪዲዮዎች ስለመማር ያቀረበውን አስተያየት መግለጽ።',
        obj2: 'ተናጋሪው አጭር ቪዲዮዎችን ከረጅም ንግግር ጋር እንዴት እንዳነጻጸረ መለየት።',
        obj3: 'የ4:12 ቁጥር የግል አስተያየት እንጂ የተረጋገጠ የዛሬ ስታቲስቲክስ እንዳልሆነ መረዳት።',
        obj4: 'የእንግሊዝኛና የአማርኛ ግርጌ ጽሑፎችን እና የግልባጭ መቆጣጠሪያዎችን መጠቀም።',
        obj5: 'የቁልፍ ሰሌዳ መቆጣጠሪያዎችን መሞከር፤ የምልክት ቪዲዮና የድምፅ መግለጫ በእነዚህ መዝገቦች ውስጥ የሉም።',
    }
};

function applyHostLanguage(lang: 'en' | 'am'): void {
    currentHostLang = lang;
    const t = hostI18n[lang];
    const isL102 = player?.lesson === 'L-102';

    const setHtml = (id: string, html: string) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    };
    const setText = (id: string, text: string) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('nav-brand-title', t.brand);
    setText('nav-learner-badge', t.learner);
    setText('crumb-courses', t.crumbCourses);
    setText('crumb-track', t.crumbTrack);
    setText('crumb-module', t.crumbModule);
    setText('breadcrumb-lesson', isL102 ? t.lessonTitleL102 : t.lessonTitleL103);
    setText('badge-lesson-id', isL102 ? t.badgeL102 : t.badgeL103);
    setHtml('lesson-duration', isL102 ? t.durationL102 : t.durationL103);
    setText('page-lesson-title', isL102 ? t.lessonTitleL102 : t.lessonTitleL103);

    setText('btn-before', t.btnBefore);
    setText('btn-load-l103', t.btnLoadL103);
    setText('btn-load-l102', t.btnLoadL102);
    setText('btn-after', t.btnAfter);

    setText('alx-hero-intro', t.alxHeroIntro);
    setText('objectives-heading', t.objectivesHeading);
    setText('obj-1', t.obj1);
    setText('obj-2', t.obj2);
    setText('obj-3', t.obj3);
    setText('obj-4', t.obj4);
    setText('obj-5', t.obj5);

    setText('summary-heading', t.summaryHeading);
    setText('summary-card-text', isL102 ? t.summaryCardL102 : t.summaryCardL103);
    setHtml('kp-1', t.kp1);
    setHtml('kp-2', t.kp2);
    setHtml('kp-3', t.kp3);

    setText('lbl-study-notes', t.studyNotesLabel);
    const testInput = document.getElementById('test-input') as HTMLInputElement | null;
    if (testInput) {
        testInput.placeholder = t.studyNotesPlaceholder;
        testInput.setAttribute('aria-label', t.studyNotesAria);
    }

    setText('sidebar-curriculum-heading', t.curriculumHeading);
    const setCurrItem = (id: string, title: string, status?: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        const spans = el.querySelectorAll('span');
        if (spans[0]) spans[0].textContent = title;
        if (spans[1] && status) spans[1].textContent = status;
    };
    setCurrItem('curr-0', t.curr0);
    setCurrItem('curr-1', t.curr1);

    setText('sidebar-details-heading', t.detailsHeading);
    setHtml('side-track', t.sideTrack);
    setHtml('side-access', t.sideAccess);
    setHtml('side-hint', t.sideHint);

    setText('mock-sign-title', t.signTitle);
    setText('mock-sign-hint', t.signHint);

    // Update navbar language switcher pill text
    const btnLangToggle = document.getElementById('btn-lang-toggle');
    if (btnLangToggle) {
        btnLangToggle.textContent = lang === 'am' ? '🌐 English (EN)' : '🌐 አማርኛ (AM)';
    }

    // FR-P10: Screen reader lang attribute tagging
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('lang', lang);
}

// Wire navbar language switcher button
const btnLangToggle = document.getElementById('btn-lang-toggle');
if (btnLangToggle && player) {
    btnLangToggle.addEventListener('click', () => {
        const nextLang = currentHostLang === 'am' ? 'en' : 'am';
        player.setLanguage(nextLang);
    });
}

// Contract C4: Listen for global language switch event
window.addEventListener('savanna:lang-change', (event: Event) => {
    const detail = (event as CustomEvent<{ lang?: 'en' | 'am' }>).detail;
    if (detail?.lang) {
        applyHostLanguage(detail.lang);
        appendLog(`Contract C4: Host page translated to ${detail.lang.toUpperCase()}`);
    }
});

// Restore saved language preference on load
try {
    const raw = localStorage.getItem('savanna.prefs.v1');
    if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.ui?.lang === 'am') {
            applyHostLanguage('am');
        }
    }
} catch { }

// Reset checklist
if (btnResetChecks) {
    btnResetChecks.addEventListener('click', () => {
        observedShortcuts.clear();
        document.querySelectorAll('.checklist-item').forEach((row) => {
            row.classList.remove('observed');
            const statusCell = row.querySelector('.check-status');
            if (statusCell) statusCell.textContent = '∯ Not tested';
        });
        if (checklistScore) {
            checklistScore.textContent = '0 / 14 keys observed';
        }
        appendLog('Reset testing checklist score.');
    });
}

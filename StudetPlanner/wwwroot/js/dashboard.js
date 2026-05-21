/* ═══════════════════════════════════════════
   DASHBOARD — wwwroot/js/dashboard.js
   ═══════════════════════════════════════════ */

const { tasks: allTasks, subjects: allSubjects, antiForgery } = window.DASHBOARD_DATA;

const COLORS = ['#ff4fd8', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
const palette = ['#ff4fd8', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];
const getColor = id => palette[(id ?? 0) % palette.length];

function localDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ── URGENCY ─────────────────────────────── */
function getUrgency(t) {
    if (!t.deadline || t.status === 2) return null;
    const diff = new Date(t.deadline) - new Date();
    if (diff < 0) return 'overdue';
    if (diff < 3 * 3600 * 1000) return 'urgent';
    if (diff < 24 * 3600 * 1000) return 'soon';
    return null;
}
function urgencyCardClass(u) {
    return u ? ` task-card--${u}` : '';
}
function urgencyBorderColor(u, base) {
    if (u === 'overdue' || u === 'urgent' || u === 'soon') return u === 'overdue' ? '#ef4444' : '#f59e0b';
    return base;
}
function urgencyBadgeHtml(u) {
    if (u === 'overdue') return `<span class="badge-urgency overdue">Прострочено</span>`;
    if (u === 'urgent') return `<span class="badge-urgency urgent">Менше 3 год</span>`;
    if (u === 'soon') return `<span class="badge-urgency soon">Сьогодні</span>`;
    return '';
}
function urgencyIcon(u) {
    return '';
}

let selectedColor = '#8b5cf6';
let currentView = 'day';
let selectedDate = localDateStr(new Date());
let localTasks = [...allTasks];
let detailTaskId = null;
let _pendingStatus = null;
let _pendingPriority = null;

/* ── TODAY SUMMARY ───────────────────────── */
function renderTodaySummary(dateStr) {
    const existing = document.getElementById('sp-today-summary');
    if (existing) existing.remove();

    const isToday = dateStr === localDateStr(new Date());
    const todayTasks = localTasks.filter(t => (t.deadline || t.createdAt).startsWith(dateStr));
    const total = todayTasks.length;
    const done = todayTasks.filter(t => t.status === 2).length;
    const inProg = todayTasks.filter(t => t.status === 1).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    // Найближчий дедлайн сьогодні
    const upcoming = todayTasks
        .filter(t => t.deadline && t.status !== 2)
        .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
    const nextDeadline = upcoming
        ? new Date(upcoming.deadline).toTimeString().substring(0, 5) + ' — ' + escHtml(upcoming.title || '')
        : 'немає';

    const weekData = getWeekProgress();

    const summaryHtml = `
        <div id="sp-today-summary">
            <div class="today-summary">
                <div class="summary-card summary-card--accent">
                    <div class="summary-card__label">Задач ${isToday ? 'сьогодні' : 'цього дня'}</div>
                    <div class="summary-card__value">${total}</div>
                    <div class="summary-card__sub">${inProg > 0 ? `${inProg} в процесі` : 'жодної активної'}</div>
                </div>
                <div class="summary-card summary-card--green">
                    <div class="summary-card__label">Виконано</div>
                    <div class="summary-card__value">${done}</div>
                    <div class="summary-card__sub">${pct}% від плану</div>
                    <div class="progress-bar-wrap">
                        <div class="progress-bar-fill" style="width:${pct}%"></div>
                    </div>
                </div>
                <div class="summary-card summary-card--yellow">
                    <div class="summary-card__label">Найближчий дедлайн</div>
                    <div class="summary-card__value" style="font-size:1rem;line-height:1.3;margin-top:4px;">${nextDeadline}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-card__label">Серія</div>
                    <div class="summary-card__value" style="color:#f59e0b;">${weekData.streak} <span style="font-size:.9rem;">днів</span></div>
                    <div class="summary-card__sub">поспіль активних</div>
                </div>
            </div>
            <div class="week-section">
                <div class="week-section__header">
                    <span class="week-section__title">Прогрес тижня</span>
                    <span class="streak-badge">${weekData.streak} день поспіль</span>
                </div>
                <div class="week-days-row">${weekData.daysHtml}</div>
            </div>
        </div>`;

    const container = document.getElementById('view-day');
    container.insertAdjacentHTML('beforebegin', summaryHtml);
}

/* ── WEEK PROGRESS & STREAK ──────────────── */
function getWeekProgress() {
    const today = new Date();
    const todayStr = localDateStr(today);
    const dow = (today.getDay() + 6) % 7; // Monday=0 … Sunday=6
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - dow);

    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    let daysHtml = '';
    const dayData = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
        const ds = localDateStr(d);
        const isToday = ds === todayStr;
        const isFuture = ds > todayStr;

        const dayTasks = localTasks.filter(t => (t.deadline || t.createdAt).startsWith(ds));
        const doneTasks = dayTasks.filter(t => t.status === 2);
        const hasAny = dayTasks.length > 0;
        const allDone = hasAny && doneTasks.length === dayTasks.length;

        dayData.push({ doneTasks, isToday });

        let dotClass = 'week-day-dot';
        if (isFuture) dotClass += ' future';
        else if (isToday) dotClass += ' today';
        else if (allDone) dotClass += ' completed';
        else if (hasAny) dotClass += ' has-tasks';

        const countLabel = dayTasks.length > 0 ? `${doneTasks.length}/${dayTasks.length}` : '';

        daysHtml += `<div class="week-day-cell">
            <span class="week-day-name">${dayNames[i]}</span>
            <div class="${dotClass}">${isToday ? today.getDate() : (allDone ? '✓' : (hasAny ? dayTasks.length : ''))}</div>
            <span class="week-day-count">${countLabel}</span>
        </div>`;
    }

    // Streak = consecutive days going backward from today where ≥1 task is done.
    // If today has no completed tasks yet, start from yesterday (day is not over).
    let streak = 0;
    let startIdx = dow;
    if (dayData[startIdx]?.doneTasks.length === 0) startIdx--;
    for (let i = startIdx; i >= 0; i--) {
        if (dayData[i].doneTasks.length > 0) streak++;
        else break;
    }

    return { streak, daysHtml };
}

/* ── VIEW SWITCHING ──────────────────────── */
function switchView(view, btn) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['day', 'multiday', 'week', 'month'].forEach(v =>
        document.getElementById('view-' + v).style.display = v === view ? '' : 'none');
    document.getElementById('day-strip').style.display =
        (view === 'day' || view === 'multiday') ? 'flex' : 'none';

    // Прибираємо summary якщо не day view
    const s = document.getElementById('sp-today-summary');
    if (s) s.remove();

    if (view === 'day') { renderTodaySummary(selectedDate); renderDayView(selectedDate); }
    if (view === 'multiday') renderMultidayView();
    if (view === 'week') renderWeekView();
    if (view === 'month') renderMonthView();
}

function selectDay(dateStr, el) {
    selectedDate = dateStr;
    document.querySelectorAll('.day-item').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    if (currentView === 'day') {
        const s = document.getElementById('sp-today-summary');
        if (s) s.remove();
        renderTodaySummary(dateStr);
        renderDayView(dateStr);
    }
}

function refreshCurrentView() {
    const s = document.getElementById('sp-today-summary');
    if (s) s.remove();
    if (currentView === 'day') { renderTodaySummary(selectedDate); renderDayView(selectedDate); }
    if (currentView === 'multiday') renderMultidayView();
    if (currentView === 'week') renderWeekView();
    if (currentView === 'month') renderMonthView();
    renderUrgencyBanner();
    renderSidebarCounts();
}

/* ── SIDEBAR: task counts per subject ───── */
function renderSidebarCounts() {
    document.querySelectorAll('.subject-link').forEach(link => {
        const sid = parseInt(link.dataset.subjectId || '0');
        if (!sid) return;
        const count = localTasks.filter(t => t.subjectId === sid && t.status !== 2).length;
        let badge = link.querySelector('.subject-task-count');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'subject-task-count';
                link.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    });
}

/* ── URGENCY BANNER (expandable) ─────────── */
let urgencyBannerExpanded = false;
function toggleUrgencyBanner() {
    urgencyBannerExpanded = !urgencyBannerExpanded;
    const wrap = document.querySelector('.sp-urgency-tasks-wrap');
    const btn = document.querySelector('.sp-urgency-toggle');
    if (!wrap || !btn) return;
    if (urgencyBannerExpanded) { wrap.classList.add('expanded'); btn.textContent = 'Згорнути ↑'; }
    else { wrap.classList.remove('expanded'); btn.textContent = 'Показати всі ↓'; }
}

function renderUrgencyBanner() {
    const existing = document.getElementById('sp-urgency-banner');
    if (existing) existing.remove();

    const overdueList = localTasks.filter(t => getUrgency(t) === 'overdue');
    const urgentList = localTasks.filter(t => getUrgency(t) === 'urgent');
    const combined = [...overdueList, ...urgentList];
    if (!combined.length) return;

    const countPills = [
        overdueList.length ? `<span class="sp-urgency-count-pill overdue">${overdueList.length} прострочено</span>` : '',
        urgentList.length ? `<span class="sp-urgency-count-pill urgent">${urgentList.length} менше 3 год</span>` : ''
    ].filter(Boolean).join('');

    const taskBtns = combined.map(t => {
        const u = getUrgency(t);
        return `<button class="sp-urgency-task ${u}" onclick="openTaskDetails(${t.id})" title="${escHtml(t.title || '')}">${escHtml(t.title || '')}</button>`;
    }).join('');

    const banner = document.createElement('div');
    banner.id = 'sp-urgency-banner';
    banner.innerHTML = `
        <div class="sp-urgency-inner">
            <span class="sp-urgency-label">Дедлайни:</span>
            <div class="sp-urgency-counts">${countPills}</div>
            <span class="sp-urgency-divider">·</span>
            <button class="sp-urgency-toggle" onclick="toggleUrgencyBanner()">${urgencyBannerExpanded ? 'Згорнути ↑' : 'Показати всі ↓'}</button>
            <div class="sp-urgency-tasks-wrap${urgencyBannerExpanded ? ' expanded' : ''}">${taskBtns}</div>
        </div>
        <button class="sp-urgency-close" onclick="this.closest('#sp-urgency-banner').remove()">✕</button>`;

    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.insertAdjacentElement('beforebegin', banner);
}

/* ── DAY VIEW ────────────────────────────── */
function renderDayView(dateStr) {
    const container = document.getElementById('view-day');
    const tasks = localTasks
        .filter(t => (t.deadline || t.createdAt).startsWith(dateStr))
        .sort((a, b) => (a.deadline || a.createdAt).localeCompare(b.deadline || b.createdAt));

    if (!tasks.length) {
        const isToday = dateStr === localDateStr(new Date());
        const dateLabel = new Date(dateStr + 'T00:00').toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
        const msgs = [
            'Вільний день — це теж результат!',
            'Відмінний момент, щоб відпочити.',
            'Може, додати щось корисне?',
            'Чисто! Плануй щось нове.',
            'Сьогодні можна розслабитись.',
            'Немає задач — час для себе!',
            'Ідеальний день для нових планів.',
        ];
        const msg = msgs[new Date(dateStr).getDay() % msgs.length];
        container.innerHTML = `<div class="empty-state">
            <div class="empty-state__date">${dateLabel}</div>
            <p class="empty-state__msg">${isToday ? msg : 'На цей день задач немає'}</p>
            <button class="empty-state__btn" onclick="openTaskModal()">＋ Додати задачу</button>
        </div>`;
        return;
    }

    container.innerHTML = tasks.map(t => {
        const base = getColor(t.subjectId);
        const urgency = getUrgency(t);
        const border = urgencyBorderColor(urgency, base);
        const src = t.deadline || t.createdAt;
        const timeStr = src.split('T')[1]?.substring(0, 5) || '—';

        const subHtml = t.subjectName ? `<div class="task-card__meta">${escHtml(t.subjectName)}</div>` : '';
        const dlHtml = t.deadline ? `<div class="task-card__deadline">${fmtDate(t.deadline)}</div>` : '';

        const badges = [
            t.priority === 1 ? `<span class="badge-important">Важливо</span>` : '',
            urgencyBadgeHtml(urgency),
            t.status === 2 ? `<span class="badge-status-done">Зроблено</span>` : '',
            t.status === 1 ? `<span class="badge-status-progress">В процесі</span>` : ''
        ].filter(Boolean).join('');

        const cardClass = 'task-card' + urgencyCardClass(urgency)
            + (t.priority === 1 && !urgency ? ' task-card--important' : '');
        const titleStyle = t.status === 2 ? 'text-decoration:line-through;opacity:.7' : '';
        const cardStyle = `border-left-color:${border};${t.status === 2 ? 'opacity:.65;' : ''}`;

        return `<div class="timeline-item" style="cursor:pointer" onclick="openTaskDetails(${t.id})">
            <div class="timeline-time">${timeStr}</div>
            <div class="${cardClass}" style="${cardStyle}display:flex;align-items:center;gap:10px;">
                <div style="flex:1;min-width:0;">
                    <div class="task-card__title" style="${titleStyle}">${escHtml(t.title || '')}</div>
                    ${subHtml}${dlHtml}
                    ${badges ? `<div class="task-card__badges">${badges}</div>` : ''}
                </div>
                <button class="task-toggle-btn${t.status === 2 ? ' done' : ''}"
                    onclick="event.stopPropagation();toggleTaskDone(${t.id})"
                    title="${t.status === 2 ? 'Скасувати виконання' : 'Позначити як виконане'}">${t.status === 2 ? '✓' : '○'}</button>
            </div>
        </div>`;
    }).join('');
}

/* ── PILL HELPER ─────────────────────────── */
function pillHtml(t) {
    const base = getColor(t.subjectId);
    const urgency = getUrgency(t);
    const border = urgencyBorderColor(urgency, base);
    const tp = t.deadline ? t.deadline.substring(11, 16) + ' ' : '';
    const icon = urgencyIcon(urgency) || (t.priority === 1 ? '⚡ ' : '');
    const cls = 'task-pill' + (urgency ? ` task-pill--${urgency}` : '') + (t.priority === 1 && !urgency ? ' task-pill--important' : '');
    const extra = t.status === 2 ? ';opacity:.5;text-decoration:line-through' : '';
    return `<div class="${cls}" style="border-left-color:${border}${extra}" onclick="openTaskDetails(${t.id})" title="${escHtml(t.title || '')}">${icon}${escHtml(tp + (t.title || ''))}</div>`;
}

/* ── MULTIDAY VIEW ───────────────────────── */
function renderMultidayView() {
    const today = new Date(); const todayStr = localDateStr(today);
    const days = [0, 1, 2].map(i => { const d = new Date(today); d.setDate(today.getDate() + i); return d; });
    const headers = days.map(d => {
        const isT = localDateStr(d) === todayStr;
        return `<div class="cal-header ${isT ? 'today' : ''}">${d.toLocaleDateString('uk-UA', { weekday: 'short' })} ${d.getDate()}</div>`;
    }).join('');
    const cells = days.map(d => {
        const ds = localDateStr(d); const isT = ds === todayStr;
        const t = localTasks.filter(x => (x.deadline || x.createdAt).startsWith(ds)).sort((a, b) => (a.deadline || a.createdAt).localeCompare(b.deadline || b.createdAt));
        return `<div class="cal-cell ${isT ? 'today-col' : ''}">${t.map(pillHtml).join('')}</div>`;
    }).join('');
    document.getElementById('view-multiday').innerHTML = `<div class="multiday-grid"><div class="cal-header" style="background:var(--clr-surface);"></div>${headers}<div class="cal-cell" style="background:var(--clr-surface);"></div>${cells}</div>`;
}

/* ── WEEK VIEW ───────────────────────────── */
function renderWeekView() {
    const today = new Date(); const todayStr = localDateStr(today);
    const dow = (today.getDay() + 6) % 7;
    const ws = new Date(today); ws.setDate(today.getDate() - dow);
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return d; });
    const headers = days.map(d => {
        const isT = localDateStr(d) === todayStr;
        return `<div class="cal-header ${isT ? 'today' : ''}">${d.toLocaleDateString('uk-UA', { weekday: 'short' })}<br/>${d.getDate()}</div>`;
    }).join('');
    const cells = days.map(d => {
        const ds = localDateStr(d); const isT = ds === todayStr;
        const t = localTasks.filter(x => (x.deadline || x.createdAt).startsWith(ds)).sort((a, b) => (a.deadline || a.createdAt).localeCompare(b.deadline || b.createdAt));
        return `<div class="cal-cell ${isT ? 'today-col' : ''}" style="min-height:100px;">${t.map(pillHtml).join('')}</div>`;
    }).join('');
    document.getElementById('view-week').innerHTML = `<div class="week-grid"><div class="cal-header" style="background:var(--clr-surface);"></div>${headers}<div class="cal-cell" style="background:var(--clr-surface);min-height:100px;"></div>${cells}</div>`;
}

/* ── MONTH VIEW ──────────────────────────── */
function renderMonthView() {
    const today = new Date(); const todayStr = localDateStr(today);
    const ms = new Date(today.getFullYear(), today.getMonth(), 1);
    const cs = new Date(ms); cs.setDate(1 - ((ms.getDay() + 6) % 7));
    const dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(n => `<div class="cal-header">${n}</div>`).join('');
    const cells = Array.from({ length: 42 }, (_, i) => {
        const d = new Date(cs); d.setDate(cs.getDate() + i);
        const ds = localDateStr(d); const isT = ds === todayStr; const om = d.getMonth() !== today.getMonth();
        const t = localTasks.filter(x => x.deadline && x.deadline.startsWith(ds));
        const pills = t.slice(0, 3).map(pillHtml).join('');
        const more = t.length > 3 ? `<div style="font-size:.65rem;color:var(--txt-tertiary);">+${t.length - 3}</div>` : '';
        return `<div class="month-cell ${isT ? 'today' : ''} ${om ? 'other-month' : ''}"><div class="day-num">${d.getDate()}</div>${pills}${more}</div>`;
    }).join('');
    document.getElementById('view-month').innerHTML = `<div class="month-grid">${dayHeaders}${cells}</div>`;
}

/* ── FORMAT DATE ─────────────────────────── */
function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' }) + ', ' + d.toTimeString().substring(0, 5);
}

/* ── MODALS ──────────────────────────────── */
function openTaskModal(prefill = '') {
    document.getElementById('task-title').value = prefill;
    document.getElementById('task-notes').value = '';
    document.getElementById('task-deadline').value = '';
    document.getElementById('task-subject').value = '';
    document.getElementById('task-priority').value = '0';
    document.getElementById('task-modal').classList.add('open');
    setTimeout(() => document.getElementById('task-title').focus(), 220);
}
function openSubjectModal() {
    document.getElementById('subject-title').value = '';
    document.getElementById('subject-desc').value = '';
    initColorPicker();
    document.getElementById('subject-modal').classList.add('open');
    setTimeout(() => document.getElementById('subject-title').focus(), 220);
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function overlayClick(e, id) { if (e.target.id === id) closeModal(id); }
document.addEventListener('keydown', e => {
    // Always handle Escape regardless of where focus is
    if (e.key === 'Escape') { closeModal('task-modal'); closeModal('subject-modal'); closeDetailPanel(); closeSubjectPanel(); closeAchievementsPanel(); return; }

    // Skip shortcuts when user is typing in an input/textarea/select
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    // Skip if any modal or detail panel is open
    const modalOpen = document.querySelector('.sp-overlay.open');
    const panelOpen = document.getElementById('sp-detail-panel')?.classList.contains('open');
    if (modalOpen || panelOpen) return;

    switch (e.key) {
        case 'n': case 'N':
            e.preventDefault();
            openTaskModal();
            break;
        case '1':
            document.querySelectorAll('.view-btn')[0]?.click();
            break;
        case '2':
            document.querySelectorAll('.view-btn')[1]?.click();
            break;
        case '3':
            document.querySelectorAll('.view-btn')[2]?.click();
            break;
        case '4':
            document.querySelectorAll('.view-btn')[3]?.click();
            break;
    }
});

/* ── COLOR PICKER ────────────────────────── */
function initColorPicker() {
    selectedColor = '#8b5cf6';
    document.getElementById('color-picker').innerHTML = COLORS.map(c =>
        `<div class="cpick ${c === selectedColor ? 'sel' : ''}" style="background:${c}" onclick="pickColor('${c}',this)"></div>`
    ).join('');
    document.getElementById('subject-modal-top').style.background = selectedColor;
    document.getElementById('subject-submit-btn').style.background = selectedColor;
}
function pickColor(c, el) {
    selectedColor = c;
    document.querySelectorAll('.cpick').forEach(x => x.classList.remove('sel'));
    el.classList.add('sel');
    document.getElementById('subject-modal-top').style.background = c;
    document.getElementById('subject-submit-btn').style.background = c;
}

/* ── AJAX: CREATE TASK ───────────────────── */
async function submitTask() {
    const title = document.getElementById('task-title').value.trim();
    if (!title) { document.getElementById('task-title').focus(); return; }
    const deadlineVal = document.getElementById('task-deadline').value;
    if (deadlineVal && new Date(deadlineVal) < new Date()) { showToast('Не можна додати задачу на минулу дату!', true); return; }

    const res = await fetch('/Tasks/CreateAjax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': getAntiForgeryToken() },
        body: JSON.stringify({
            title,
            description: document.getElementById('task-notes').value.trim() || null,
            deadline: deadlineVal || null,
            priority: parseInt(document.getElementById('task-priority').value),
            subjectId: parseInt(document.getElementById('task-subject').value) || null
        })
    });
    if (!res.ok) { showToast('Помилка збереження', true); return; }
    const task = await res.json();
    localTasks.push({
        id: task.id, title: task.title, description: task.description,
        subjectName: task.subjectName, subjectId: task.subjectId,
        deadline: task.deadline, createdAt: task.createdAt,
        status: task.status ?? 0, priority: task.priority ?? 0
    });
    closeModal('task-modal');
    showToast('Задачу додано');
    refreshCurrentView();
}

/* ── AJAX: CREATE SUBJECT ────────────────── */
async function submitSubject() {
    const name = document.getElementById('subject-title').value.trim();
    if (!name) { document.getElementById('subject-title').focus(); return; }
    const res = await fetch('/Subject/CreateAjax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': getAntiForgeryToken() },
        body: JSON.stringify({ name, description: document.getElementById('subject-desc').value.trim() || null })
    });
    if (!res.ok) { showToast('Помилка збереження', true); return; }
    const subj = await res.json();
    closeModal('subject-modal');
    showToast('Предмет додано');

    const list = document.getElementById('subject-list-sidebar');
    const link = document.createElement('a');
    link.href = 'javascript:void(0)';
    link.className = 'subject-link';
    link.dataset.subjectId = subj.id;
    link.onclick = () => openSubjectPanel(subj.id);
    link.innerHTML = `<div class="subject-dot" style="background:${selectedColor}"></div><span>${escHtml(subj.name)}</span>`;
    list.appendChild(link);

    const opt = document.createElement('option');
    opt.value = subj.id; opt.textContent = subj.name;
    document.getElementById('task-subject').appendChild(opt);
    allSubjects.push({ id: subj.id, name: subj.name });
    renderSidebarCounts();
}

/* ── SUBJECT SIDE PANEL ──────────────────── */
let currentSubjectId = null;

async function openSubjectPanel(subjectId) {
    closeDetailPanel();
    currentSubjectId = subjectId;
    const res = await fetch(`/Subject/GetDetailsAjax/${subjectId}`, {
        headers: { 'RequestVerificationToken': getAntiForgeryToken() }
    });
    if (!res.ok) { showToast('Помилка завантаження предмету', true); return; }
    const data = await res.json();
    renderSubjectPanel(data);
    document.getElementById('sp-subject-panel').classList.add('open');
    document.getElementById('sp-subject-backdrop').classList.add('open');
}

function closeSubjectPanel() {
    document.getElementById('sp-subject-panel').classList.remove('open');
    document.getElementById('sp-subject-backdrop').classList.remove('open');
    currentSubjectId = null;
}

function renderSubjectPanel(data) {
    const color = getColor(data.id);
    const tasks = data.tasks || [];
    const groups = [
        { label: 'В процесі',   status: 1, dot: '#f59e0b' },
        { label: 'Не розпочато', status: 0, dot: '#6b7280' },
        { label: 'Зроблено',    status: 2, dot: '#10b981' },
    ];

    const groupsHtml = groups.map(g => {
        const gtasks = tasks.filter(t => t.status === g.status);
        if (!gtasks.length) return '';
        const rows = gtasks.map(t => {
            const dl = t.deadline ? `<span class="ssp-task-deadline">${new Date(t.deadline).toLocaleDateString('uk-UA', { day:'2-digit', month:'short' })}</span>` : '';
            const pri = t.priority === 1 ? `<span class="ssp-task-pri">⚡</span>` : '';
            return `<div class="ssp-task-row" onclick="openTaskFromSubjectPanel(${t.id})">
                <div class="ssp-task-dot" style="background:${g.dot}"></div>
                <span class="ssp-task-title${g.status === 2 ? ' done' : ''}">${escHtml(t.title || '')}</span>
                ${pri}${dl}
            </div>`;
        }).join('');
        return `<div class="ssp-group-label">${g.label} <span class="ssp-group-count">${gtasks.length}</span></div>${rows}`;
    }).join('');

    document.getElementById('sp-subject-panel').innerHTML = `
        <div class="ssp-header" style="background:${color}22;border-bottom:1px solid ${color}33;">
            <button class="ssp-close" onclick="closeSubjectPanel()">✕</button>
            <div class="ssp-title-wrap">
                <span class="ssp-title" id="ssp-title-text" onclick="startEditSubjectName()" title="Натисни для редагування">${escHtml(data.name)}</span>
                <input class="ssp-title-input" id="ssp-title-input" value="${escHtml(data.name)}"
                    onblur="saveSubjectName(${data.id})" onkeydown="if(event.key==='Enter')saveSubjectName(${data.id});if(event.key==='Escape')cancelEditSubjectName();" />
            </div>
            ${data.description ? `<div class="ssp-desc">${escHtml(data.description)}</div>` : ''}
        </div>
        <div class="ssp-body">
            <button class="ssp-add-btn" onclick="openTaskModalForSubject(${data.id})">＋ Додати задачу для цього предмету</button>
            ${groupsHtml || '<div class="ssp-empty">Задач ще немає</div>'}
        </div>
        <div class="ssp-footer">
            <button class="ssp-btn-delete" onclick="deleteSubject(${data.id})">Видалити предмет</button>
        </div>`;
}

function openTaskFromSubjectPanel(taskId) {
    closeSubjectPanel();
    openTaskDetails(taskId);
}

function openTaskModalForSubject(subjectId) {
    closeSubjectPanel();
    openTaskModal();
    setTimeout(() => {
        const sel = document.getElementById('task-subject');
        if (sel) sel.value = subjectId;
    }, 50);
}

function startEditSubjectName() {
    document.getElementById('ssp-title-text').style.display = 'none';
    const inp = document.getElementById('ssp-title-input');
    inp.style.display = 'block';
    inp.focus(); inp.select();
}

function cancelEditSubjectName() {
    document.getElementById('ssp-title-text').style.display = '';
    document.getElementById('ssp-title-input').style.display = 'none';
}

async function saveSubjectName(subjectId) {
    const inp = document.getElementById('ssp-title-input');
    if (!inp) return;
    const newName = inp.value.trim();
    if (!newName) { cancelEditSubjectName(); return; }
    const res = await fetch(`/Subject/UpdateAjax/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': getAntiForgeryToken() },
        body: JSON.stringify({ name: newName, description: null })
    });
    if (!res.ok) { showToast('Помилка збереження', true); cancelEditSubjectName(); return; }
    const updated = await res.json();
    // Update sidebar link text
    const link = document.querySelector(`.subject-link[data-subject-id="${subjectId}"] span`);
    if (link) link.textContent = updated.name;
    // Update allSubjects
    const si = allSubjects.findIndex(s => s.id === subjectId);
    if (si >= 0) allSubjects[si].name = updated.name;
    // Update tasks
    localTasks.filter(t => t.subjectId === subjectId).forEach(t => t.subjectName = updated.name);
    cancelEditSubjectName();
    document.getElementById('ssp-title-text').textContent = updated.name;
    showToast('Предмет оновлено');
}

async function deleteSubject(subjectId) {
    if (!confirm('Видалити предмет? Усі задачі предмету також будуть видалені.')) return;
    const res = await fetch(`/Subject/DeleteAjax/${subjectId}`, {
        method: 'DELETE',
        headers: { 'RequestVerificationToken': getAntiForgeryToken() }
    });
    if (!res.ok) { showToast('Помилка видалення', true); return; }
    // Remove from sidebar
    const link = document.querySelector(`.subject-link[data-subject-id="${subjectId}"]`);
    if (link) link.remove();
    // Remove tasks from local state
    localTasks = localTasks.filter(t => t.subjectId !== subjectId);
    const si = allSubjects.findIndex(s => s.id === subjectId);
    if (si >= 0) allSubjects.splice(si, 1);
    // Remove from task-subject select
    const opt = document.querySelector(`#task-subject option[value="${subjectId}"]`);
    if (opt) opt.remove();
    closeSubjectPanel();
    showToast('Предмет видалено');
    refreshCurrentView();
}

/* ── ACHIEVEMENTS PANEL ──────────────────── */
async function openAchievementsPanel() {
    let modal = document.getElementById('sp-achievements-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sp-achievements-modal';
        modal.onclick = e => { if (e.target === modal) closeAchievementsPanel(); };
        modal.innerHTML = `<div class="ach-box"><div class="ach-header">
            <button class="ach-close" onclick="closeAchievementsPanel()">✕</button>
            <div class="ach-level-title" id="ach-level-text">Завантаження...</div>
            <div class="ach-xp-track"><div class="ach-xp-fill" id="ach-xp-fill" style="width:0%"></div></div>
            <div class="ach-xp-label" id="ach-xp-label"></div>
        </div><div class="ach-body" id="ach-body"></div></div>`;
        document.body.appendChild(modal);
    }
    requestAnimationFrame(() => modal.classList.add('open'));
    const res = await fetch('/Dashboard/GetAchievements');
    if (!res.ok) return;
    const data = await res.json();
    document.getElementById('ach-level-text').textContent = `Рівень ${data.level} · ${data.xp} XP`;
    document.getElementById('ach-xp-fill').style.width = `${data.xpInLevel}%`;
    document.getElementById('ach-xp-label').textContent = `${data.xpInLevel}/100 XP до наступного рівня`;
    document.getElementById('ach-body').innerHTML = data.achievements.map(a => `
        <div class="ach-item${a.unlocked ? ' unlocked' : ''}">
            <div class="ach-icon">${a.icon}</div>
            <div class="ach-info">
                <div class="ach-name">${escHtml(a.name)}</div>
                <div class="ach-desc">${escHtml(a.desc)}</div>
            </div>
            <div class="ach-progress-wrap">
                <div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${Math.round(a.progress/a.total*100)}%"></div></div>
                <div class="ach-progress-text">${a.unlocked ? '✓' : `${a.progress}/${a.total}`}</div>
            </div>
        </div>`).join('');
}

function closeAchievementsPanel() {
    const modal = document.getElementById('sp-achievements-modal');
    if (modal) modal.classList.remove('open');
}

/* ── XP NAVBAR UPDATE ────────────────────── */
function updateNavbarXp(xpGain) {
    const fillEl = document.querySelector('.sp-xp-fill');
    const levelEl = document.querySelector('.sp-xp-level');
    const ptsEl = document.querySelector('.sp-xp-pts');
    if (!fillEl || !levelEl || !ptsEl) return;

    const ptsMatch = ptsEl.textContent.match(/^(\d+)\/100/);
    if (!ptsMatch) return;
    let xpInLevel = parseInt(ptsMatch[1]) + xpGain;

    const levelMatch = levelEl.textContent.match(/(\d+)/);
    let level = levelMatch ? parseInt(levelMatch[1]) : 1;

    while (xpInLevel >= 100) { xpInLevel -= 100; level++; }

    fillEl.style.width = `${xpInLevel}%`;
    levelEl.textContent = `Рівень ${level}`;
    ptsEl.textContent = `${xpInLevel}/100 XP`;
}

/* ── XP FLOAT ANIMATION ──────────────────── */
function showXpFloat(xpGain) {
    const el = document.createElement('div');
    el.className = 'xp-float';
    el.textContent = `+${xpGain} XP`;
    // Position near the FAB button
    const fab = document.getElementById('sp-fab');
    const rect = fab ? fab.getBoundingClientRect() : { left: window.innerWidth - 80, top: window.innerHeight - 80 };
    el.style.left = `${rect.left - 20}px`;
    el.style.top = `${rect.top - 10}px`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
}

/* ── TASK DETAIL PANEL ───────────────────── */
function openTaskDetails(taskId) {
    const t = localTasks.find(x => x.id === taskId);
    if (!t) return;
    closeSubjectPanel();
    detailTaskId = taskId; _pendingStatus = null; _pendingPriority = null;
    renderDetailPanel(t);
    document.getElementById('sp-detail-panel').classList.add('open');
    document.getElementById('sp-detail-backdrop').classList.add('open');
}
function closeDetailPanel() {
    document.getElementById('sp-detail-panel').classList.remove('open');
    document.getElementById('sp-detail-backdrop').classList.remove('open');
    detailTaskId = null;
}
function renderDetailPanel(t) {
    const base = getColor(t.subjectId);
    const urgency = getUrgency(t);
    const headerColor = urgency === 'overdue' ? '#c0392b' : urgency === 'urgent' ? '#d97706' : base;
    const urgencyBanner = urgency === 'overdue' ? `<div class="sdp-urgency-badge overdue">Дедлайн прострочено</div>`
        : urgency === 'urgent' ? `<div class="sdp-urgency-badge urgent">Менше 3 годин до дедлайну</div>`
            : urgency === 'soon' ? `<div class="sdp-urgency-badge soon">Дедлайн сьогодні</div>` : '';
    const statusLabels = ['Не розпочато', 'В процесі', 'Зроблено'];
    const statusColors = ['#6b7280', '#f59e0b', '#10b981'];
    const subOptsHtml = allSubjects.map(s =>
        `<option value="${s.id}" ${t.subjectId == s.id ? 'selected' : ''}>${escHtml(s.name)}</option>`).join('');

    document.getElementById('sp-detail-panel').innerHTML = `
        <div class="sdp-header" style="background:${headerColor}">
            <button class="sdp-close" onclick="closeDetailPanel()">✕</button>
            <div class="sdp-header-title">${escHtml(t.title || '')}</div>
            <div class="sdp-header-sub">${escHtml(t.subjectName || 'Без предмету')}${t.priority === 1 ? ' · Важливо' : ''}</div>
        </div>
        <div class="sdp-body">
            ${urgencyBanner}
            <div class="sdp-section-label">Статус</div>
            <div class="sdp-chips" id="sdp-status-chips">
                ${[0, 1, 2].map(i => `<div class="sdp-chip${t.status === i ? ' active' : ''}"
                    style="${t.status === i ? `background:${statusColors[i]};border-color:${statusColors[i]};color:#fff` : ''}"
                    onclick="setStatus(${i},this,'${statusColors[i]}')">${statusLabels[i]}</div>`).join('')}
            </div>
            <div class="sdp-section-label" style="margin-top:12px">Пріоритет</div>
            <div class="sdp-chips" id="sdp-priority-chips">
                ${[{ v: 0, l: 'Звичайний', c: '#6b7280' }, { v: 1, l: 'Важливо', c: '#f59e0b' }].map(p => `
                <div class="sdp-chip${t.priority === p.v ? ' active' : ''}"
                    style="${t.priority === p.v ? `background:${p.c};border-color:${p.c};color:#fff` : ''}"
                    onclick="setPriority(${p.v},this,'${p.c}')">${p.l}</div>`).join('')}
            </div>
            <div class="sdp-section-label" style="margin-top:12px">Назва</div>
            <div class="sdp-field"><input id="sdp-title" value="${escHtml(t.title || '')}" placeholder="Назва задачі..." /></div>
            <div class="sdp-section-label" style="margin-top:12px">Дедлайн</div>
            <div class="sdp-field sdp-field-row">
                <span>📅</span>
                <input type="datetime-local" id="sdp-deadline" value="${t.deadline ? t.deadline.substring(0, 16) : ''}" />
            </div>
            <div class="sdp-section-label" style="margin-top:12px">Предмет</div>
            <div class="sdp-field sdp-field-row">
                <span>📚</span>
                <select id="sdp-subject"><option value="">— без предмету —</option>${subOptsHtml}</select>
            </div>
            <div class="sdp-section-label" style="margin-top:12px">Опис</div>
            <div class="sdp-field"><textarea id="sdp-description" rows="4" placeholder="Додай опис...">${escHtml(t.description || '')}</textarea></div>
            <div class="sdp-meta">Створено: ${new Date(t.createdAt).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
        <div class="sdp-footer">
            <button class="sdp-btn-save" style="background:${headerColor}" onclick="saveTaskDetails()">Зберегти</button>
            <button class="sdp-btn-delete" onclick="deleteTaskDetail()">Видалити</button>
        </div>`;
}

function setStatus(val, el, color) {
    _pendingStatus = val;
    document.querySelectorAll('#sdp-status-chips .sdp-chip').forEach(c => { c.classList.remove('active'); c.removeAttribute('style'); });
    el.classList.add('active'); el.style.cssText = `background:${color};border-color:${color};color:#fff`;
}
function setPriority(val, el, color) {
    _pendingPriority = val;
    document.querySelectorAll('#sdp-priority-chips .sdp-chip').forEach(c => { c.classList.remove('active'); c.removeAttribute('style'); });
    el.classList.add('active'); el.style.cssText = `background:${color};border-color:${color};color:#fff`;
}

/* ── AJAX: SAVE ──────────────────────────── */
async function saveTaskDetails() {
    const t = localTasks.find(x => x.id === detailTaskId); if (!t) return;
    const title = document.getElementById('sdp-title').value.trim(); if (!title) { document.getElementById('sdp-title').focus(); return; }
    const deadline = document.getElementById('sdp-deadline').value || null;
    const subjVal = document.getElementById('sdp-subject').value;
    const desc = document.getElementById('sdp-description').value.trim();
    const status = _pendingStatus !== null ? _pendingStatus : (t.status ?? 0);
    const priority = _pendingPriority !== null ? _pendingPriority : (t.priority ?? 0);

    const res = await fetch(`/Tasks/UpdateAjax/${detailTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': getAntiForgeryToken() },
        body: JSON.stringify({ title, description: desc || null, deadline, priority, status, subjectId: parseInt(subjVal) || null })
    });
    if (!res.ok) { showToast('Помилка збереження', true); return; }
    const updated = await res.json();
    const foundSubj = allSubjects.find(s => s.id === (parseInt(subjVal) || null));
    const idx = localTasks.findIndex(x => x.id === detailTaskId);
    localTasks[idx] = { ...localTasks[idx], ...updated, subjectName: foundSubj?.name || null };
    _pendingStatus = null; _pendingPriority = null;
    if (updated.xpGain > 0) { showToast(`Збережено · +${updated.xpGain} XP`); showXpFloat(updated.xpGain); updateNavbarXp(updated.xpGain); }
    else showToast('Збережено');
    closeDetailPanel();
    refreshCurrentView();
}

/* ── AJAX: DELETE ────────────────────────── */
let _deleteArmed = false;
let _deleteArmTimer = null;

function deleteTaskDetail() {
    const btn = document.querySelector('.sdp-btn-delete');
    if (!btn) return;

    if (!_deleteArmed) {
        // Arm: change button appearance, auto-disarm after 3s
        _deleteArmed = true;
        btn.textContent = 'Підтвердити?';
        btn.classList.add('armed');
        _deleteArmTimer = setTimeout(() => _disarmDeleteBtn(), 3000);

        // Disarm if user clicks anywhere else
        setTimeout(() => document.addEventListener('click', _disarmOnOutsideClick, { once: true, capture: true }), 0);
        return;
    }

    // Confirmed — execute delete
    _disarmDeleteBtn();
    _doDeleteTask();
}

function _disarmDeleteBtn() {
    _deleteArmed = false;
    clearTimeout(_deleteArmTimer);
    document.removeEventListener('click', _disarmOnOutsideClick, true);
    const btn = document.querySelector('.sdp-btn-delete');
    if (btn) { btn.textContent = 'Видалити'; btn.classList.remove('armed'); }
}

function _disarmOnOutsideClick(e) {
    const btn = document.querySelector('.sdp-btn-delete');
    if (btn && !btn.contains(e.target)) _disarmDeleteBtn();
}

async function _doDeleteTask() {
    const res = await fetch(`/Tasks/DeleteAjax/${detailTaskId}`, {
        method: 'DELETE', headers: { 'RequestVerificationToken': getAntiForgeryToken() }
    });
    if (!res.ok) { showToast('Помилка видалення', true); return; }
    localTasks = localTasks.filter(t => t.id !== detailTaskId);
    closeDetailPanel(); showToast('Задачу видалено');
    refreshCurrentView();
}

/* ── QUICK TOGGLE DONE ───────────────────── */
async function toggleTaskDone(taskId) {
    const t = localTasks.find(x => x.id === taskId);
    if (!t) return;
    const newStatus = t.status === 2 ? 0 : 2;
    const res = await fetch(`/Tasks/UpdateAjax/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': getAntiForgeryToken() },
        body: JSON.stringify({
            title: t.title, description: t.description,
            deadline: t.deadline, priority: t.priority,
            status: newStatus, subjectId: t.subjectId
        })
    });
    if (!res.ok) { showToast('Помилка збереження', true); return; }
    const updated = await res.json();
    const idx = localTasks.findIndex(x => x.id === taskId);
    localTasks[idx] = { ...localTasks[idx], status: updated.status };
    if (updated.xpGain > 0) { showToast(`Виконано · +${updated.xpGain} XP`); showXpFloat(updated.xpGain); updateNavbarXp(updated.xpGain); }
    else showToast(newStatus === 2 ? 'Виконано ✓' : 'Скасовано');
    refreshCurrentView();
}

/* ── HELPERS ─────────────────────────────── */
function getAntiForgeryToken() {
    return document.querySelector('input[name="__RequestVerificationToken"]')?.value || antiForgery || '';
}
function showToast(msg, isError = false) {
    const el = document.getElementById('sp-toast'); if (!el) return;
    el.textContent = msg; el.className = isError ? 'error' : '';
    el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800);
}
function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function quickAdd() {
    const val = document.getElementById('quick-task').value.trim();
    if (val) openTaskModal(val);
}

/* ── INJECT UI ───────────────────────────── */
(function injectUI() {
    const subjectOptions = allSubjects.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');

    document.body.insertAdjacentHTML('beforeend', `
        <div id="sp-fab-wrap">
            <button id="sp-fab" onclick="openTaskModal()">＋</button>
            <span id="sp-fab-label">Додати задачу</span>
        </div>

        <div class="sp-overlay" id="task-modal" onclick="overlayClick(event,'task-modal')">
            <div class="sp-modal">
                <div class="modal-top" id="task-modal-top" style="background:#ff4fd8">
                    <button class="modal-close" onclick="closeModal('task-modal')">✕</button>
                    <input class="modal-title-input" id="task-title" placeholder="Назва задачі..." />
                    <div class="modal-subtitle">Нова задача</div>
                </div>
                <div class="modal-body">
                    <div class="modal-field">
                        <input type="datetime-local" id="task-deadline" min="${new Date().toISOString().substring(0, 16)}" placeholder="Дедлайн" />
                    </div>
                    <div class="modal-field">
                        <select id="task-subject">
                            <option value="">— без предмету —</option>
                            ${subjectOptions}
                        </select>
                    </div>
                    <div class="modal-field">
                        <select id="task-priority">
                            <option value="0">Звичайний пріоритет</option>
                            <option value="1">Важливо</option>
                        </select>
                    </div>
                    <div class="modal-field">
                        <textarea id="task-notes" rows="2" placeholder="Нотатки..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-submit" style="background:#ff4fd8" onclick="submitTask()">Створити задачу</button>
                </div>
            </div>
        </div>

        <div class="sp-overlay" id="subject-modal" onclick="overlayClick(event,'subject-modal')">
            <div class="sp-modal">
                <div class="modal-top" id="subject-modal-top" style="background:#8b5cf6">
                    <button class="modal-close" onclick="closeModal('subject-modal')">✕</button>
                    <input class="modal-title-input" id="subject-title" placeholder="Назва предмету..." />
                    <div class="modal-subtitle">Новий предмет</div>
                </div>
                <div class="modal-body">
                    <div class="modal-field" style="flex-direction:column;align-items:flex-start;gap:8px">
                        <span style="font-size:.75rem;color:var(--txt-secondary)">Колір</span>
                        <div class="color-picker-row" id="color-picker"></div>
                    </div>
                    <div class="modal-field">
                        <span class="modal-field-icon">📝</span>
                        <textarea id="subject-desc" rows="2" placeholder="Опис предмету..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-submit" id="subject-submit-btn" style="background:#8b5cf6" onclick="submitSubject()">Додати предмет</button>
                </div>
            </div>
        </div>

        <div id="sp-subject-backdrop" onclick="closeSubjectPanel()"></div>
        <div id="sp-subject-panel"></div>
        <div id="sp-detail-backdrop" onclick="closeDetailPanel()"></div>
        <div id="sp-detail-panel"></div>
        <div id="sp-toast"></div>
    `);
})();

/* ── INIT ────────────────────────────────── */
document.getElementById('quick-task').addEventListener('keydown', e => {
    if (e.key === 'Enter') quickAdd();
});

renderTodaySummary(selectedDate);
renderDayView(selectedDate);
renderUrgencyBanner();
renderSidebarCounts();

setInterval(refreshCurrentView, 5 * 60 * 1000);
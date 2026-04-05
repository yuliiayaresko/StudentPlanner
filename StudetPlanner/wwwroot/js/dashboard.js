const { tasks: allTasks, subjects: allSubjects, antiForgery } = window.DASHBOARD_DATA;

const COLORS = ['#ff4fd8', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
const palette = ['#ff4fd8', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];
const getColor = id => palette[(id ?? 0) % palette.length];

/* ── ДАТА БЕЗ UTC ЗСУВУ ──────────────────────────── */
function localDateStr(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/* ── ТЕРМІНОВІСТЬ ДЕДЛАЙНУ ───────────────────────────
   повертає: null | 'soon' (до 24г) | 'urgent' (до 3г) | 'overdue' (минув)
   ігнорує задачі зі статусом 2 (Зроблено)
─────────────────────────────────────────────────── */
function getUrgency(t) {
    if (!t.deadline || t.status === 2) return null;
    const diff = new Date(t.deadline) - new Date();
    if (diff < 0) return 'overdue';
    if (diff < 3 * 60 * 60 * 1000) return 'urgent';
    if (diff < 24 * 60 * 60 * 1000) return 'soon';
    return null;
}

/* Повертає CSS-рядок для border-left і фону картки */
function urgencyStyle(urgency, baseColor) {
    if (urgency === 'overdue') return { border: '#ef4444', bg: 'rgba(239,68,68,.08)' };
    if (urgency === 'urgent') return { border: '#f59e0b', bg: 'rgba(245,158,11,.08)' };
    if (urgency === 'soon') return { border: '#f59e0b', bg: 'rgba(245,158,11,.04)' };
    return { border: baseColor, bg: '' };
}

/* Бейдж терміновості для day-view */
function urgencyBadge(urgency) {
    if (urgency === 'overdue') return `<span class="task-urgency overdue">⚠ Прострочено</span>`;
    if (urgency === 'urgent') return `<span class="task-urgency urgent">🔥 Менше 3 год!</span>`;
    if (urgency === 'soon') return `<span class="task-urgency soon">⏰ Сьогодні</span>`;
    return '';
}

let selectedColor = '#8b5cf6';
let currentView = 'day';
let selectedDate = localDateStr(new Date());
let localTasks = [...allTasks];
let detailTaskId = null;
let _pendingStatus = null;
let _pendingPriority = null;

/* ── VIEW SWITCHING ──────────────────────────────── */
function switchView(view, btn) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['day', 'multiday', 'week', 'month'].forEach(v =>
        document.getElementById('view-' + v).style.display = v === view ? '' : 'none');
    document.getElementById('day-strip').style.display =
        (view === 'day' || view === 'multiday') ? 'flex' : 'none';

    if (view === 'day') renderDayView(selectedDate);
    if (view === 'multiday') renderMultidayView();
    if (view === 'week') renderWeekView();
    if (view === 'month') renderMonthView();
}

function selectDay(dateStr, el) {
    selectedDate = dateStr;
    document.querySelectorAll('.day-item').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    if (currentView === 'day') renderDayView(dateStr);
}

function refreshCurrentView() {
    if (currentView === 'day') renderDayView(selectedDate);
    if (currentView === 'multiday') renderMultidayView();
    if (currentView === 'week') renderWeekView();
    if (currentView === 'month') renderMonthView();
    renderUrgencyBanner();
}

/* ── URGENCY BANNER ──────────────────────────────── */
function renderUrgencyBanner() {
    const existing = document.getElementById('sp-urgency-banner');
    if (existing) existing.remove();

    const urgent = localTasks.filter(t => {
        const u = getUrgency(t);
        return u === 'urgent' || u === 'overdue';
    });

    if (!urgent.length) return;

    const overdue = urgent.filter(t => getUrgency(t) === 'overdue');
    const hot = urgent.filter(t => getUrgency(t) === 'urgent');

    let parts = [];
    if (overdue.length) parts.push(`<span style="color:#ef4444">⚠ ${overdue.length} прострочено</span>`);
    if (hot.length) parts.push(`<span style="color:#f59e0b">🔥 ${hot.length} менше 3 год</span>`);

    const banner = document.createElement('div');
    banner.id = 'sp-urgency-banner';
    banner.innerHTML = `
        <div class="sp-urgency-inner">
            <span style="color:#fff;font-weight:600;font-size:.82rem;">Увага до дедлайнів:</span>
            ${parts.join('<span style="color:#444;margin:0 6px">·</span>')}
            <div class="sp-urgency-tasks">
                ${urgent.slice(0, 4).map(t => {
        const u = getUrgency(t);
        return `<button class="sp-urgency-task ${u}" onclick="openTaskDetails(${t.id})">
                        ${escHtml(t.title || '')}
                    </button>`;
    }).join('')}
                ${urgent.length > 4 ? `<span style="color:#666;font-size:.75rem;">+${urgent.length - 4} ще</span>` : ''}
            </div>
        </div>
        <button class="sp-urgency-close" onclick="this.parentElement.remove()">✕</button>
    `;

    // Вставляємо одразу над content-area
    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.insertAdjacentElement('beforebegin', banner);
}

/* ── DAY VIEW ────────────────────────────────────── */
function renderDayView(dateStr) {
    const container = document.getElementById('view-day');
    const tasks = localTasks
        .filter(t => (t.deadline || t.createdAt).startsWith(dateStr))
        .sort((a, b) => (a.deadline || a.createdAt).localeCompare(b.deadline || b.createdAt));

    if (!tasks.length) {
        container.innerHTML = `<div class="empty-state">
            <div style="font-size:3rem;">📌</div>
            <p style="margin-top:.6rem;font-size:.95rem;">На цей день завдань немає</p>
            <p style="font-size:.8rem;">Натисни ＋ щоб додати</p>
        </div>`;
        return;
    }

    container.innerHTML = tasks.map(t => {
        const baseColor = getColor(t.subjectId);
        const urgency = getUrgency(t);
        const { border, bg } = urgencyStyle(urgency, baseColor);
        const src = t.deadline || t.createdAt;
        const timeStr = src.split('T')[1]?.substring(0, 5) || '—';
        const subHtml = t.subjectName
            ? `<div class="task-card__meta">${escHtml(t.subjectName)}</div>` : '';
        const dlHtml = t.deadline
            ? `<div class="task-card__deadline">🕐 ${fmtDate(t.deadline)}</div>` : '';
        const statusBadge = t.status === 2
            ? `<span class="task-status-done">✓ Зроблено</span>`
            : t.status === 1 ? `<span class="task-status-progress">● В процесі</span>` : '';

        return `<div class="timeline-item" style="cursor:pointer" onclick="openTaskDetails(${t.id})">
            <div class="timeline-time">${timeStr}</div>
            <div class="task-card${urgency ? ' task-card--' + urgency : ''}"
                 style="border-left-color:${border};${bg ? 'background:' + bg + ';' : ''}${t.status === 2 ? 'opacity:.6;' : ''}">
                <div class="task-card__title" style="${t.status === 2 ? 'text-decoration:line-through' : ''}">${escHtml(t.title || '')}</div>
                ${subHtml}${dlHtml}
                ${urgencyBadge(urgency)}${statusBadge}
            </div>
        </div>`;
    }).join('');
}

/* ── MULTIDAY VIEW ───────────────────────────────── */
function renderMultidayView() {
    const today = new Date();
    const todayStr = localDateStr(today);

    const days = [0, 1, 2].map(i => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
    });

    const headers = days.map(d => {
        const ds = localDateStr(d);
        const isToday = ds === todayStr;
        const label = d.toLocaleDateString('uk-UA', { weekday: 'short' }) + ' ' + d.getDate();
        return `<div class="cal-header ${isToday ? 'today' : ''}">${label}</div>`;
    }).join('');

    const cells = days.map(d => {
        const ds = localDateStr(d);
        const isToday = ds === todayStr;
        const tasks = localTasks
            .filter(t => (t.deadline || t.createdAt).startsWith(ds))
            .sort((a, b) => (a.deadline || a.createdAt).localeCompare(b.deadline || b.createdAt));
        const pills = tasks.map(t => {
            const baseColor = getColor(t.subjectId);
            const urgency = getUrgency(t);
            const { border } = urgencyStyle(urgency, baseColor);
            const tp = t.deadline ? t.deadline.substring(11, 16) + ' ' : '';
            const urgIcon = urgency === 'overdue' ? '⚠ ' : urgency === 'urgent' ? '🔥 ' : urgency === 'soon' ? '⏰ ' : '';
            return `<div class="task-pill${urgency ? ' task-pill--' + urgency : ''}"
                style="border-left-color:${border}${t.status === 2 ? ';opacity:.5;text-decoration:line-through' : ''}"
                onclick="openTaskDetails(${t.id})">${urgIcon}${escHtml(tp + (t.title || ''))}</div>`;
        }).join('');
        return `<div class="cal-cell ${isToday ? 'today-col' : ''}">${pills}</div>`;
    }).join('');

    document.getElementById('view-multiday').innerHTML = `
        <div class="multiday-grid">
            <div class="cal-header" style="background:#1a1a22;"></div>
            ${headers}
            <div class="cal-cell" style="background:#1a1a22;"></div>
            ${cells}
        </div>`;
}

/* ── WEEK VIEW ───────────────────────────────────── */
function renderWeekView() {
    const today = new Date();
    const todayStr = localDateStr(today);
    const dayOfWeek = (today.getDay() + 6) % 7;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });

    const headers = days.map(d => {
        const ds = localDateStr(d);
        const isToday = ds === todayStr;
        const label = d.toLocaleDateString('uk-UA', { weekday: 'short' }) + '<br/>' + d.getDate();
        return `<div class="cal-header ${isToday ? 'today' : ''}">${label}</div>`;
    }).join('');

    const cells = days.map(d => {
        const ds = localDateStr(d);
        const isToday = ds === todayStr;
        const tasks = localTasks
            .filter(t => (t.deadline || t.createdAt).startsWith(ds))
            .sort((a, b) => (a.deadline || a.createdAt).localeCompare(b.deadline || b.createdAt));
        const pills = tasks.map(t => {
            const baseColor = getColor(t.subjectId);
            const urgency = getUrgency(t);
            const { border } = urgencyStyle(urgency, baseColor);
            const tp = t.deadline ? t.deadline.substring(11, 16) + ' ' : '';
            const urgIcon = urgency === 'overdue' ? '⚠ ' : urgency === 'urgent' ? '🔥 ' : urgency === 'soon' ? '⏰ ' : '';
            return `<div class="task-pill${urgency ? ' task-pill--' + urgency : ''}"
                style="border-left-color:${border}${t.status === 2 ? ';opacity:.5;text-decoration:line-through' : ''}"
                onclick="openTaskDetails(${t.id})">${urgIcon}${escHtml(tp + (t.title || ''))}</div>`;
        }).join('');
        return `<div class="cal-cell ${isToday ? 'today-col' : ''}" style="min-height:100px;">${pills}</div>`;
    }).join('');

    document.getElementById('view-week').innerHTML = `
        <div class="week-grid">
            <div class="cal-header" style="background:#1a1a22;"></div>
            ${headers}
            <div class="cal-cell" style="background:#1a1a22;min-height:100px;"></div>
            ${cells}
        </div>`;
}

/* ── MONTH VIEW ──────────────────────────────────── */
function renderMonthView() {
    const today = new Date();
    const todayStr = localDateStr(today);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOffset = (monthStart.getDay() + 6) % 7;
    const calStart = new Date(monthStart);
    calStart.setDate(1 - startOffset);

    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    const dayHeaders = dayNames.map(n => `<div class="cal-header">${n}</div>`).join('');

    const cells = Array.from({ length: 42 }, (_, i) => {
        const d = new Date(calStart);
        d.setDate(calStart.getDate() + i);
        const ds = localDateStr(d);
        const isToday = ds === todayStr;
        const otherMonth = d.getMonth() !== today.getMonth();

        const tasks = localTasks.filter(t => t.deadline && t.deadline.startsWith(ds));
        const pills = tasks.slice(0, 3).map(t => {
            const baseColor = getColor(t.subjectId);
            const urgency = getUrgency(t);
            const { border } = urgencyStyle(urgency, baseColor);
            const urgIcon = urgency === 'overdue' ? '⚠ ' : urgency === 'urgent' ? '🔥 ' : '';
            return `<div class="task-pill${urgency ? ' task-pill--' + urgency : ''}"
                style="border-left-color:${border}${t.status === 2 ? ';opacity:.5;text-decoration:line-through' : ''}"
                onclick="openTaskDetails(${t.id})">${urgIcon}${escHtml(t.title || '')}</div>`;
        }).join('');
        const more = tasks.length > 3
            ? `<div style="font-size:.65rem;color:#555;">+${tasks.length - 3}</div>` : '';

        return `<div class="month-cell ${isToday ? 'today' : ''} ${otherMonth ? 'other-month' : ''}">
            <div class="day-num">${d.getDate()}</div>
            ${pills}${more}
        </div>`;
    }).join('');

    document.getElementById('view-month').innerHTML = `
        <div class="month-grid">
            ${dayHeaders}
            ${cells}
        </div>`;
}

/* ── FORMAT DATE ─────────────────────────────────── */
function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' })
        + ', ' + d.toTimeString().substring(0, 5);
}

/* ── MODALS ──────────────────────────────────────── */
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

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

function overlayClick(e, id) {
    if (e.target.id === id) closeModal(id);
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeModal('task-modal');
        closeModal('subject-modal');
        closeDetailPanel();
    }
});

/* ── COLOR PICKER ────────────────────────────────── */
function initColorPicker() {
    selectedColor = '#8b5cf6';
    document.getElementById('color-picker').innerHTML = COLORS.map(c =>
        `<div class="cpick ${c === selectedColor ? 'sel' : ''}" style="background:${c}"
              onclick="pickColor('${c}',this)"></div>`
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

/* ── AJAX: CREATE TASK ───────────────────────────── */
async function submitTask() {
    const title = document.getElementById('task-title').value.trim();
    if (!title) { document.getElementById('task-title').focus(); return; }

    const deadlineVal = document.getElementById('task-deadline').value;
    if (deadlineVal) {
        if (new Date(deadlineVal) < new Date()) {
            showToast('Не можна додати задачу на минулу дату!', true);
            return;
        }
    }

    const res = await fetch('/Tasks/CreateAjax', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': getAntiForgeryToken()
        },
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
        id: task.id,
        title: task.title,
        description: task.description,
        subjectName: task.subjectName,
        subjectId: task.subjectId,
        deadline: task.deadline,
        createdAt: task.createdAt,
        status: task.status ?? 0,
        priority: task.priority ?? 0
    });

    closeModal('task-modal');
    showToast('✓ Задачу додано!');
    refreshCurrentView();
}

/* ── AJAX: CREATE SUBJECT ────────────────────────── */
async function submitSubject() {
    const name = document.getElementById('subject-title').value.trim();
    if (!name) { document.getElementById('subject-title').focus(); return; }

    const res = await fetch('/Subject/CreateAjax', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': getAntiForgeryToken()
        },
        body: JSON.stringify({
            name,
            description: document.getElementById('subject-desc').value.trim() || null
        })
    });

    if (!res.ok) { showToast('Помилка збереження', true); return; }

    const subj = await res.json();
    closeModal('subject-modal');
    showToast('✓ Предмет додано!');

    const list = document.getElementById('subject-list-sidebar');
    const link = document.createElement('a');
    link.href = `/Subject/Details/${subj.id}`;
    link.className = 'subject-link';
    link.innerHTML = `<div class="subject-dot" style="background:${selectedColor}"></div><span>${escHtml(subj.name)}</span>`;
    list.appendChild(link);

    const opt = document.createElement('option');
    opt.value = subj.id;
    opt.textContent = subj.name;
    document.getElementById('task-subject').appendChild(opt);

    allSubjects.push({ id: subj.id, name: subj.name });
}

/* ── TASK DETAIL PANEL ───────────────────────────── */
function openTaskDetails(taskId) {
    const t = localTasks.find(x => x.id === taskId);
    if (!t) return;
    detailTaskId = taskId;
    _pendingStatus = null;
    _pendingPriority = null;
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
    const baseColor = getColor(t.subjectId);
    const urgency = getUrgency(t);
    const { border } = urgencyStyle(urgency, baseColor);
    const headerColor = urgency === 'overdue' ? '#ef4444' : urgency === 'urgent' ? '#d97706' : baseColor;
    const statusLabels = ['Не розпочато', 'В процесі', 'Зроблено'];
    const statusColors = ['#6b7280', '#f59e0b', '#10b981'];

    const urgencyInfo = urgency === 'overdue'
        ? `<div class="sdp-urgency-badge overdue">⚠ Дедлайн прострочено!</div>`
        : urgency === 'urgent'
            ? `<div class="sdp-urgency-badge urgent">🔥 Менше 3 годин до дедлайну!</div>`
            : urgency === 'soon'
                ? `<div class="sdp-urgency-badge soon">⏰ Дедлайн сьогодні</div>`
                : '';

    const subjectOptionsHtml = allSubjects
        .map(s => `<option value="${s.id}" ${t.subjectId == s.id ? 'selected' : ''}>${escHtml(s.name)}</option>`)
        .join('');

    document.getElementById('sp-detail-panel').innerHTML = `
        <div class="sdp-header" style="background:${headerColor}">
            <button class="sdp-close" onclick="closeDetailPanel()">✕</button>
            <div class="sdp-header-icon">📌</div>
            <div class="sdp-header-title">${escHtml(t.title || '')}</div>
            <div class="sdp-header-sub">${escHtml(t.subjectName || 'Без предмету')}</div>
        </div>

        <div class="sdp-body">
            ${urgencyInfo}

            <div class="sdp-section-label">Статус</div>
            <div class="sdp-chips" id="sdp-status-chips">
                ${[0, 1, 2].map(i => `
                <div class="sdp-chip ${t.status === i ? 'active' : ''}"
                     style="${t.status === i ? `background:${statusColors[i]};border-color:${statusColors[i]};color:#fff` : ''}"
                     onclick="setStatus(${i},this,'${statusColors[i]}')">
                    ${statusLabels[i]}
                </div>`).join('')}
            </div>

            <div class="sdp-section-label" style="margin-top:12px">Пріоритет</div>
            <div class="sdp-chips" id="sdp-priority-chips">
                ${[{ v: 0, l: 'Звичайний', c: '#6b7280' }, { v: 1, l: 'Важливо ⚡', c: '#f59e0b' }].map(p => `
                <div class="sdp-chip ${t.priority === p.v ? 'active' : ''}"
                     style="${t.priority === p.v ? `background:${p.c};border-color:${p.c};color:#fff` : ''}"
                     onclick="setPriority(${p.v},this,'${p.c}')">
                    ${p.l}
                </div>`).join('')}
            </div>

            <div class="sdp-section-label" style="margin-top:12px">Назва</div>
            <div class="sdp-field">
                <input id="sdp-title" value="${escHtml(t.title || '')}" placeholder="Назва задачі..." />
            </div>

            <div class="sdp-section-label" style="margin-top:12px">Дедлайн</div>
            <div class="sdp-field sdp-field-row">
                <span>📅</span>
                <input type="datetime-local" id="sdp-deadline"
                       value="${t.deadline ? t.deadline.substring(0, 16) : ''}" />
            </div>

            <div class="sdp-section-label" style="margin-top:12px">Предмет</div>
            <div class="sdp-field sdp-field-row">
                <span>📚</span>
                <select id="sdp-subject">
                    <option value="">— без предмету —</option>
                    ${subjectOptionsHtml}
                </select>
            </div>

            <div class="sdp-section-label" style="margin-top:12px">Опис</div>
            <div class="sdp-field">
                <textarea id="sdp-description" rows="4"
                          placeholder="Додай опис...">${escHtml(t.description || '')}</textarea>
            </div>

            <div class="sdp-meta">
                🕐 Створено: ${new Date(t.createdAt).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
        </div>

        <div class="sdp-footer">
            <button class="sdp-btn-save" style="background:${headerColor}" onclick="saveTaskDetails()">
                💾 Зберегти
            </button>
            <button class="sdp-btn-delete" onclick="deleteTaskDetail()">
                🗑 Видалити
            </button>
        </div>
    `;
}

function setStatus(val, el, color) {
    _pendingStatus = val;
    document.querySelectorAll('#sdp-status-chips .sdp-chip').forEach(c => {
        c.classList.remove('active'); c.removeAttribute('style');
    });
    el.classList.add('active');
    el.style.cssText = `background:${color};border-color:${color};color:#fff`;
}

function setPriority(val, el, color) {
    _pendingPriority = val;
    document.querySelectorAll('#sdp-priority-chips .sdp-chip').forEach(c => {
        c.classList.remove('active'); c.removeAttribute('style');
    });
    el.classList.add('active');
    el.style.cssText = `background:${color};border-color:${color};color:#fff`;
}

/* ── AJAX: SAVE TASK DETAILS ─────────────────────── */
async function saveTaskDetails() {
    const t = localTasks.find(x => x.id === detailTaskId);
    if (!t) return;

    const title = document.getElementById('sdp-title').value.trim();
    const deadline = document.getElementById('sdp-deadline').value || null;
    const subjVal = document.getElementById('sdp-subject').value;
    const desc = document.getElementById('sdp-description').value.trim();
    const status = _pendingStatus !== null ? _pendingStatus : (t.status ?? 0);
    const priority = _pendingPriority !== null ? _pendingPriority : (t.priority ?? 0);

    if (!title) { document.getElementById('sdp-title').focus(); return; }

    const res = await fetch(`/Tasks/UpdateAjax/${detailTaskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': getAntiForgeryToken()
        },
        body: JSON.stringify({
            title,
            description: desc || null,
            deadline,
            priority,
            status,
            subjectId: parseInt(subjVal) || null
        })
    });

    if (!res.ok) { showToast('Помилка збереження', true); return; }
    const updated = await res.json();

    const foundSubject = allSubjects.find(s => s.id === (parseInt(subjVal) || null));
    const idx = localTasks.findIndex(x => x.id === detailTaskId);
    localTasks[idx] = {
        ...localTasks[idx],
        ...updated,
        subjectName: foundSubject?.name || null
    };
    _pendingStatus = null;
    _pendingPriority = null;

    showToast('✓ Збережено!');
    closeDetailPanel();
    refreshCurrentView();
}

/* ── AJAX: DELETE TASK ───────────────────────────── */
async function deleteTaskDetail() {
    if (!confirm('Видалити задачу?')) return;

    const res = await fetch(`/Tasks/DeleteAjax/${detailTaskId}`, {
        method: 'DELETE',
        headers: { 'RequestVerificationToken': getAntiForgeryToken() }
    });

    if (!res.ok) { showToast('Помилка видалення', true); return; }

    localTasks = localTasks.filter(t => t.id !== detailTaskId);
    closeDetailPanel();
    showToast('🗑 Задачу видалено');
    refreshCurrentView();
}

/* ── HELPERS ─────────────────────────────────────── */
function getAntiForgeryToken() {
    return document.querySelector('input[name="__RequestVerificationToken"]')?.value
        || antiForgery || '';
}

function showToast(msg, isError = false) {
    const el = document.getElementById('sp-toast');
    if (!el) return;
    el.textContent = msg;
    el.className = isError ? 'error' : '';
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function quickAdd() {
    const val = document.getElementById('quick-task').value.trim();
    if (val) openTaskModal(val);
}

/* ── INJECT UI INTO BODY ─────────────────────────── */
(function injectUI() {
    const subjectOptions = allSubjects
        .map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');

    document.body.insertAdjacentHTML('beforeend', `
        <style>
        /* ── URGENCY BANNER ── */
        #sp-urgency-banner {
            background: #1e1a14;
            border-bottom: 1px solid #3a2e1a;
            padding: 8px 1.75rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-shrink: 0;
        }
        .sp-urgency-inner {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            flex: 1;
        }
        .sp-urgency-tasks {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .sp-urgency-task {
            background: #2a2016;
            border: 1px solid #3a3020;
            border-radius: 6px;
            color: #ccc;
            font-size: .75rem;
            padding: 3px 10px;
            cursor: pointer;
            transition: all .15s;
            max-width: 160px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .sp-urgency-task.overdue {
            border-color: #7f1d1d;
            color: #fca5a5;
            background: #2a1515;
        }
        .sp-urgency-task.urgent {
            border-color: #78350f;
            color: #fcd34d;
            background: #1e1810;
        }
        .sp-urgency-task:hover { opacity: .8; }
        .sp-urgency-close {
            background: none;
            border: none;
            color: #555;
            cursor: pointer;
            font-size: 13px;
            padding: 4px 6px;
            flex-shrink: 0;
        }
        .sp-urgency-close:hover { color: #aaa; }

        /* ── TASK CARD URGENCY ── */
        .task-card--overdue { animation: pulse-red 2s infinite; }
        .task-card--urgent  { animation: pulse-yellow 2s infinite; }
        @keyframes pulse-red    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.15)}  50%{box-shadow:0 0 0 6px rgba(239,68,68,.0)} }
        @keyframes pulse-yellow { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,.15)} 50%{box-shadow:0 0 0 6px rgba(245,158,11,.0)} }

        /* ── URGENCY BADGES ── */
        .task-urgency {
            display: inline-block;
            font-size: .68rem;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 4px;
            margin-top: 4px;
        }
        .task-urgency.overdue { background: rgba(239,68,68,.15);  color: #f87171; }
        .task-urgency.urgent  { background: rgba(245,158,11,.15); color: #fbbf24; }
        .task-urgency.soon    { background: rgba(245,158,11,.08); color: #d97706; }

        /* ── PILL URGENCY ── */
        .task-pill--overdue { background: #2a1515 !important; border-left-color: #ef4444 !important; }
        .task-pill--urgent  { background: #1e1810 !important; border-left-color: #f59e0b !important; }
        .task-pill--soon    { border-left-color: #f59e0b !important; }

        /* ── DETAIL PANEL URGENCY BADGE ── */
        .sdp-urgency-badge {
            border-radius: 8px;
            padding: 8px 12px;
            font-size: .8rem;
            font-weight: 600;
            margin-bottom: 14px;
        }
        .sdp-urgency-badge.overdue { background: rgba(239,68,68,.15); color: #f87171; border: 1px solid rgba(239,68,68,.25); }
        .sdp-urgency-badge.urgent  { background: rgba(245,158,11,.15); color: #fbbf24; border: 1px solid rgba(245,158,11,.25); }
        .sdp-urgency-badge.soon    { background: rgba(245,158,11,.08); color: #d97706; border: 1px solid rgba(245,158,11,.15); }

        /* ── STATUS BADGES ── */
        .task-status-done     { display:inline-block;font-size:.68rem;color:#10b981;margin-top:3px; }
        .task-status-progress { display:inline-block;font-size:.68rem;color:#f59e0b;margin-top:3px; }
        </style>

        <button id="sp-fab" onclick="openTaskModal()">＋</button>

        <div class="sp-overlay" id="task-modal" onclick="overlayClick(event,'task-modal')">
            <div class="sp-modal">
                <div class="modal-top" id="task-modal-top" style="background:#ff4fd8">
                    <button class="modal-close" onclick="closeModal('task-modal')">✕</button>
                    <input class="modal-title-input" id="task-title" placeholder="Назва задачі..." />
                    <div class="modal-subtitle">Нова задача</div>
                </div>
                <div class="modal-body">
                    <div class="modal-field">
                        <span class="modal-field-icon">📅</span>
                        <input type="datetime-local" id="task-deadline"
                               min="${new Date().toISOString().substring(0, 16)}" />
                    </div>
                    <div class="modal-field">
                        <span class="modal-field-icon">📚</span>
                        <select id="task-subject">
                            <option value="">— без предмету —</option>
                            ${subjectOptions}
                        </select>
                    </div>
                    <div class="modal-field">
                        <span class="modal-field-icon">🎯</span>
                        <select id="task-priority">
                            <option value="0">Звичайний пріоритет</option>
                            <option value="1">Важливо</option>
                        </select>
                    </div>
                    <div class="modal-field">
                        <span class="modal-field-icon">📝</span>
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
                        <span style="font-size:.75rem;color:#888">Колір</span>
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

        <div id="sp-detail-backdrop" onclick="closeDetailPanel()"></div>
        <div id="sp-detail-panel"></div>
        <div id="sp-toast"></div>
    `);
})();

/* ── INIT ────────────────────────────────────────── */
document.getElementById('quick-task').addEventListener('keydown', e => {
    if (e.key === 'Enter') quickAdd();
});

renderDayView(selectedDate);
renderUrgencyBanner();

/* Оновлюємо urgency кожні 5 хвилин */
setInterval(() => {
    refreshCurrentView();
}, 5 * 60 * 1000);
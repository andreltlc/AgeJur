/**
 * utils.js
 * Funções utilitárias de data, formatação e escape HTML.
 */

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

function diffDays(dateStr) {
    const target = new Date(dateStr + 'T00:00:00');
    const now    = new Date(todayStr() + 'T00:00:00');
    return Math.round((target - now) / 86_400_000);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function urgencyTag(dateStr) {
    const diff = diffDays(dateStr);
    if (diff < 0)  return `<span class="tag tag-overdue">⚠️ Vencido há ${Math.abs(diff)} dia(s)</span>`;
    if (diff === 0) return `<span class="tag tag-overdue">🔴 Vence hoje</span>`;
    if (diff <= 3)  return `<span class="tag tag-urgent">🟠 Vence em ${diff} dia(s)</span>`;
    if (diff <= 7)  return `<span class="tag tag-urgent">🟡 Em ${diff} dias</span>`;
    return `<span class="tag tag-normal">🟢 Em ${diff} dias</span>`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;');
}

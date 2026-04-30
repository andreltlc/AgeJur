export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function diffDays(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date(todayStr() + 'T00:00:00')
  return Math.round((target - now) / 86_400_000)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function urgencyLabel(dateStr) {
  const diff = diffDays(dateStr)
  if (diff < 0)   return `⚠️ Vencido há ${Math.abs(diff)} dia(s)`
  if (diff === 0) return `🔴 Vence hoje`
  if (diff <= 3)  return `🟠 Vence em ${diff} dia(s)`
  if (diff <= 7)  return `🟡 Em ${diff} dias`
  return `🟢 Em ${diff} dias`
}

export function urgencyClass(dateStr) {
  const diff = diffDays(dateStr)
  if (diff < 0)   return 'tag-overdue'
  if (diff === 0) return 'tag-overdue'
  if (diff <= 3)  return 'tag-urgent'
  if (diff <= 7)  return 'tag-urgent'
  return 'tag-normal'
}

export function audienciaUrgencyLabel(dateStr) {
  const diff = diffDays(dateStr)
  if (diff === 0)     return `🔴 Hoje`
  else if (diff <= 3) return `🟠 Em ${diff} dia(s)`
  else if (diff <= 7) return `🟡 Em ${diff} dias`
  else                return `🟢 Em ${diff} dias`
}

export function audienciaUrgencyClass(dateStr) {
  const diff = diffDays(dateStr)
  if (diff === 0)     return 'tag-overdue'
  else if (diff <= 3) return 'tag-urgent'
  else if (diff <= 7) return 'tag-urgent'
  return 'tag-normal'
}

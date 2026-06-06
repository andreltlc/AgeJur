const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
const db = getFirestore()
const messaging = getMessaging()

// Envia push para lista de uids (busca fcmToken de cada um)
async function notificarUsuarios(uids, notification) {
  const tokens = []
  for (const uid of uids) {
    const snap = await db.collection('users').doc(uid).get()
    const token = snap.data()?.fcmToken
    if (token) tokens.push(token)
  }
  if (tokens.length === 0) return
  await messaging.sendEachForMulticast({
    tokens,
    notification,
    webpush: { notification: { icon: '/icons/icon-192.png' } },
  })
}

// Formata YYYY-MM-DD para DD/MM/YYYY
function fmt(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// Retorna string YYYY-MM-DD para daqui a N dias
function diasAFrente(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// Job diário às 8h (horário de Brasília)
exports.notificarPrazosDiario = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    for (const dias of [1, 3, 7]) {
      const data = diasAFrente(dias)
      const label = dias === 1 ? 'amanhã' : `em ${dias} dias`

      // Prazos
      const prazosSnap = await db.collection('prazos')
        .where('data', '==', data)
        .where('completed', '==', false)
        .get()

      for (const docSnap of prazosSnap.docs) {
        const p = docSnap.data()
        const uids = [p.userId, ...(p.sharedWithUids || [])]
        await notificarUsuarios(uids, {
          title: `⚠️ Prazo vence ${label}`,
          body: `${p.titulo} — ${fmt(p.data)}`,
        })
      }

      // Audiências
      const audSnap = await db.collection('audiencias')
        .where('data', '==', data)
        .get()

      for (const docSnap of audSnap.docs) {
        const a = docSnap.data()
        const uids = [a.userId, ...(a.sharedWithUids || [])]
        await notificarUsuarios(uids, {
          title: `⚖️ Audiência ${label}`,
          body: `${a.titulo} — ${fmt(a.data)}${a.hora ? ' às ' + a.hora : ''}`,
        })
      }
    }
  }
)

// Notifica quando um prazo é compartilhado
exports.notificarCompartilhamentoPrazo = onDocumentUpdated('prazos/{id}', async event => {
  const before = event.data.before.data()
  const after = event.data.after.data()
  const novos = (after.sharedWithUids || []).filter(uid => !(before.sharedWithUids || []).includes(uid))
  if (novos.length === 0) return
  await notificarUsuarios(novos, {
    title: '📨 Prazo compartilhado com você',
    body: `@${after.ownerApelido} compartilhou "${after.titulo}"`,
  })
})

// Notifica quando uma audiência é compartilhada
exports.notificarCompartilhamentoAudiencia = onDocumentUpdated('audiencias/{id}', async event => {
  const before = event.data.before.data()
  const after = event.data.after.data()
  const novos = (after.sharedWithUids || []).filter(uid => !(before.sharedWithUids || []).includes(uid))
  if (novos.length === 0) return
  await notificarUsuarios(novos, {
    title: '📨 Audiência compartilhada com você',
    body: `@${after.ownerApelido} compartilhou "${after.titulo}"`,
  })
})

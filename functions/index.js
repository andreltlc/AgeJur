/**
 * AgeJur — Cloud Functions
 * Webhook do Hotmart: ativa/desativa plano Pro no Firestore
 *
 * Configuração necessária (Firebase CLI):
 *   firebase functions:config:set hotmart.hottok="SEU_HOTTOK_AQUI"
 *
 * URL do webhook (configurar no painel Hotmart):
 *   https://us-central1-agenda-juridica-956d1.cloudfunctions.net/hotmartWebhook?hottok=SEU_HOTTOK_AQUI
 */

const functions = require('firebase-functions')
const admin     = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

/* ── Eventos que ATIVAM o plano Pro ── */
const ACTIVATE_EVENTS = [
  'PURCHASE_APPROVED',
  'PURCHASE_COMPLETE',
]

/* ── Eventos que DESATIVAM o plano Pro ── */
const DEACTIVATE_EVENTS = [
  'PURCHASE_CANCELLED',
  'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK',
  'SUBSCRIPTION_CANCELLATION',
]

exports.hotmartWebhook = functions.https.onRequest(async (req, res) => {
  /* Aceita só POST */
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed')
    return
  }

  /* ── Valida hottok ── */
  const hottok         = req.query.hottok || req.headers['x-hotmart-hottok'] || ''
  const expectedHottok = functions.config().hotmart?.hottok || ''

  if (expectedHottok && hottok !== expectedHottok) {
    console.warn('Hotmart webhook: hottok inválido')
    res.status(401).send('Unauthorized')
    return
  }

  const body = req.body

  /* Hotmart às vezes envia string JSON — faz parse se necessário */
  let payload = body
  if (typeof body === 'string') {
    try { payload = JSON.parse(body) } catch { payload = {} }
  }

  const event         = payload.event
  const data          = payload.data
  const buyerEmail    = data?.buyer?.email?.toLowerCase?.()
  const transactionId = data?.purchase?.transaction || null

  console.log(`Hotmart event: ${event} | email: ${buyerEmail} | tx: ${transactionId}`)

  if (!event || !buyerEmail) {
    res.status(400).send('Bad Request — missing event or buyer email')
    return
  }

  try {
    /* ── Busca uid pelo e-mail ── */
    let uid = null

    /* 1. Tenta no Firestore (campo email em users) */
    const usersSnap = await db
      .collection('users')
      .where('email', '==', buyerEmail)
      .limit(1)
      .get()

    if (!usersSnap.empty) {
      uid = usersSnap.docs[0].id
    } else {
      /* 2. Tenta no Firebase Auth */
      try {
        const userRecord = await admin.auth().getUserByEmail(buyerEmail)
        uid = userRecord.uid
      } catch {
        console.log(`Usuário não encontrado para o e-mail: ${buyerEmail}`)
      }
    }

    /* ── Grava log na coleção subscriptions (auditoria) ── */
    const logRef = transactionId
      ? db.collection('subscriptions').doc(transactionId)
      : db.collection('subscriptions').doc()

    await logRef.set({
      event,
      buyerEmail,
      uid: uid || null,
      transactionId,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })

    if (!uid) {
      res.status(200).send('OK — usuario nao encontrado, evento registrado')
      return
    }

    const userRef = db.collection('users').doc(uid)

    /* ── Atualiza plano ── */
    if (ACTIVATE_EVENTS.includes(event)) {
      await userRef.set({
        plan: 'pro',
        planStatus: 'active',
        planActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
        hotmartTransactionId: transactionId,
      }, { merge: true })
      console.log(`✅ Plano Pro ativado: ${buyerEmail} (${uid})`)

    } else if (DEACTIVATE_EVENTS.includes(event)) {
      const planStatus = event === 'PURCHASE_REFUNDED' ? 'refunded'
        : event === 'PURCHASE_CHARGEBACK' ? 'chargeback'
        : 'cancelled'

      await userRef.set({
        plan: 'free',
        planStatus,
        planCancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
      console.log(`⚠️ Plano cancelado: ${buyerEmail} (${uid}) — ${event}`)

    } else {
      console.log(`Evento ignorado: ${event}`)
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('Erro no webhook Hotmart:', error)
    res.status(500).send('Internal Server Error')
  }
})

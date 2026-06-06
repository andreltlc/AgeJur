import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const VAPID_KEY = 'BLZcIXF3AZ4X4lovjsRxTQaFQWlnjhPrYq4uGqeJ2Yr90LZN3TCOEv5cQJ3VsXlTQtyqnibEFs8A1vKheSNkgm4'

// Retorna o estado atual da permissão: 'default' | 'granted' | 'denied' | 'unsupported'
export function notificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// Chamado automaticamente no login — apenas registra o token se já tiver permissão
export async function initNotifications(userId) {
  if (notificationPermission() !== 'granted') return
  await registrarToken(userId)
}

// Chamado pelo clique do usuário no botão — pede permissão e registra o token
export async function ativarNotificacoes(userId) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ok: false, msg: 'Seu navegador não suporta notificações.' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, msg: 'Permissão negada. Habilite nas configurações do navegador.' }
  }

  const ok = await registrarToken(userId)
  return ok
    ? { ok: true, msg: 'Notificações ativadas com sucesso!' }
    : { ok: false, msg: 'Erro ao registrar. Tente novamente.' }
}

async function registrarToken(userId) {
  try {
    const messaging = getMessaging()
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (!token) return false
    await updateDoc(doc(db, 'users', userId), { fcmToken: token })

    onMessage(messaging, payload => {
      const { title, body } = payload.notification
      new Notification(title, { body, icon: '/icons/icon-192.png' })
    })

    return true
  } catch (err) {
    console.error('Erro ao registrar token FCM:', err)
    return false
  }
}

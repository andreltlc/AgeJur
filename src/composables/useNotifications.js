import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const VAPID_KEY = 'BLZcIXF3AZ4X4lovjsRxTQaFQWlnjhPrYq4uGqeJ2Yr90LZN3TCOEv5cQJ3VsXlTQtyqnibEFs8A1vKheSNkgm4'

export async function initNotifications(userId) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const messaging = getMessaging()
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })

    if (token) {
      await updateDoc(doc(db, 'users', userId), { fcmToken: token })
    }

    onMessage(messaging, payload => {
      const { title, body } = payload.notification
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
      })
    })
  } catch (err) {
    console.warn('Push notifications não disponíveis:', err.message)
  }
}

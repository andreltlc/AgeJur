importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAv_8Fbcpqwp1VoSccrkN284-g5BX1mf60',
  authDomain: 'agenda-juridica-956d1.firebaseapp.com',
  projectId: 'agenda-juridica-956d1',
  messagingSenderId: '269811243307',
  appId: '1:269811243307:web:d0a767b1f5f2acacd94d6e',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data,
  })
})

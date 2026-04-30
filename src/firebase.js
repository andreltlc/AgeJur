import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAv_8Fbcpqwp1VoSccrkN284-g5BX1mf60',
  authDomain: 'agenda-juridica-956d1.firebaseapp.com',
  projectId: 'agenda-juridica-956d1',
  storageBucket: 'agenda-juridica-956d1.firebasestorage.app',
  messagingSenderId: '269811243307',
  appId: '1:269811243307:web:d0a767b1f5f2acacd94d6e',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

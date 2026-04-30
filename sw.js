/**
 * sw.js — Service Worker
 * Cacheia o shell do app para funcionamento offline.
 * Os dados (Firestore) têm persistência própria via Firebase SDK.
 */

const CACHE_NAME = 'agenda-juridica-v2';

const ARQUIVOS = [
    './index.html',
    './login.html',
    './admin.html',
    './manifest.json',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './css/styles.css',
    './css/auth.css',
    './css/admin.css',
    './js/firebase-config.js',
    './js/utils.js',
    './js/storage.js',
    './js/prazos.js',
    './js/audiencias.js',
    './js/app.js',
    './js/login.js',
    './js/admin.js',
];

/* Instala e cacheia todos os arquivos locais */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS))
    );
    self.skipWaiting();
});

/* Remove caches de versões anteriores */
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

/* Cache first para arquivos locais; rede direta para CDN/Firebase */
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    /* Deixa Firebase e CDN externos passarem direto (sem cache do SW) */
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            const network = fetch(event.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            });
            return cached || network;
        })
    );
});

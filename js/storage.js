/**
 * storage.js
 * Operações de leitura/escrita no Firestore e upload no Firebase Storage.
 * Depende de: firebase-config.js (db, storage, auth) e currentUser (definido em app.js).
 */

/* ─────────────────────────────────────────────
   PRAZOS
   ───────────────────────────────────────────── */

function listenPrazos(callback) {
    return db.collection('prazos')
        .where('userId', '==', currentUser.uid)
        .onSnapshot(snapshot => {
            const prazos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(prazos);
        });
}

function addPrazo(data) {
    return db.collection('prazos').add({
        ...data,
        userId:    currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
}

function updatePrazo(id, data) {
    return db.collection('prazos').doc(id).update(data);
}

function deletePrazoDoc(id) {
    return db.collection('prazos').doc(id).delete();
}

/* ─────────────────────────────────────────────
   AUDIÊNCIAS
   ───────────────────────────────────────────── */

function listenAudiencias(callback) {
    return db.collection('audiencias')
        .where('userId', '==', currentUser.uid)
        .onSnapshot(snapshot => {
            const audiencias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(audiencias);
        });
}

function addAudiencia(data) {
    return db.collection('audiencias').add({
        ...data,
        userId:    currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
}

function updateAudiencia(id, data) {
    return db.collection('audiencias').doc(id).update(data);
}

function deleteAudienciaDoc(id) {
    return db.collection('audiencias').doc(id).delete();
}


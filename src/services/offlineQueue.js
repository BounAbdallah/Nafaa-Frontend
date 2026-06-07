/**
 * offlineQueue.js
 * ---------------
 * File d'attente IndexedDB pour les requêtes échouées hors ligne.
 * - Chaque écriture (POST/PUT/DELETE) qui échoue par manque de réseau
 *   est stockée ici avec toutes les infos nécessaires pour la rejouer.
 * - À la reconnexion, `processQueue()` les rejoue dans l'ordre.
 */

import { openDB } from 'idb'

const DB_NAME    = 'qiwam-offline'
const DB_VERSION = 1
const STORE      = 'pending-requests'

let _db = null

async function getDB() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    },
  })
  return _db
}

/** Ajouter une requête en attente */
export async function enqueue({ method, url, data, label }) {
  const db = await getDB()
  const id = await db.add(STORE, {
    method,
    url,
    data,
    label,        // ex: "Vente POS #12345"
    createdAt: new Date().toISOString(),
  })
  window.dispatchEvent(new CustomEvent('qiwam:queue-changed'))
  return id
}

/** Récupérer toutes les requêtes en attente */
export async function getAll() {
  const db = await getDB()
  return db.getAll(STORE)
}

/** Supprimer une requête (après succès) */
export async function remove(id) {
  const db = await getDB()
  await db.delete(STORE, id)
  window.dispatchEvent(new CustomEvent('qiwam:queue-changed'))
}

/** Nombre de requêtes en attente */
export async function count() {
  const db = await getDB()
  return db.count(STORE)
}

/** Vider toute la file */
export async function clear() {
  const db = await getDB()
  await db.clear(STORE)
  window.dispatchEvent(new CustomEvent('qiwam:queue-changed'))
}

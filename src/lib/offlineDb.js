// src/lib/offlineDb.js

const DB_NAME = 'EduPulseOfflineDB';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('exams')) {
        db.createObjectStore('exams', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_results')) {
        db.createObjectStore('pending_results', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveFilesLocally = async (files) => {
  try {
    const db = await initDB();
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    files.forEach(f => store.put(f));
    return tx.complete;
  } catch (err) {
    console.error('IndexedDB saveFilesLocally error:', err);
  }
};

export const getFilesLocally = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
};

export const saveExamLocally = async (exam) => {
  try {
    const db = await initDB();
    const tx = db.transaction('exams', 'readwrite');
    const store = tx.objectStore('exams');
    store.put(exam);
    return tx.complete;
  } catch (err) {
    console.error('IndexedDB saveExamLocally error:', err);
  }
};

export const getExamLocally = async (examId) => {
  try {
    const db = await initDB();
    const tx = db.transaction('exams', 'readonly');
    const store = tx.objectStore('exams');
    return new Promise((resolve) => {
      const request = store.get(examId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
};

export const savePendingExamResult = async (resultData) => {
  try {
    const db = await initDB();
    const tx = db.transaction('pending_results', 'readwrite');
    const store = tx.objectStore('pending_results');
    store.put(resultData);
    return tx.complete;
  } catch (err) {
    console.error('IndexedDB savePendingExamResult error:', err);
  }
};

export const getPendingExamResults = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction('pending_results', 'readonly');
    const store = tx.objectStore('pending_results');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
};

export const removePendingExamResult = async (id) => {
  try {
    const db = await initDB();
    const tx = db.transaction('pending_results', 'readwrite');
    const store = tx.objectStore('pending_results');
    store.delete(id);
    return tx.complete;
  } catch (err) {
    console.error('IndexedDB removePendingExamResult error:', err);
  }
};

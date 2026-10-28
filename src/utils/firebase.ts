import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { WaterRecord, AlertNotification, UserAccount } from '../types';
import { INITIAL_RECORDS } from './waterAnalysis';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection state test
let isDbConnected = false;
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isDbConnected = true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Operating with local cache.');
    }
    // Expected on initial boot if doc doesn't exist
    isDbConnected = true;
  }
}
testConnection();

export const firestoreService = {
  /**
   * Listen to real-time water test records from Firestore
   */
  subscribeToWaterRecords(
    onData: (records: WaterRecord[]) => void,
    onError?: (err: Error) => void
  ) {
    try {
      const recordsCol = collection(db, 'water_records');
      const q = query(recordsCol, limit(100));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            onData(INITIAL_RECORDS);
            return;
          }
          const loaded: WaterRecord[] = [];
          snapshot.forEach((docSnap) => {
            loaded.push(docSnap.data() as WaterRecord);
          });
          // Sort newest first
          loaded.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
          onData(loaded);
        },
        (error) => {
          console.warn('Firestore records subscription warning:', error.message);
          if (onError) onError(error);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Falling back to local records listener:', e);
      onData(INITIAL_RECORDS);
      return () => {};
    }
  },

  /**
   * Save a water test sample to Firestore
   */
  async saveRecord(record: WaterRecord): Promise<void> {
    try {
      const docRef = doc(db, 'water_records', record.id);
      await setDoc(docRef, record);
    } catch (err) {
      console.warn('Firestore write warning; record saved in local memory:', err);
    }
  },

  /**
   * Delete a water test sample from Firestore
   */
  async deleteRecord(recordId: string): Promise<void> {
    try {
      const docRef = doc(db, 'water_records', recordId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore delete error:', err);
    }
  },

  /**
   * Clear all records
   */
  async clearAllRecords(records: WaterRecord[]): Promise<void> {
    try {
      for (const rec of records) {
        await deleteDoc(doc(db, 'water_records', rec.id));
      }
    } catch (err) {
      console.warn('Firestore bulk delete error:', err);
    }
  },

  /**
   * Real-time local community alerts listener
   */
  subscribeToAlerts(
    onData: (alerts: AlertNotification[]) => void
  ) {
    try {
      const alertsCol = collection(db, 'local_alerts');
      const q = query(alertsCol, limit(20));

      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const loaded: AlertNotification[] = [];
            snapshot.forEach((snap) => {
              loaded.push(snap.data() as AlertNotification);
            });
            onData(loaded);
          }
        },
        (err) => {
          console.warn('Alerts listener note:', err.message);
        }
      );
    } catch (e) {
      return () => {};
    }
  },

  /**
   * Push a new local area alert
   */
  async addAlert(alert: AlertNotification): Promise<void> {
    try {
      const docRef = doc(db, 'local_alerts', alert.id);
      await setDoc(docRef, alert);
    } catch (e) {
      console.warn('Firestore alert save note:', e);
    }
  },
};

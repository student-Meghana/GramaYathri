import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Route, Ping, Alert, OperationType, UserProfile } from '../types';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function subscribeToRoutes(callback: (routes: Route[]) => void) {
  const path = 'routes';
  const q = query(collection(db, path));
  
  return onSnapshot(q, (snapshot) => {
    const routes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
    callback(routes);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
}

export async function createRoute(name: string, stops: string[]) {
  const path = 'routes';
  try {
    const docRef = doc(collection(db, path));
    const newRoute: Route = {
      id: docRef.id,
      name,
      stops
    };
    await setDoc(docRef, newRoute);
    return newRoute;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToPings(routeId: string, callback: (pings: Ping[]) => void) {
  const path = `routes/${routeId}/pings`;
  const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const pings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ping));
    callback(pings);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
}

export function subscribeToAlerts(routeId: string, callback: (alerts: Alert[]) => void) {
  const path = `routes/${routeId}/alerts`;
  const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(10));
  
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
    callback(alerts);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
}

export async function createPing(routeId: string, stopId: string, stopName: string, userName: string) {
  const path = `routes/${routeId}/pings`;
  try {
    if (!auth.currentUser) throw new Error("Not authenticated");
    await addDoc(collection(db, path), {
      routeId,
      stopId,
      stopName,
      userName,
      userId: auth.currentUser.uid,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createAlert(routeId: string, type: Alert['type'], message: string, userName: string) {
  const path = `routes/${routeId}/alerts`;
  try {
    if (!auth.currentUser) throw new Error("Not authenticated");
    await addDoc(collection(db, path), {
      routeId,
      type,
      message,
      userName,
      userId: auth.currentUser.uid,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateProfile(uid: string, userName: string) {
  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, path), {
      userName,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

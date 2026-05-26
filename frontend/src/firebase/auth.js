import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import app from './config';

const auth = getAuth(app);

void setPersistence(auth, browserLocalPersistence);

export async function loginWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logoutFirebase() {
  await signOut(auth);
}

export { auth };

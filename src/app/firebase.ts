import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyABvC3sj2dU3HDX6_PaVxDLmT7L2-U5Tm8',
  authDomain: 'ticket-booking-662ee.firebaseapp.com',
  projectId: 'ticket-booking-662ee',
  storageBucket: 'ticket-booking-662ee.firebasestorage.app',
  messagingSenderId: '103094256545',
  appId: '1:103094256545:web:01445188ae4e07c01241e0',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

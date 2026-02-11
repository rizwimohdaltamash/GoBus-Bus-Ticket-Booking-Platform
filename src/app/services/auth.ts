import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  User
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs
} from 'firebase/firestore';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'busAdmin';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser: AppUser | null = null;
  private authReady = false;
  private authReadyResolve!: () => void;
  private authReadyPromise: Promise<void>;
  private signingUp = false;

  constructor(private router: Router) {
    this.authReadyPromise = new Promise((resolve) => {
      this.authReadyResolve = resolve;
      onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        if (firebaseUser) {
          // Skip loading profile during signup — it's set manually in signup()
          if (!this.signingUp) {
            await this.loadUserProfile(firebaseUser.uid);
          }
        } else {
          this.currentUser = null;
        }
        this.authReady = true;
        resolve();
      });
    });
  }

  private async loadUserProfile(uid: string, retries = 1): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        this.currentUser = userDoc.data() as AppUser;
      } else if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return this.loadUserProfile(uid, retries - 1);
      } else {
        // Auth user exists but no Firestore profile — build a minimal one from Firebase Auth
        const fbUser = auth.currentUser;
        if (fbUser) {
          this.currentUser = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            role: 'user',
          };
        }
      }
    } catch (err: any) {
      // Handle permission errors gracefully — build profile from Firebase Auth
      console.warn('Firestore profile load failed, using auth data:', err.message);
      const fbUser = auth.currentUser;
      if (fbUser) {
        this.currentUser = {
          uid: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          role: 'user',
        };
      }
    }
  }

  async waitForAuth(): Promise<void> {
    if (this.authReady) return;
    return this.authReadyPromise;
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await this.loadUserProfile(cred.user.uid);

      if (this.currentUser?.role === 'busAdmin') {
        this.router.navigate(['/bus-admin']);
      } else {
        this.router.navigate(['/home']);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: this.getFirebaseError(err.code) };
    }
  }

  async signup(
    name: string,
    email: string,
    password: string,
    role: 'user' | 'busAdmin'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.signingUp = true;

      // If user already exists in Firebase Auth (orphaned from failed signup),
      // try logging in first, then write the profile
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          try {
            cred = await signInWithEmailAndPassword(auth, email, password);
          } catch {
            this.signingUp = false;
            return { success: false, error: 'This email is already registered with a different password. Try logging in.' };
          }
        } else {
          throw createErr;
        }
      }

      const userData: AppUser = {
        uid: cred.user.uid,
        name,
        email,
        role,
      };

      // Write profile to Firestore — MUST succeed for proper functionality
      await setDoc(doc(db, 'users', cred.user.uid), {
        ...userData,
        createdAt: new Date().toISOString(),
      });

      // Set currentUser BEFORE navigation so guards see the correct role
      this.currentUser = userData;
      this.authReady = true;
      this.signingUp = false;

      if (role === 'busAdmin') {
        this.router.navigate(['/bus-admin']);
      } else {
        this.router.navigate(['/home']);
      }
      return { success: true };
    } catch (err: any) {
      this.signingUp = false;
      // If it's a Firestore permission error, give a clear message
      if (err.message?.includes('permission') || err.code === 'permission-denied') {
        return { success: false, error: 'Database permission denied. Please contact support or check Firestore rules.' };
      }
      return { success: false, error: this.getFirebaseError(err.code) };
    }
  }

  async logout() {
    await signOut(auth);
    this.currentUser = null;
    localStorage.removeItem('lastBooking');
    this.router.navigate(['/']);
  }

  getUser(): AppUser | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  async getUserCreatedAt(): Promise<string | null> {
    if (!this.currentUser) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
      if (userDoc.exists()) {
        return userDoc.data()['createdAt'] || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async getAdminBusCount(): Promise<number> {
    if (!this.currentUser) return 0;
    try {
      const snap = await getDocs(collection(db, 'buses'));
      return snap.docs.filter((d) => d.data()['adminUid'] === this.currentUser!.uid).length;
    } catch {
      return 0;
    }
  }

  async getUserBookingCount(): Promise<number> {
    if (!this.currentUser) return 0;
    try {
      const snap = await getDocs(collection(db, 'bookings'));
      return snap.docs.filter((d) => d.data()['userId'] === this.currentUser!.uid).length;
    } catch {
      return 0;
    }
  }

  isBusAdmin(): boolean {
    return this.currentUser?.role === 'busAdmin';
  }

  // ── Bus Registration (Firestore) ──

  async registerBus(busData: any): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser || this.currentUser.role !== 'busAdmin') {
      return { success: false, error: 'Unauthorized' };
    }
    try {
      await addDoc(collection(db, 'buses'), {
        ...busData,
        adminUid: this.currentUser.uid,
        adminName: this.currentUser.name,
        createdAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getAdminBuses(): Promise<any[]> {
    if (!this.currentUser) {
      console.warn('getAdminBuses: No current user');
      return [];
    }
    console.log('getAdminBuses: currentUser.uid =', this.currentUser.uid);
    try {
      // Fetch all buses and filter client-side to avoid composite index requirements
      const snap = await getDocs(collection(db, 'buses'));
      const allBuses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log('getAdminBuses: total buses in DB =', allBuses.length, allBuses.map((b: any) => ({ id: b.id, adminUid: b.adminUid })));
      const myBuses = allBuses.filter((b: any) => b.adminUid === this.currentUser!.uid);
      console.log('getAdminBuses: my buses =', myBuses.length);
      myBuses.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return myBuses;
    } catch (err: any) {
      console.error('Error fetching admin buses:', err.code, err.message);
      throw new Error(err.message || 'Failed to load buses');
    }
  }

  async updateBus(busId: string, busData: any): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser || this.currentUser.role !== 'busAdmin') {
      return { success: false, error: 'Unauthorized' };
    }
    try {
      // Verify the bus belongs to this admin before updating
      const busDoc = await getDoc(doc(db, 'buses', busId));
      if (!busDoc.exists() || busDoc.data()['adminUid'] !== this.currentUser.uid) {
        return { success: false, error: 'Bus not found or unauthorized' };
      }
      await updateDoc(doc(db, 'buses', busId), {
        ...busData,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async deleteBus(busId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser || this.currentUser.role !== 'busAdmin') {
      return { success: false, error: 'Unauthorized' };
    }
    try {
      // Verify the bus belongs to this admin before deleting
      const busDoc = await getDoc(doc(db, 'buses', busId));
      if (!busDoc.exists() || busDoc.data()['adminUid'] !== this.currentUser.uid) {
        return { success: false, error: 'Bus not found or unauthorized' };
      }
      await deleteDoc(doc(db, 'buses', busId));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getAllBuses(): Promise<any[]> {
    try {
      const snap = await getDocs(collection(db, 'buses'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Error fetching buses:', err);
      return [];
    }
  }

  // ── Booked Seats ──

  async getBookedSeatsForBus(busId: string): Promise<string[]> {
    try {
      const snap = await getDocs(collection(db, 'bookings'));
      const allBookings = snap.docs.map((d) => d.data());
      // Only count seats from confirmed bookings (exclude cancelled ones)
      const busBookings = allBookings.filter((b: any) => b.busId === busId && b.status !== 'cancelled_by_admin' && b.status !== 'cancelled_by_user');
      const allSeatIds: string[] = [];
      for (const booking of busBookings) {
        if (Array.isArray((booking as any).seatIds)) {
          allSeatIds.push(...(booking as any).seatIds);
        }
      }
      return allSeatIds;
    } catch (err) {
      console.error('Error fetching booked seats:', err);
      return [];
    }
  }

  // ── Booking (Firestore) ──

  async saveBooking(bookingData: any): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) return { success: false, error: 'Not logged in' };
    try {
      await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        userId: this.currentUser.uid,
        userName: this.currentUser.name,
        userEmail: this.currentUser.email,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getUserBookings(): Promise<any[]> {
    if (!this.currentUser) return [];
    try {
      // Fetch all bookings and filter client-side to avoid composite index issues
      const snap = await getDocs(collection(db, 'bookings'));
      const allBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const myBookings = allBookings.filter((b: any) => b.userId === this.currentUser!.uid);
      myBookings.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return myBookings;
    } catch (err) {
      console.error('Error fetching bookings:', err);
      return [];
    }
  }

  // ── Cancel Booking ──

  async cancelBookingByUser(bookingId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) return { success: false, error: 'Not logged in' };
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingDoc.exists()) return { success: false, error: 'Booking not found' };
      const data = bookingDoc.data();
      if (data['userId'] !== this.currentUser.uid) return { success: false, error: 'Unauthorized' };
      if (data['status'] === 'cancelled_by_admin') return { success: false, error: 'This booking was already cancelled by admin' };
      if (data['status'] === 'cancelled_by_user') return { success: false, error: 'Booking is already cancelled' };
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled_by_user',
        cancelledAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async cancelBookingByAdmin(bookingId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser || this.currentUser.role !== 'busAdmin') return { success: false, error: 'Unauthorized' };
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingDoc.exists()) return { success: false, error: 'Booking not found' };
      const data = bookingDoc.data();
      // Verify this booking is for one of the admin's buses
      const busDoc = await getDoc(doc(db, 'buses', data['busId']));
      if (!busDoc.exists() || busDoc.data()['adminUid'] !== this.currentUser.uid) {
        return { success: false, error: 'Unauthorized — this bus does not belong to you' };
      }
      if (data['status'] === 'cancelled_by_admin') return { success: false, error: 'Already cancelled' };
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled_by_admin',
        cancelledAt: new Date().toISOString(),
        cancelledByAdminName: this.currentUser.name,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ── Admin: Get all bookings for admin's buses ──

  async getAdminBookings(): Promise<any[]> {
    if (!this.currentUser || this.currentUser.role !== 'busAdmin') return [];
    try {
      // Get admin's bus IDs
      const busSnap = await getDocs(collection(db, 'buses'));
      const adminBusIds = busSnap.docs
        .filter((d) => d.data()['adminUid'] === this.currentUser!.uid)
        .map((d) => d.id);
      if (adminBusIds.length === 0) return [];

      // Get bookings for those buses
      const bookingSnap = await getDocs(collection(db, 'bookings'));
      const allBookings = bookingSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const adminBookings = allBookings.filter((b: any) => adminBusIds.includes(b.busId));
      adminBookings.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return adminBookings;
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
      return [];
    }
  }

  // ── Local booking confirmation cache ──

  saveBookingConfirmation(data: any) {
    localStorage.setItem('lastBooking', JSON.stringify(data));
  }

  getBookingConfirmation() {
    return JSON.parse(localStorage.getItem('lastBooking') || 'null');
  }

  hasBookingConfirmation(): boolean {
    return !!localStorage.getItem('lastBooking');
  }

  private getFirebaseError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try logging in.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}

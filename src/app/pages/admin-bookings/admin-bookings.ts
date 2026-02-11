import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-admin-bookings',
    imports: [MatIcon, RouterLink, DatePipe],
    templateUrl: './admin-bookings.html',
    styleUrl: './admin-bookings.css',
})
export class AdminBookings implements OnInit {
    bookings: any[] = [];
    filteredBookings: any[] = [];
    loading = false;
    errorMsg = '';
    activeFilter: string = 'all';

    // Cancel confirmation
    cancellingId: string | null = null;
    cancelError = '';

    constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

    async ngOnInit() {
        await this.auth.waitForAuth();
        if (!this.auth.isLoggedIn() || !this.auth.isBusAdmin()) {
            this.router.navigate(['/']);
            return;
        }
        await this.loadBookings();
    }

    async loadBookings() {
        this.loading = true;
        this.cdr.detectChanges();
        try {
            this.bookings = await this.auth.getAdminBookings();
            this.applyFilter();
        } catch (err: any) {
            this.errorMsg = err.message || 'Failed to load bookings.';
            this.bookings = [];
            this.filteredBookings = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
    }

    setFilter(filter: string) {
        this.activeFilter = filter;
        this.applyFilter();
        this.cdr.detectChanges();
    }

    applyFilter() {
        if (this.activeFilter === 'all') {
            this.filteredBookings = [...this.bookings];
        } else {
            this.filteredBookings = this.bookings.filter((b: any) => b.status === this.activeFilter);
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'confirmed': return 'Confirmed';
            case 'cancelled_by_admin': return 'Cancelled by Admin';
            case 'cancelled_by_user': return 'Cancelled by User';
            default: return 'Confirmed';
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled_by_admin': return 'bg-red-100 text-red-700 border-red-200';
            case 'cancelled_by_user': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-green-100 text-green-700 border-green-200';
        }
    }

    get confirmedCount(): number {
        return this.bookings.filter((b: any) => b.status === 'confirmed' || !b.status).length;
    }

    get cancelledCount(): number {
        return this.bookings.filter((b: any) => b.status === 'cancelled_by_admin' || b.status === 'cancelled_by_user').length;
    }

    confirmCancel(bookingId: string) {
        this.cancellingId = bookingId;
        this.cancelError = '';
        this.cdr.detectChanges();
    }

    dismissCancel() {
        this.cancellingId = null;
        this.cancelError = '';
        this.cdr.detectChanges();
    }

    async cancelBooking() {
        if (!this.cancellingId) return;
        const result = await this.auth.cancelBookingByAdmin(this.cancellingId);
        if (result.success) {
            // Update local state
            const booking = this.bookings.find((b: any) => b.id === this.cancellingId);
            if (booking) {
                booking.status = 'cancelled_by_admin';
                booking.cancelledAt = new Date().toISOString();
            }
            this.applyFilter();
            this.cancellingId = null;
            this.cancelError = '';
        } else {
            this.cancelError = result.error || 'Failed to cancel booking';
        }
        this.cdr.detectChanges();
    }
}

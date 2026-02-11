import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-my-buses',
    imports: [MatIcon, RouterLink],
    templateUrl: './my-buses.html',
    styleUrl: './my-buses.css',
})
export class MyBuses implements OnInit {
    buses: any[] = [];
    loading = false;
    successMsg = '';
    errorMsg = '';

    // Edit state
    editingBusId: string | null = null;
    editData: any = {};

    // Delete confirmation
    deletingBusId: string | null = null;
    deleting = false;
    updating = false;

    constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

    async ngOnInit() {
        await this.auth.waitForAuth();
        if (!this.auth.isBusAdmin()) {
            this.router.navigate(['/home']);
            return;
        }
        await this.loadBuses();
    }

    async loadBuses() {
        this.loading = true;
        this.errorMsg = '';
        this.cdr.detectChanges();
        try {
            this.buses = await this.auth.getAdminBuses();
        } catch (err: any) {
            this.errorMsg = err.message || 'Failed to load buses. Please try refreshing.';
            this.buses = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
    }

    // ── Edit ──

    startEdit(bus: any) {
        this.editingBusId = bus.id;
        this.editData = {
            busName: bus.busName,
            vehicleType: bus.vehicleType,
            busType: bus.busType,
            fromCity: bus.fromCity,
            toCity: bus.toCity,
            departureTime: bus.departureTime,
            arrivalTime: bus.arrivalTime,
            duration: bus.duration,
            stops: bus.stops,
            price: bus.price,
            totalSeats: bus.totalSeats,
        };
        this.errorMsg = '';
        this.successMsg = '';
    }

    cancelEdit() {
        this.editingBusId = null;
        this.editData = {};
    }

    async saveEdit() {
        if (!this.editingBusId) return;
        this.errorMsg = '';
        this.successMsg = '';

        if (!this.editData.busName || !this.editData.fromCity || !this.editData.toCity || !this.editData.price) {
            this.errorMsg = 'Please fill in all required fields.';
            return;
        }

        this.updating = true;
        const result = await this.auth.updateBus(this.editingBusId, {
            ...this.editData,
            price: Number(this.editData.price),
            totalSeats: Number(this.editData.totalSeats),
        });
        this.updating = false;

        if (result.success) {
            this.successMsg = 'Bus updated successfully!';
            this.editingBusId = null;
            this.editData = {};
            await this.loadBuses();
            setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 3000);
        } else {
            this.errorMsg = result.error || 'Failed to update bus.';
        }
        this.cdr.detectChanges();
    }

    // ── Delete ──

    confirmDelete(busId: string) {
        this.deletingBusId = busId;
        this.errorMsg = '';
        this.successMsg = '';
    }

    cancelDelete() {
        this.deletingBusId = null;
    }

    async deleteBus() {
        if (!this.deletingBusId) return;
        this.deleting = true;
        const result = await this.auth.deleteBus(this.deletingBusId);
        this.deleting = false;

        if (result.success) {
            this.successMsg = 'Bus deleted successfully!';
            this.deletingBusId = null;
            await this.loadBuses();
            setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 3000);
        } else {
            this.errorMsg = result.error || 'Failed to delete bus.';
        }
        this.cdr.detectChanges();
    }
}

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-bus-admin',
    imports: [MatIcon, RouterLink],
    templateUrl: './bus-admin.html',
    styleUrl: './bus-admin.css',
})
export class BusAdmin implements OnInit {
    submitting = false;
    successMsg = '';
    errorMsg = '';
    user: any = null;

    constructor(private auth: AuthService, private router: Router) { }

    async ngOnInit() {
        await this.auth.waitForAuth();
        if (!this.auth.isBusAdmin()) {
            this.router.navigate(['/home']);
            return;
        }
        this.user = this.auth.getUser();
    }

    async registerBus(
        busName: string,
        vehicleType: string,
        busType: string,
        fromCity: string,
        toCity: string,
        departureTime: string,
        arrivalTime: string,
        duration: string,
        stops: string,
        price: string,
        totalSeats: string
    ) {
        this.errorMsg = '';
        this.successMsg = '';

        if (!busName || !vehicleType || !fromCity || !toCity || !departureTime || !arrivalTime || !price || !totalSeats) {
            this.errorMsg = 'Please fill in all required fields.';
            return;
        }

        this.submitting = true;
        const result = await this.auth.registerBus({
            busName,
            vehicleType,
            busType: busType || 'AC Sleeper',
            fromCity,
            toCity,
            departureTime,
            arrivalTime,
            duration: duration || 'N/A',
            stops: stops || 'Non-Stop',
            price: Number(price),
            totalSeats: Number(totalSeats),
        });
        this.submitting = false;

        if (result.success) {
            this.successMsg = 'Bus registered successfully! Redirecting to My Buses...';
            setTimeout(() => this.router.navigate(['/my-buses']), 2000);
        } else {
            this.errorMsg = result.error || 'Failed to register bus.';
        }
    }
}

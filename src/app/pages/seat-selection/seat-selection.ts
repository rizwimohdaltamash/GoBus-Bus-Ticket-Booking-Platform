import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { Bus } from '../booking/booking';
import { AuthService } from '../../services/auth';

declare var Razorpay: any;

interface Seat {
    id: string;
    row: number;
    col: number;
    status: 'available' | 'selected' | 'booked';
    deck: 'lower' | 'upper';
    label: string;
}

@Component({
    selector: 'app-seat-selection',
    imports: [MatIcon],
    templateUrl: './seat-selection.html',
    styleUrl: './seat-selection.css',
})
export class SeatSelection implements OnInit {
    bus: Bus | null = null;
    lowerDeckSeats: Seat[][] = [];
    upperDeckSeats: Seat[][] = [];
    selectedSeats: Seat[] = [];
    totalPrice = 0;
    loadingSeats = true;
    paymentProcessing = false;
    paymentError = '';

    constructor(private router: Router, private auth: AuthService, private cdr: ChangeDetectorRef) {
        const nav = this.router.getCurrentNavigation();
        if (nav?.extras.state) {
            this.bus = nav.extras.state['bus'] as Bus;
        }
    }

    async ngOnInit() {
        if (!this.bus) {
            this.router.navigate(['/booking']);
            return;
        }
        await this.initSeats();
    }

    private async initSeats() {
        this.loadingSeats = true;
        this.cdr.detectChanges();

        // Fetch actually booked seats from Firestore for this bus
        let bookedSeatIds: string[] = [];
        if (this.bus?.id) {
            bookedSeatIds = await this.auth.getBookedSeatsForBus(this.bus.id as string);
        }

        // Lower Deck: 3 rows × 6 cols
        this.lowerDeckSeats = [];
        for (let r = 0; r < 3; r++) {
            const row: Seat[] = [];
            for (let c = 1; c <= 6; c++) {
                const id = `L-${r + 1}-${c}`;
                row.push({
                    id,
                    row: r + 1,
                    col: c,
                    status: bookedSeatIds.includes(id) ? 'booked' : 'available',
                    deck: 'lower',
                    label: `L${(r * 6) + c}`,
                });
            }
            this.lowerDeckSeats.push(row);
        }

        // Upper Deck: 3 rows × 6 cols
        this.upperDeckSeats = [];
        for (let r = 0; r < 3; r++) {
            const row: Seat[] = [];
            for (let c = 1; c <= 6; c++) {
                const id = `U-${r + 1}-${c}`;
                row.push({
                    id,
                    row: r + 1,
                    col: c,
                    status: bookedSeatIds.includes(id) ? 'booked' : 'available',
                    deck: 'upper',
                    label: `U${(r * 6) + c}`,
                });
            }
            this.upperDeckSeats.push(row);
        }

        this.loadingSeats = false;
        this.cdr.detectChanges();
    }

    toggleSeat(seat: Seat) {
        if (seat.status === 'booked') return;

        if (seat.status === 'selected') {
            seat.status = 'available';
            this.selectedSeats = this.selectedSeats.filter(s => s.id !== seat.id);
        } else {
            seat.status = 'selected';
            this.selectedSeats.push(seat);
        }
        this.totalPrice = this.selectedSeats.length * (this.bus?.price || 0);
    }

    confirmBooking() {
        if (this.selectedSeats.length === 0) return;
        this.paymentError = '';
        this.paymentProcessing = true;
        this.cdr.detectChanges();

        const options = {
            key: 'rzp_test_oy0ogDNk4xSPEB',
            amount: this.totalPrice * 100, // Amount in paise
            currency: 'INR',
            name: 'GoBus',
            description: `${this.bus?.departureCity} → ${this.bus?.arrivalCity} | ${this.selectedSeats.length} seat(s)`,
            handler: (response: any) => {
                // Payment successful — navigate to confirmation
                this.router.navigate(['/booking-confirmation'], {
                    state: {
                        bus: this.bus,
                        busId: this.bus?.id,
                        seats: this.selectedSeats.map(s => s.label),
                        seatIds: this.selectedSeats.map(s => s.id),
                        totalPrice: this.totalPrice,
                        passengerCount: this.selectedSeats.length,
                        paymentId: response.razorpay_payment_id,
                    },
                });
            },
            modal: {
                ondismiss: () => {
                    this.paymentProcessing = false;
                    this.paymentError = 'Payment was cancelled. Please try again.';
                    this.cdr.detectChanges();
                },
            },
            prefill: {
                name: this.auth.getUser()?.name || '',
                email: this.auth.getUser()?.email || '',
            },
            theme: {
                color: '#16a34a', // green-600
            },
        };

        const razorpay = new Razorpay(options);
        razorpay.on('payment.failed', (response: any) => {
            this.paymentProcessing = false;
            this.paymentError = 'Payment failed. Please try again.';
            this.cdr.detectChanges();
        });
        razorpay.open();
    }

    goBack() {
        this.router.navigate(['/booking']);
    }
}

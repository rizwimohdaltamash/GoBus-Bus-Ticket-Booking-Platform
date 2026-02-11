import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import jsPDF from 'jspdf';

@Component({
    selector: 'app-my-bookings',
    imports: [MatIcon, RouterLink],
    templateUrl: './my-bookings.html',
    styleUrl: './my-bookings.css',
})
export class MyBookings implements OnInit {
    bookings: any[] = [];
    loading = false;
    errorMsg = '';

    // Cancel confirmation
    cancellingId: string | null = null;
    cancelError = '';

    constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

    async ngOnInit() {
        await this.auth.waitForAuth();
        if (!this.auth.isLoggedIn()) {
            this.router.navigate(['/']);
            return;
        }
        await this.loadBookings();
    }

    async loadBookings() {
        this.loading = true;
        this.cdr.detectChanges();
        try {
            this.bookings = await this.auth.getUserBookings();
        } catch (err: any) {
            this.errorMsg = err.message || 'Failed to load bookings.';
            this.bookings = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'confirmed': return 'Confirmed';
            case 'cancelled_by_admin': return 'Cancelled by Admin';
            case 'cancelled_by_user': return 'Cancelled by You';
            default: return 'Confirmed';
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'cancelled_by_admin': return 'bg-red-100 text-red-700';
            case 'cancelled_by_user': return 'bg-amber-100 text-amber-700';
            default: return 'bg-green-100 text-green-700';
        }
    }

    isCancelled(booking: any): boolean {
        return booking.status === 'cancelled_by_admin' || booking.status === 'cancelled_by_user';
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
        const result = await this.auth.cancelBookingByUser(this.cancellingId);
        if (result.success) {
            const booking = this.bookings.find((b: any) => b.id === this.cancellingId);
            if (booking) {
                booking.status = 'cancelled_by_user';
                booking.cancelledAt = new Date().toISOString();
            }
            this.cancellingId = null;
            this.cancelError = '';
        } else {
            this.cancelError = result.error || 'Failed to cancel booking';
        }
        this.cdr.detectChanges();
    }

    downloadTicket(booking: any) {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();

        // Colors
        const green = [34, 197, 94];
        const darkGreen = [5, 150, 105];
        const gray = [107, 114, 128];
        const darkText = [17, 24, 39];

        // Header bar
        pdf.setFillColor(green[0], green[1], green[2]);
        pdf.rect(0, 0, pageWidth, 35, 'F');
        pdf.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2]);
        pdf.rect(0, 0, pageWidth, 35, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.setFont('helvetica', 'bold');
        pdf.text('GoBus', 15, 18);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('E-Ticket / Boarding Pass', 15, 27);

        const busName = booking.bus?.name || booking.bus?.busName || 'Bus';
        const busType = booking.bus?.typeLabel || booking.bus?.busType || '';
        pdf.setFontSize(11);
        pdf.text(`${busName}  |  ${busType}`, pageWidth - 15, 22, { align: 'right' });

        let y = 50;

        // Booking ID & PNR
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(15, y - 5, pageWidth - 30, 22, 3, 3, 'F');
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.setFontSize(8);
        pdf.text('BOOKING ID', 22, y + 2);
        pdf.text('PNR NUMBER', pageWidth - 22, y + 2, { align: 'right' });
        pdf.setTextColor(green[0], green[1], green[2]);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text(booking.bookingId || 'N/A', 22, y + 12);
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.text(booking.pnr || 'N/A', pageWidth - 22, y + 12, { align: 'right' });

        y += 32;

        // Passenger Details section
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text('PASSENGER DETAILS', 15, y);
        y += 8;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.text(`Name: ${booking.userName || 'Guest'}`, 15, y);
        pdf.text(`Email: ${booking.userEmail || '—'}`, pageWidth / 2, y);
        y += 12;

        // Dashed line separator
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(15, y, pageWidth - 15, y);
        pdf.setLineDashPattern([], 0);
        y += 10;

        // Journey Details
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text('JOURNEY DETAILS', 15, y);
        y += 12;

        const depCity = booking.bus?.departureCity || booking.bus?.fromCity || 'N/A';
        const arrCity = booking.bus?.arrivalCity || booking.bus?.toCity || 'N/A';
        const depTime = booking.bus?.departure || booking.bus?.departureTime || 'N/A';
        const arrTime = booking.bus?.arrival || booking.bus?.arrivalTime || 'N/A';
        const duration = booking.bus?.duration || 'N/A';

        // From
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(depTime, 25, y);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text(depCity, 25, y + 7);

        // Arrow
        pdf.setTextColor(green[0], green[1], green[2]);
        pdf.setFontSize(10);
        const midX = pageWidth / 2;
        pdf.text(duration, midX, y - 2, { align: 'center' });
        pdf.setDrawColor(green[0], green[1], green[2]);
        pdf.setLineWidth(0.5);
        pdf.line(midX - 20, y + 2, midX + 20, y + 2);
        pdf.text('→', midX + 18, y + 3);

        // To
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(arrTime, pageWidth - 25, y, { align: 'right' });
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text(arrCity, pageWidth - 25, y + 7, { align: 'right' });

        y += 22;

        // Dashed line
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(15, y, pageWidth - 15, y);
        pdf.setLineDashPattern([], 0);
        y += 10;

        // Booking Info grid
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text('BOOKING INFORMATION', 15, y);
        y += 10;

        const col1 = 15;
        const col2 = pageWidth / 3;
        const col3 = (pageWidth / 3) * 2;

        // Row 1
        pdf.setFontSize(8);
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text('Booking Date', col1, y);
        pdf.text('Seats', col2, y);
        pdf.text('Passengers', col3, y);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.text(booking.bookingDate || 'N/A', col1, y + 6);
        const seats = Array.isArray(booking.seats) ? booking.seats.join(', ') : 'N/A';
        pdf.setTextColor(green[0], green[1], green[2]);
        pdf.text(seats, col2, y + 6);
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.text(`${booking.passengerCount || 0}`, col3, y + 6);

        y += 20;

        // Total Amount
        pdf.setFillColor(240, 253, 244);
        pdf.roundedRect(15, y - 4, pageWidth - 30, 18, 3, 3, 'F');
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.text('Total Amount Paid', 22, y + 6);
        pdf.setTextColor(green[0], green[1], green[2]);
        pdf.setFontSize(16);
        pdf.text(`₹${booking.totalPrice || 0}`, pageWidth - 22, y + 7, { align: 'right' });

        y += 30;

        // Footer
        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.3);
        pdf.line(15, y, pageWidth - 15, y);
        y += 8;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text('This is a computer-generated ticket. No signature required.', pageWidth / 2, y, { align: 'center' });
        pdf.text('Thank you for choosing GoBus!', pageWidth / 2, y + 5, { align: 'center' });

        pdf.save(`GoBus-Ticket-${booking.bookingId || 'ticket'}.pdf`);
    }
}

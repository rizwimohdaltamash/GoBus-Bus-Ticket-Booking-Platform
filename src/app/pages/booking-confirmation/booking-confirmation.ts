import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../services/auth';
import jsPDF from 'jspdf';

@Component({
    selector: 'app-booking-confirmation',
    imports: [RouterLink, MatIcon],
    templateUrl: './booking-confirmation.html',
    styleUrl: './booking-confirmation.css',
})
export class BookingConfirmation implements OnInit {
    bus: any = null;
    busId: string = '';
    seats: string[] = [];
    seatIds: string[] = [];
    totalPrice = 0;
    passengerCount = 0;
    user: any = null;
    bookingId = '';
    pnr = '';
    bookingDate = '';
    showSuccessPopup = false;

    constructor(private router: Router, private auth: AuthService) {
        const nav = this.router.getCurrentNavigation();
        if (nav?.extras.state) {
            this.bus = this.normalizeBus(nav.extras.state['bus']);
            this.busId = nav.extras.state['busId'] || '';
            this.seats = nav.extras.state['seats'];
            this.seatIds = nav.extras.state['seatIds'] || [];
            this.totalPrice = nav.extras.state['totalPrice'];
            this.passengerCount = nav.extras.state['passengerCount'];
        }
    }

    private normalizeBus(bus: any) {
        if (!bus) return null;
        // Standardize properties between search results (raw) and booking list (formatted)
        if (bus.fromCity && !bus.departureCity) {
            return {
                ...bus,
                name: bus.busName || bus.name || 'Unknown Bus',
                departure: bus.departureTime || 'N/A',
                departureCity: bus.fromCity || 'N/A',
                arrival: bus.arrivalTime || 'N/A',
                arrivalCity: bus.toCity || 'N/A',
                typeLabel: bus.busType || 'Bus',
                vehicle: bus.vehicleType || 'Standard',
                stops: bus.stops || 'Non-Stop',
                duration: bus.duration || 'N/A'
            };
        }
        return bus;
    }

    async ngOnInit() {
        // If no navigation state, try loading from localStorage
        if (!this.bus) {
            const saved = this.auth.getBookingConfirmation();
            if (saved) {
                this.bus = this.normalizeBus(saved.bus);
                this.seats = saved.seats;
                this.totalPrice = saved.totalPrice;
                this.passengerCount = saved.passengerCount;
                this.bookingId = saved.bookingId;
                this.pnr = saved.pnr;
                this.bookingDate = saved.bookingDate;
                this.user = this.auth.getUser();
                return;
            }
            this.router.navigate(['/booking']);
            return;
        }

        this.user = this.auth.getUser();
        this.bookingId = 'GB' + Math.random().toString(36).substring(2, 10).toUpperCase();
        this.pnr = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.bookingDate = new Date().toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const bookingData = {
            bus: this.bus,
            busId: this.busId,
            seats: this.seats,
            seatIds: this.seatIds,
            totalPrice: this.totalPrice,
            passengerCount: this.passengerCount,
            bookingId: this.bookingId,
            pnr: this.pnr,
            bookingDate: this.bookingDate
        };

        // Save to localStorage so it can be accessed from navbar
        this.auth.saveBookingConfirmation(bookingData);

        // Save to Firestore
        await this.auth.saveBooking(bookingData);

        // Show success popup
        this.showSuccessPopup = true;
        setTimeout(() => this.showSuccessPopup = false, 4000);
    }

    closePopup() {
        this.showSuccessPopup = false;
    }

    downloadTicket() {
        const booking = {
            bus: this.bus,
            bookingId: this.bookingId,
            pnr: this.pnr,
            bookingDate: this.bookingDate,
            userName: this.user?.name || 'Guest',
            userEmail: this.user?.email || '',
            seats: this.seats,
            passengerCount: this.passengerCount,
            totalPrice: this.totalPrice,
        };

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();

        const green = [34, 197, 94];
        const darkGreen = [5, 150, 105];
        const gray = [107, 114, 128];
        const darkText = [17, 24, 39];

        // Header
        pdf.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2]);
        pdf.rect(0, 0, pageWidth, 35, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.setFont('helvetica', 'bold');
        pdf.text('GoBus', 15, 18);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('E-Ticket / Boarding Pass', 15, 27);
        pdf.setFontSize(11);
        pdf.text(`${booking.bus?.name || ''}  |  ${booking.bus?.typeLabel || ''}`, pageWidth - 15, 22, { align: 'right' });

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
        pdf.text(booking.bookingId, 22, y + 12);
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.text(booking.pnr, pageWidth - 22, y + 12, { align: 'right' });

        y += 32;

        // Passenger
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text('PASSENGER DETAILS', 15, y);
        y += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.text(`Name: ${booking.userName}`, 15, y);
        pdf.text(`Email: ${booking.userEmail}`, pageWidth / 2, y);
        y += 12;

        // Dashed line
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(15, y, pageWidth - 15, y);
        pdf.setLineDashPattern([], 0);
        y += 10;

        // Journey
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text('JOURNEY DETAILS', 15, y);
        y += 12;

        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(booking.bus?.departure || 'N/A', 25, y);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text(booking.bus?.departureCity || 'N/A', 25, y + 7);

        const midX = pageWidth / 2;
        pdf.setTextColor(green[0], green[1], green[2]);
        pdf.setFontSize(10);
        pdf.text(booking.bus?.duration || '', midX, y - 2, { align: 'center' });
        pdf.setDrawColor(green[0], green[1], green[2]);
        pdf.setLineWidth(0.5);
        pdf.line(midX - 20, y + 2, midX + 20, y + 2);

        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(booking.bus?.arrival || 'N/A', pageWidth - 25, y, { align: 'right' });
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text(booking.bus?.arrivalCity || 'N/A', pageWidth - 25, y + 7, { align: 'right' });

        y += 22;

        // Dashed line
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(15, y, pageWidth - 15, y);
        pdf.setLineDashPattern([], 0);
        y += 10;

        // Booking info
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text('BOOKING INFORMATION', 15, y);
        y += 10;

        pdf.setFontSize(8);
        pdf.text('Booking Date', 15, y);
        pdf.text('Seats', pageWidth / 3, y);
        pdf.text('Passengers', (pageWidth / 3) * 2, y);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.text(booking.bookingDate, 15, y + 6);
        pdf.setTextColor(green[0], green[1], green[2]);
        pdf.text(booking.seats.join(', '), pageWidth / 3, y + 6);
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.text(`${booking.passengerCount}`, (pageWidth / 3) * 2, y + 6);

        y += 20;

        // Total
        pdf.setFillColor(240, 253, 244);
        pdf.roundedRect(15, y - 4, pageWidth - 30, 18, 3, 3, 'F');
        pdf.setFontSize(11);
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.text('Total Amount Paid', 22, y + 6);
        pdf.setTextColor(green[0], green[1], green[2]);
        pdf.setFontSize(16);
        pdf.text(`₹${booking.totalPrice}`, pageWidth - 22, y + 7, { align: 'right' });

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

        pdf.save(`GoBus-Ticket-${booking.bookingId}.pdf`);
    }
}

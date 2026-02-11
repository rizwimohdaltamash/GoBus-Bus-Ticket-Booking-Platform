import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../services/auth';

export interface Bus {
  id: number | string;
  name: string;
  type: string;
  typeLabel: string;
  typeColor: string;
  typeBg: string;
  typeIcon: string;
  vehicle: string;
  rating: number;
  departure: string;
  departureCity: string;
  arrival: string;
  arrivalCity: string;
  duration: string;
  stops: string;
  price: number;
}

@Component({
  selector: 'app-booking',
  imports: [MatIcon],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
})
export class Booking implements OnInit {
  buses: Bus[] = [];
  loading = true;

  constructor(private router: Router, private auth: AuthService, private cdr: ChangeDetectorRef) { }

  async ngOnInit() {
    await this.auth.waitForAuth();
    await this.loadBuses();
  }

  private getBusTypeStyle(busType: string): { typeLabel: string; typeColor: string; typeBg: string; typeIcon: string; type: string } {
    switch (busType) {
      case 'AC Sleeper':
        return { type: 'sleeper', typeLabel: 'AC Sleeper', typeColor: 'text-green-700', typeBg: 'bg-green-50', typeIcon: 'ac_unit' };
      case 'AC Seater':
        return { type: 'seater', typeLabel: 'AC Seater', typeColor: 'text-blue-700', typeBg: 'bg-blue-50', typeIcon: 'airline_seat_recline_normal' };
      case 'Non-AC Sleeper':
        return { type: 'semi-sleeper', typeLabel: 'Non-AC Sleeper', typeColor: 'text-amber-700', typeBg: 'bg-amber-50', typeIcon: 'air' };
      case 'Non-AC Seater':
        return { type: 'non-ac', typeLabel: 'Non-AC Seater', typeColor: 'text-orange-700', typeBg: 'bg-orange-50', typeIcon: 'air' };
      default:
        return { type: 'sleeper', typeLabel: busType, typeColor: 'text-green-700', typeBg: 'bg-green-50', typeIcon: 'ac_unit' };
    }
  }

  async loadBuses() {
    this.loading = true;
    try {
      const firestoreBuses = await this.auth.getAllBuses();
      const mapped: Bus[] = firestoreBuses.map((fb: any) => {
        const style = this.getBusTypeStyle(fb.busType || 'AC Sleeper');
        return {
          id: fb.id,
          name: fb.busName || fb.name || 'Unknown Bus',
          ...style,
          vehicle: fb.vehicleType || 'Standard',
          rating: fb.rating || 4.0,
          departure: fb.departureTime || 'N/A',
          departureCity: fb.fromCity || 'N/A',
          arrival: fb.arrivalTime || 'N/A',
          arrivalCity: fb.toCity || 'N/A',
          duration: fb.duration || 'N/A',
          stops: fb.stops || 'Non-Stop',
          price: fb.price || 0,
        };
      });

      this.buses = mapped;
    } catch {
      this.buses = [];
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  selectBus(bus: Bus) {
    this.router.navigate(['/seat-selection'], {
      queryParams: { busId: bus.id },
      state: { bus },
    });
  }
}

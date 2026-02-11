import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-search-bus',
  imports: [MatIcon, FormsModule],
  templateUrl: './search-bus.html',
  styleUrl: './search-bus.css',
})
export class SearchBus implements OnInit {
  allBuses: any[] = [];
  fromCity = '';
  toCity = '';
  fromSuggestions: string[] = [];
  toSuggestions: string[] = [];
  showFromDropdown = false;
  showToDropdown = false;
  searchResults: any[] = [];
  searched = false;
  loading = true;

  // All unique cities for suggestions
  private allFromCities: string[] = [];
  private allToCities: string[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      this.allBuses = await this.auth.getAllBuses();
      this.allFromCities = [...new Set(this.allBuses.map((b: any) => b.fromCity).filter(Boolean))];
      this.allToCities = [...new Set(this.allBuses.map((b: any) => b.toCity).filter(Boolean))];
    } catch {
      this.allBuses = [];
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  onFromInput() {
    const q = this.fromCity.trim().toLowerCase();
    if (q.length === 0) {
      this.fromSuggestions = this.allFromCities.slice(0, 6);
    } else {
      this.fromSuggestions = this.allFromCities.filter(c => c.toLowerCase().includes(q)).slice(0, 6);
    }
    this.showFromDropdown = true;
    this.searched = false;
  }

  onToInput() {
    const q = this.toCity.trim().toLowerCase();
    if (q.length === 0) {
      this.toSuggestions = this.allToCities.slice(0, 6);
    } else {
      this.toSuggestions = this.allToCities.filter(c => c.toLowerCase().includes(q)).slice(0, 6);
    }
    this.showToDropdown = true;
    this.searched = false;
  }

  selectFrom(city: string) {
    this.fromCity = city;
    this.showFromDropdown = false;
    this.autoSearch();
  }

  selectTo(city: string) {
    this.toCity = city;
    this.showToDropdown = false;
    this.autoSearch();
  }

  onFromFocus() {
    this.onFromInput();
  }

  onToFocus() {
    this.onToInput();
  }

  hideFromDropdown() {
    setTimeout(() => { this.showFromDropdown = false; this.cdr.detectChanges(); }, 200);
  }

  hideToDropdown() {
    setTimeout(() => { this.showToDropdown = false; this.cdr.detectChanges(); }, 200);
  }

  autoSearch() {
    if (this.fromCity.trim() || this.toCity.trim()) {
      this.searchBuses();
    }
  }

  searchBuses() {
    const from = this.fromCity.trim().toLowerCase();
    const to = this.toCity.trim().toLowerCase();

    this.searchResults = this.allBuses.filter((b: any) => {
      const matchFrom = !from || (b.fromCity || '').toLowerCase().includes(from);
      const matchTo = !to || (b.toCity || '').toLowerCase().includes(to);
      return matchFrom && matchTo;
    });
    this.searched = true;
    this.cdr.detectChanges();
  }

  selectBus(bus: any) {
    this.router.navigate(['/seat-selection'], { state: { bus } });
  }

  clearSearch() {
    this.fromCity = '';
    this.toCity = '';
    this.searchResults = [];
    this.searched = false;
    this.cdr.detectChanges();
  }
}

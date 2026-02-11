import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, MatIcon],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: any;
  statCount = 0;
  memberSince = '';
  loading = true;

  constructor(private auth: AuthService, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    this.user = this.auth.getUser();

    // Fetch member since date
    const createdAt = await this.auth.getUserCreatedAt();
    if (createdAt) {
      const date = new Date(createdAt);
      this.memberSince = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      this.memberSince = 'N/A';
    }

    // Fetch role-based stat
    if (this.user?.role === 'busAdmin') {
      this.statCount = await this.auth.getAdminBusCount();
    } else {
      this.statCount = await this.auth.getUserBookingCount();
    }

    this.loading = false;
    this.cdr.detectChanges();
  }

  get isAdmin(): boolean {
    return this.user?.role === 'busAdmin';
  }

  logout() {
    this.auth.logout();
  }
}

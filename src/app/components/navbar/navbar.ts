import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, MatIcon],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  user: any;
  mobileMenuOpen = false;
  hasBooking = false;
  isBusAdmin = false;
  private routerSub!: Subscription;

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.user = this.auth.getUser();
    this.hasBooking = this.auth.hasBookingConfirmation();
    this.isBusAdmin = this.auth.isBusAdmin();

    // Listen for route changes to detect when a booking is completed
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.user = this.auth.getUser();
        this.hasBooking = this.auth.hasBookingConfirmation();
        this.isBusAdmin = this.auth.isBusAdmin();
        this.closeMobileMenu();
      });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  logout() {
    this.closeMobileMenu();
    this.auth.logout();
  }
}

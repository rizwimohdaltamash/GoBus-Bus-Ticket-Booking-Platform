import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Home } from './pages/home/home';
import { SearchBus } from './pages/search-bus/search-bus';
import { Booking } from './pages/booking/booking';
import { Profile } from './pages/profile/profile';
import { SeatSelection } from './pages/seat-selection/seat-selection';
import { BookingConfirmation } from './pages/booking-confirmation/booking-confirmation';
import { BusAdmin } from './pages/bus-admin/bus-admin';
import { MyBuses } from './pages/my-buses/my-buses';
import { MyBookings } from './pages/my-bookings/my-bookings';
import { AdminBookings } from './pages/admin-bookings/admin-bookings';
import { busAdminGuard } from './guards/bus-admin.guard';

export const routes: Routes = [
    { path: '', component: Login },
    { path: 'signup', component: Signup },
    { path: 'home', component: Home },
    { path: 'search', component: SearchBus },
    { path: 'booking', component: Booking },
    { path: 'seat-selection', component: SeatSelection },
    { path: 'booking-confirmation', component: BookingConfirmation },
    { path: 'my-bookings', component: MyBookings },
    { path: 'profile', component: Profile },
    { path: 'bus-admin', component: BusAdmin, canActivate: [busAdminGuard] },
    { path: 'my-buses', component: MyBuses, canActivate: [busAdminGuard] },
    { path: 'admin-bookings', component: AdminBookings, canActivate: [busAdminGuard] }
];

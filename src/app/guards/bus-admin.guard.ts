import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const busAdminGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // If user is already known (e.g. just signed up), skip waiting
    if (!auth.isLoggedIn()) {
        await auth.waitForAuth();
    }

    if (auth.isBusAdmin()) {
        return true;
    }

    router.navigate(['/home']);
    return false;
};

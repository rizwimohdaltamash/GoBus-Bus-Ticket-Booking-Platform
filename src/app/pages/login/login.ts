import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [RouterLink, MatIcon],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  errorMsg = '';
  loading = false;

  constructor(private auth: AuthService) { }

  async login(email: string, password: string) {
    this.errorMsg = '';
    if (!email || !password) {
      this.errorMsg = 'Please enter email and password.';
      return;
    }
    this.loading = true;
    const result = await this.auth.login(email, password);
    this.loading = false;
    if (!result.success) {
      this.errorMsg = result.error || 'Login failed.';
    }
  }
}

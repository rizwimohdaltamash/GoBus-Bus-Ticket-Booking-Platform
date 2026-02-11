import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-signup',
  imports: [RouterLink, MatIcon],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  selectedRole: 'user' | 'busAdmin' = 'user';
  errorMsg = '';
  loading = false;

  constructor(private auth: AuthService) { }

  selectRole(role: 'user' | 'busAdmin') {
    this.selectedRole = role;
  }

  async signup(name: string, email: string, password: string) {
    this.errorMsg = '';
    if (!name || !email || !password) {
      this.errorMsg = 'Please fill in all fields.';
      return;
    }
    this.loading = true;
    const result = await this.auth.signup(name, email, password, this.selectedRole);
    this.loading = false;
    if (!result.success) {
      this.errorMsg = result.error || 'Signup failed.';
    }
  }
}

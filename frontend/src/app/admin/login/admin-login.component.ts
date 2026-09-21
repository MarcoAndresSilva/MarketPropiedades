import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal(false);

  submit(): void {
    this.loading.set(true);
    this.error.set(false);

    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigateByUrl('/admin/propiedades'),
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}

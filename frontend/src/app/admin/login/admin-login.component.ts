import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, inicioSegunRol } from '../../core/auth.service';
import { LogoComponent } from '../../layout/logo/logo.component';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, LogoComponent],
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
      // Un anunciante que entra por acá termina en su panel, no en uno que le responde 403.
      next: (user) => this.router.navigateByUrl(inicioSegunRol(user)),
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}

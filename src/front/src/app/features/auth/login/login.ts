import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, mensajeDeError } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl(this.auth.rutaInicio()),
        error: (e) => this.error.set(mensajeDeError(e)),
      });
  }
}

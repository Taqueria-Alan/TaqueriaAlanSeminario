import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, mensajeDeError } from '../../../core/auth/auth.service';

function passwordsIguales(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const confirmar = grupo.get('confirmar')?.value;
  return password === confirmar ? null : { passwordsDistintas: true };
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class RegistroComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly beneficios = [
    ['Pide en línea', 'y recoge sin hacer fila.'],
    ['Repite tus favoritos', 'desde tu historial de pedidos.'],
    ['Sigue tu pedido', 'en tiempo real, de la plancha a tu mano.'],
    ['Pregunta por el Club Alan', 'y acumula puntos en tus pedidos.'],
  ];

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9 +()-]{8,16}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmar: ['', Validators.required],
      terminos: [false, Validators.requiredTrue],
    },
    { validators: passwordsIguales },
  );

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { confirmar: _confirmar, terminos: _terminos, ...datos } = this.form.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.auth
      .registrar(datos)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl(this.auth.rutaInicio()),
        error: (e) => this.error.set(mensajeDeError(e)),
      });
  }
}

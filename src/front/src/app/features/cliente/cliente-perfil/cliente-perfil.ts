import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService, mensajeDeError } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

/** El cliente edita su propia ficha: nombre, correo y telefono. El rol y la contraseña no se tocan aqui. */
@Component({
  selector: 'app-cliente-perfil',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './cliente-perfil.html',
  styleUrl: './cliente-perfil.scss',
})
export class ClientePerfilComponent {
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificationService);

  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: [this.auth.usuario()?.nombre ?? '', Validators.required],
    telefono: [this.auth.usuario()?.telefono ?? '', [Validators.required, Validators.pattern(/^[0-9 +()-]{8,16}$/)]],
    email: [this.auth.usuario()?.email ?? '', [Validators.required, Validators.email]],
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    this.auth
      .actualizarPerfil(this.form.getRawValue())
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.notificaciones.success('Tus datos se guardaron correctamente');
        },
        error: (e) => this.error.set(mensajeDeError(e)),
      });
  }
}

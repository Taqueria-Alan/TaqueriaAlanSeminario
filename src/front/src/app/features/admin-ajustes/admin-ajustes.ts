import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfiguracionService } from '../../core/config/configuracion.service';
import { PedidoService } from '../../core/pedidos/pedido.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-admin-ajustes',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-ajustes.html',
  styleUrl: './admin-ajustes.scss',
})
export class AdminAjustesComponent {
  private readonly configuracion = inject(ConfiguracionService);
  private readonly pedidoService = inject(PedidoService);
  private readonly notificaciones = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', Validators.required],
    telefono: ['', Validators.required],
    whatsapp: ['', Validators.required],
    direccion: ['', Validators.required],
    horario: ['', Validators.required],
    pedidosActivos: [true],
    domicilioActivo: [true],
  });

  constructor() {
    this.form.setValue(this.configuracion.config());
  }

  alternar(campo: 'pedidosActivos' | 'domicilioActivo'): void {
    const control = this.form.controls[campo];
    control.setValue(!control.value);
    control.markAsDirty();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.configuracion.guardar(this.form.getRawValue());
    this.form.markAsPristine();
    this.notificaciones.success('Ajustes guardados');
  }

  restablecerNegocio(): void {
    this.confirmar(
      {
        title: 'Restablecer datos del negocio',
        message: 'Se restaurarán el nombre, teléfono, dirección, horario y los interruptores de pedidos a sus valores iniciales.',
        confirmText: 'Restablecer',
      },
      () => {
        this.configuracion.restablecer();
        this.form.setValue(this.configuracion.config());
        this.form.markAsPristine();
        this.notificaciones.success('Ajustes restablecidos');
      },
    );
  }

  restablecerPedidos(): void {
    this.confirmar(
      {
        title: 'Recargar pedidos',
        message: 'Se consultarán nuevamente los pedidos registrados por pedidos-service. No se modificará ningún dato.',
        confirmText: 'Recargar',
      },
      () => {
        this.pedidoService.recargar().subscribe({
          next: () => this.notificaciones.success('Pedidos actualizados desde el servidor'),
        });
      },
    );
  }

  private confirmar(data: ConfirmDialogData, accion: () => void): void {
    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmado) => confirmado && accion());
  }
}

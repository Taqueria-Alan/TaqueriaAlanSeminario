import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PagoService } from '../../../core/pagos/pago.service';
import { Pedido, resumenLineas } from '../../../core/pedidos/pedido.model';
import { PedidoService } from '../../../core/pedidos/pedido.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-cliente-pago',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './cliente-pago.html',
  styleUrl: './cliente-pago.scss',
})
export class ClientePagoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pedidos = inject(PedidoService);
  private readonly pagos = inject(PagoService);
  private readonly notificaciones = inject(NotificationService);

  readonly pedido = signal<Pedido | null>(null);
  readonly cargando = signal(true);
  readonly pagando = signal(false);
  readonly cancelando = signal(false);
  readonly numeroTarjeta = signal('');
  readonly titular = signal('');
  readonly errorPago = signal('');
  /** Se conserva en reintentos de red; se renueva después de un rechazo real para permitir corregir la tarjeta. */
  private claveIdempotencia = crearClaveIdempotencia();

  readonly resumen = resumenLineas;
  readonly puedeEditar = computed(() => {
    const pedido = this.pedido();
    return !!pedido && pedido.estado === 'RECIBIDO' && pedido.pagoEstado !== 'APROBADO';
  });
  readonly puedePagar = computed(
    () =>
      this.puedeEditar() &&
      this.numeroTarjeta().replace(/\s/g, '').length > 0 &&
      this.titular().trim().length > 1 &&
      !this.pagando(),
  );

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.router.navigateByUrl('/cliente');
      return;
    }
    this.pedidos.obtener(id).subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        this.cargando.set(false);
        if (pedido.pagoEstado === 'APROBADO') {
          this.router.navigate(['/cliente/confirmacion', pedido.id]);
        }
      },
      error: () => this.cargando.set(false),
    });
  }

  pagar(): void {
    const pedido = this.pedido();
    if (!pedido || !this.puedePagar()) {
      return;
    }
    this.pagando.set(true);
    this.errorPago.set('');
    this.pagos
      .pagar({
        idPedido: pedido.id,
        metodoPago: 'TARJETA',
        numeroTarjetaPrueba: this.numeroTarjeta().replace(/\s/g, ''),
        titular: this.titular().trim(),
        idempotencyKey: this.claveIdempotencia,
      })
      .subscribe({
        next: () => {
          this.notificaciones.success('Pago aprobado. Tu pedido ya fue confirmado.');
          this.router.navigate(['/cliente/confirmacion', pedido.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.pagando.set(false);
          this.errorPago.set(mensajePago(error));
          this.claveIdempotencia = crearClaveIdempotencia();
        },
      });
  }

  editar(): void {
    const pedido = this.pedido();
    if (pedido && this.puedeEditar()) {
      this.router.navigate(['/cliente/pedir'], { queryParams: { editar: pedido.id } });
    }
  }

  cancelar(): void {
    const pedido = this.pedido();
    if (!pedido || !this.puedeEditar() || this.cancelando()) {
      return;
    }
    if (!window.confirm(`¿Cancelar el pedido #${pedido.id}? Esta acción no cobra la tarjeta.`)) {
      return;
    }
    this.cancelando.set(true);
    this.pedidos.cancelar(pedido.id).subscribe({
      next: () => {
        this.notificaciones.success(`Pedido #${pedido.id} cancelado. No se realizó ningún cobro.`);
        this.router.navigateByUrl('/cliente');
      },
      error: () => this.cancelando.set(false),
    });
  }
}

function mensajePago(error: HttpErrorResponse): string {
  const cuerpo = error.error as { code?: string; message?: string } | null;
  if (cuerpo?.code === 'TARJETA_INVALIDA') {
    return 'La tarjeta de prueba no es válida. Corrige los datos o usa otra tarjeta de simulación.';
  }
  if (cuerpo?.code === 'FONDOS_INSUFICIENTES') {
    return 'La tarjeta fue rechazada por fondos insuficientes. El pedido continúa sin cobro.';
  }
  return cuerpo?.message ?? 'No pudimos procesar el pago. Tu pedido sigue disponible para intentarlo de nuevo.';
}

function crearClaveIdempotencia(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `pago-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

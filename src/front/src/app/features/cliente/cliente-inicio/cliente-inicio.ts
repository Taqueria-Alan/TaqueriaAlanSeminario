import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { MenuItem } from '../../../core/data/menu.data';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ETIQUETA_ESTADO,
  Pedido,
  esSuscripcion,
  etiquetaTipoPedido,
  flujoDe,
  resumenLineas,
} from '../../../core/pedidos/pedido.model';
import { PedidoService } from '../../../core/pedidos/pedido.service';
import { MenuService } from '../services/menu.service';
import { ClubAlanService } from '../../club-alan/services/club-alan.service';

@Component({
  selector: 'app-cliente-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cliente-inicio.html',
  styleUrl: './cliente-inicio.scss',
})
export class ClienteInicioComponent {
  private readonly router = inject(Router);
  private readonly pedidoService = inject(PedidoService);
  private readonly menuService = inject(MenuService);
  private readonly clubAlanService = inject(ClubAlanService);
  private readonly notificaciones = inject(NotificationService);

  readonly usuario = inject(AuthService).usuario;
  readonly resumen = resumenLineas;
  readonly tipoDe = etiquetaTipoPedido;
  readonly etiquetaEstado = ETIQUETA_ESTADO;
  readonly esSuscripcion = esSuscripcion;

  /** Producto de servicio con el que se vende la suscripcion al Club Alan (del catalogo). */
  readonly productoClub = signal<MenuItem | null>(null);
  readonly suscribiendo = signal(false);

  private readonly misPedidos = computed(() => {
    const id = this.pedidoService.clienteActualId();
    return this.pedidoService
      .pedidos()
      .filter((p) => p.idCliente === id)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  });

  readonly activo = computed(
    () => this.misPedidos().find((p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO') ?? null,
  );
  readonly historial = computed(() => this.misPedidos().filter((p) => p.estado === 'ENTREGADO'));

  /** El estado visible se consulta al servicio real de Club Alan, no al mock de sesión. */
  readonly esMiembro = signal(false);
  /** Se ofrece la suscripcion si no es miembro, no tiene una en curso y el catalogo tiene el producto. */
  readonly ofrecerClub = computed(
    () =>
      !this.esMiembro() &&
      this.productoClub() !== null &&
      !this.misPedidos().some(
        (p) => esSuscripcion(p) && p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO',
      ),
  );

  /** Etapas del pedido activo: hechas, en curso o pendientes. */
  readonly etapas = computed(() => {
    const pedido = this.activo();
    if (!pedido) {
      return [];
    }
    const flujo = flujoDe(pedido);
    const actual = flujo.indexOf(pedido.estado);
    return flujo.map((estado, i) => ({
      etiqueta: ETIQUETA_ESTADO[estado],
      situacion: i < actual ? 'done' : i === actual ? 'active' : 'pending',
    }));
  });

  constructor() {
    this.menuService.cargar().subscribe(({ suscripcion }) => this.productoClub.set(suscripcion));
    const idCliente = this.pedidoService.clienteActualId();
    if (idCliente !== null) {
      this.clubAlanService.obtenerPuntos(idCliente, true).pipe(
        catchError(() => of(null)),
      ).subscribe({
        next: (puntos) => this.esMiembro.set(puntos?.miembroClub ?? false),
      });
    }
  }

  fecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  repetir(pedido: Pedido): void {
    this.router.navigate(['/cliente/pedir'], { state: { repetir: pedido.lineas } });
  }

  irAPago(pedido: Pedido): void {
    this.router.navigate(['/cliente/pago', pedido.id]);
  }

  /** Crea un pedido de clase SUSCRIPCION cuyo producto es el servicio "Club Alan". */
  suscribirse(): void {
    const producto = this.productoClub();
    const idCliente = this.pedidoService.clienteActualId();
    if (!producto || idCliente === null) {
      return;
    }
    this.suscribiendo.set(true);
    this.pedidoService
      .crear({
        idCliente,
        cliente: 'Cliente Club Alan',
        tipo: 'LLEVAR',
        clase: 'SUSCRIPCION',
        direccion: null,
        lineas: [
          {
            idProducto: producto.id,
            nombre: producto.nombre,
            detalle: producto.detalle,
            precio: producto.precio,
            cantidad: 1,
          },
        ],
      })
      .pipe(finalize(() => this.suscribiendo.set(false)))
      .subscribe((pedido) => {
        this.notificaciones.success(`Solicitud #${pedido.id} creada. Completa el pago para activar tu membresía.`);
        this.router.navigate(['/cliente/pago', pedido.id]);
      });
  }
}

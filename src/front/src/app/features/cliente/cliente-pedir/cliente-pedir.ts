import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfiguracionService } from '../../../core/config/configuracion.service';
import { MenuCategoria } from '../../../core/data/menu.data';
import { LineaPedido, NuevoPedido, Pedido, TipoPedido } from '../../../core/pedidos/pedido.model';
import { PedidoService } from '../../../core/pedidos/pedido.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MenuService } from '../services/menu.service';

@Component({
  selector: 'app-cliente-pedir',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cliente-pedir.html',
  styleUrl: './cliente-pedir.scss',
})
export class ClientePedirComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly menuService = inject(MenuService);
  private readonly pedidoService = inject(PedidoService);
  private readonly notificaciones = inject(NotificationService);
  private readonly usuario = inject(AuthService).usuario;

  readonly config = inject(ConfiguracionService).config;
  readonly editando = signal<Pedido | null>(null);
  readonly menu = signal<MenuCategoria[]>([]);
  readonly cargando = signal(true);
  readonly categoria = signal(0);
  readonly cantidades = signal<Record<number, number>>({});
  readonly tipo = signal<TipoPedido>('LLEVAR');
  readonly direccion = signal('');
  readonly observaciones = signal('');
  readonly enviando = signal(false);

  /** Lineas de un pedido anterior que el cliente quiere repetir (viene de Inicio). */
  private readonly repetir: LineaPedido[] =
    (this.router.getCurrentNavigation()?.extras.state?.['repetir'] as LineaPedido[] | undefined) ?? [];

  readonly itemsVisibles = computed(() => this.menu()[this.categoria()]?.items ?? []);
  readonly titulo = computed(() => (this.editando() ? `Edita tu pedido #${this.editando()!.id}` : 'Arma tu pedido'));
  readonly textoBoton = computed(() => {
    if (this.enviando()) {
      return this.editando() ? 'Guardando…' : 'Creando…';
    }
    return this.editando() ? 'Guardar cambios y continuar al pago' : 'Continuar al pago';
  });

  readonly lineas = computed<LineaPedido[]>(() => {
    const cantidades = this.cantidades();
    return this.menu()
      .flatMap((categoria) => categoria.items)
      .filter((item) => (cantidades[item.id] ?? 0) > 0)
      .map((item) => ({
        idProducto: item.id,
        nombre: item.nombre,
        detalle: item.detalle,
        precio: item.precio,
        cantidad: cantidades[item.id],
      }));
  });

  readonly total = computed(() => this.lineas().reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0));
  readonly cantidadTotal = computed(() => this.lineas().reduce((suma, linea) => suma + linea.cantidad, 0));
  readonly puedeConfirmar = computed(
    () =>
      this.config().pedidosActivos &&
      this.lineas().length > 0 &&
      (this.tipo() === 'LLEVAR' || this.direccion().trim().length > 0),
  );

  constructor() {
    this.menuService.cargar().subscribe(({ menu }) => {
      this.menu.set(menu);
      this.cargando.set(false);
      this.precargarLineas(this.editando()?.lineas ?? this.repetir);
    });

    this.route.queryParamMap.subscribe((params) => {
      const id = Number(params.get('editar'));
      if (!Number.isInteger(id) || id <= 0) {
        return;
      }
      this.pedidoService.obtener(id).subscribe({
        next: (pedido) => {
          if (pedido.estado !== 'RECIBIDO' || pedido.pagoEstado === 'APROBADO') {
            this.notificaciones.error('Este pedido ya no puede modificarse.');
            this.router.navigate(['/cliente/pago', pedido.id]);
            return;
          }
          this.editando.set(pedido);
          this.tipo.set(pedido.tipo);
          this.direccion.set(pedido.direccion ?? '');
          this.observaciones.set(pedido.observaciones ?? '');
          this.precargarLineas(pedido.lineas);
        },
      });
    });
  }

  cambiar(idProducto: number, delta: number): void {
    this.cantidades.update((cantidades) => ({
      ...cantidades,
      [idProducto]: Math.max(0, (cantidades[idProducto] ?? 0) + delta),
    }));
  }

  confirmar(): void {
    const idCliente = this.pedidoService.clienteActualId();
    if (idCliente === null || !this.puedeConfirmar() || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    const usuario = this.usuario();
    const editando = this.editando();
    const solicitud: NuevoPedido = {
      idCliente,
      cliente: usuario ? `${usuario.nombre} ${usuario.apellido.charAt(0)}.` : `Cliente #${idCliente}`,
      tipo: this.tipo(),
      clase: editando?.clase ?? 'NORMAL',
      direccion: this.direccion().trim() || null,
      observaciones: this.observaciones().trim() || null,
      lineas: this.lineas(),
    };
    const operacion = editando
      ? this.pedidoService.actualizar(editando.id, solicitud)
      : this.pedidoService.crear(solicitud);
    operacion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: (pedido) => {
        this.notificaciones.success(
          editando ? `Cambios del pedido #${pedido.id} guardados` : `Pedido #${pedido.id} creado`,
        );
        this.router.navigate(['/cliente/pago', pedido.id]);
      },
    });
  }

  private precargarLineas(lineas: LineaPedido[]): void {
    if (this.menu().length === 0 || lineas.length === 0) {
      return;
    }
    const idsDisponibles = new Set(this.menu().flatMap((categoria) => categoria.items.map((item) => item.id)));
    const cantidades: Record<number, number> = {};
    for (const linea of lineas) {
      if (idsDisponibles.has(linea.idProducto)) {
        cantidades[linea.idProducto] = linea.cantidad;
      }
    }
    this.cantidades.set(cantidades);
  }
}

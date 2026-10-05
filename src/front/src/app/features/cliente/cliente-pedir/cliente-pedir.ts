import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfiguracionService } from '../../../core/config/configuracion.service';
import { MenuCategoria } from '../../../core/data/menu.data';
import { NotificationService } from '../../../core/services/notification.service';
import { LineaPedido, TipoPedido } from '../../../core/pedidos/pedido.model';
import { PedidoService } from '../../../core/pedidos/pedido.service';
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
  private readonly menuService = inject(MenuService);
  private readonly pedidoService = inject(PedidoService);
  private readonly notificaciones = inject(NotificationService);
  private readonly usuario = inject(AuthService).usuario;

  readonly config = inject(ConfiguracionService).config;

  /** Lineas de un pedido anterior que el cliente quiere repetir (viene de Inicio). */
  private readonly repetir: LineaPedido[] =
    (this.router.getCurrentNavigation()?.extras.state?.['repetir'] as LineaPedido[] | undefined) ?? [];

  readonly menu = signal<MenuCategoria[]>([]);
  readonly cargando = signal(true);
  readonly categoria = signal(0);
  readonly cantidades = signal<Record<number, number>>({});
  readonly tipo = signal<TipoPedido>('LLEVAR');
  readonly direccion = signal('');
  readonly enviando = signal(false);

  readonly itemsVisibles = computed(() => this.menu()[this.categoria()]?.items ?? []);

  readonly lineas = computed<LineaPedido[]>(() => {
    const cantidades = this.cantidades();
    return this.menu()
      .flatMap((c) => c.items)
      .filter((i) => (cantidades[i.id] ?? 0) > 0)
      .map((i) => ({
        idProducto: i.id,
        nombre: i.nombre,
        detalle: i.detalle,
        precio: i.precio,
        cantidad: cantidades[i.id],
      }));
  });

  readonly total = computed(() => this.lineas().reduce((s, l) => s + l.precio * l.cantidad, 0));
  readonly cantidadTotal = computed(() => this.lineas().reduce((s, l) => s + l.cantidad, 0));
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
      this.precargarRepeticion(menu);
    });
  }

  cambiar(idProducto: number, delta: number): void {
    this.cantidades.update((c) => ({ ...c, [idProducto]: Math.max(0, (c[idProducto] ?? 0) + delta) }));
  }

  confirmar(): void {
    const usuario = this.usuario();
    if (!usuario || !this.puedeConfirmar()) {
      return;
    }
    this.enviando.set(true);
    this.pedidoService
      .crear({
        idCliente: usuario.id,
        cliente: `${usuario.nombre} ${usuario.apellido.charAt(0)}.`,
        tipo: this.tipo(),
        direccion: this.direccion().trim() || null,
        lineas: this.lineas(),
      })
      .subscribe({
        next: (pedido) => {
          this.notificaciones.success(`Pedido #${pedido.id} enviado a la cocina`);
          this.router.navigateByUrl('/cliente');
        },
        error: () => this.enviando.set(false),
      });
  }

  private precargarRepeticion(menu: MenuCategoria[]): void {
    const idsDisponibles = new Set(menu.flatMap((c) => c.items.map((i) => i.id)));
    const cantidades: Record<number, number> = {};
    for (const linea of this.repetir) {
      if (idsDisponibles.has(linea.idProducto)) {
        cantidades[linea.idProducto] = linea.cantidad;
      }
    }
    this.cantidades.set(cantidades);
  }
}

import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Pedido, ETIQUETA_ESTADO, etiquetaTipoPedido, resumenLineas } from '../../../core/pedidos/pedido.model';
import { PedidoService } from '../../../core/pedidos/pedido.service';

@Component({
  selector: 'app-cliente-confirmacion',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cliente-confirmacion.html',
  styleUrl: './cliente-confirmacion.scss',
})
export class ClienteConfirmacionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pedidos = inject(PedidoService);

  readonly pedido = signal<Pedido | null>(null);
  readonly cargando = signal(true);
  readonly etiquetaEstado = ETIQUETA_ESTADO;
  readonly tipoDe = etiquetaTipoPedido;
  readonly resumen = resumenLineas;

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
      },
      error: () => this.cargando.set(false),
    });
  }
}

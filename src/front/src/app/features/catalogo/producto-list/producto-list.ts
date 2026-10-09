import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { Categoria } from '../models/categoria.model';
import { Producto } from '../models/producto.model';
import { CategoriaService } from '../services/categoria.service';
import { ProductoService } from '../services/producto.service';

type FiltroDisponible = 'todos' | 'si' | 'no';

/** Menu del negocio: lista de productos con filtros, disponibilidad y acciones. */
@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.scss',
})
export class ProductoListComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly productos = signal<Producto[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly cargando = signal(false);

  readonly categoriaSeleccionada = signal<number | null>(null);
  readonly disponibilidad = signal<FiltroDisponible>('todos');
  readonly busqueda = signal('');

  readonly disponibilidades: { valor: FiltroDisponible; etiqueta: string }[] = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'si', etiqueta: 'Disponibles' },
    { valor: 'no', etiqueta: 'No disponibles' },
  ];

  private readonly nombresCategoria = computed(
    () => new Map(this.categorias().map((c) => [c.idCategoria, c.nombre])),
  );

  readonly chipsCategoria = computed(() => [
    { id: null as number | null, nombre: 'Todas', cantidad: this.productos().length },
    ...this.categorias().map((c) => ({
      id: c.idCategoria as number | null,
      nombre: c.nombre,
      cantidad: this.productos().filter((p) => p.idCategoria === c.idCategoria).length,
    })),
  ]);

  readonly visibles = computed(() => {
    const categoria = this.categoriaSeleccionada();
    const disponibilidad = this.disponibilidad();
    const texto = this.busqueda().trim().toLowerCase();
    return this.productos().filter(
      (p) =>
        (categoria === null || p.idCategoria === categoria) &&
        (disponibilidad === 'todos' || p.disponible === (disponibilidad === 'si')) &&
        (!texto || p.nombre.toLowerCase().includes(texto) || (p.descripcion ?? '').toLowerCase().includes(texto)),
    );
  });

  ngOnInit(): void {
    this.categoriaService.listar().subscribe((categorias) => this.categorias.set(categorias));
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.productoService
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((productos) => this.productos.set(productos));
  }

  nombreCategoria(idCategoria: number): string {
    return this.nombresCategoria().get(idCategoria) ?? `#${idCategoria}`;
  }

  cambiarDisponibilidad(producto: Producto): void {
    const disponible = !producto.disponible;
    this.productoService.actualizarDisponibilidad(producto.idProducto, disponible).subscribe((actualizado) => {
      this.productos.update((lista) =>
        lista.map((p) => (p.idProducto === actualizado.idProducto ? { ...p, disponible: actualizado.disponible } : p)),
      );
      this.notificationService.success(
        actualizado.disponible ? `"${producto.nombre}" disponible` : `"${producto.nombre}" pausado`,
      );
    });
  }

  eliminar(producto: Producto): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar producto',
      message: `¿Seguro que deseas eliminar "${producto.nombre}"?`,
      confirmText: 'Eliminar',
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmado) => {
        if (!confirmado) {
          return;
        }
        this.productoService.eliminar(producto.idProducto).subscribe(() => {
          this.notificationService.success('Producto eliminado');
          this.cargar();
        });
      });
  }
}

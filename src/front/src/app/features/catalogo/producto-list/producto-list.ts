import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { Categoria } from '../models/categoria.model';
import { Producto, ProductoConCategoria } from '../models/producto.model';
import { CategoriaService } from '../services/categoria.service';
import { ProductoService } from '../services/producto.service';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DecimalPipe,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    LoadingSpinner,
    EmptyState,
  ],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.scss',
})
export class ProductoListComponent implements OnInit {
  productos: Producto[] = [];
  productosConCategoria: ProductoConCategoria[] = [];
  categorias: Categoria[] = [];
  categoriaPorId = new Map<number, string>();

  loading = false;
  loadingConCategoria = false;

  readonly filtroCategoria = new FormControl<number | null>(null);
  readonly filtroDisponible = new FormControl<boolean | null>(null);

  readonly columnas = ['nombre', 'categoria', 'precio', 'disponible', 'acciones'];
  readonly columnasConCategoria = ['nombre', 'nombreCategoria', 'precio', 'disponible'];

  constructor(
    private readonly productoService: ProductoService,
    private readonly categoriaService: CategoriaService,
    private readonly notificationService: NotificationService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.categoriaService.listar().subscribe((categorias) => {
      this.categorias = categorias;
      this.categoriaPorId = new Map(categorias.map((c) => [c.idCategoria, c.nombre]));
    });
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    const idCategoria = this.filtroCategoria.value ?? undefined;
    const disponible = this.filtroDisponible.value ?? undefined;

    this.productoService
      .listar(idCategoria, disponible)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((productos) => (this.productos = productos));
  }

  cargarConCategoria(): void {
    this.loadingConCategoria = true;
    this.productoService
      .listarConCategoria()
      .pipe(finalize(() => (this.loadingConCategoria = false)))
      .subscribe((productos) => (this.productosConCategoria = productos));
  }

  nombreCategoria(idCategoria: number): string {
    return this.categoriaPorId.get(idCategoria) ?? `#${idCategoria}`;
  }

  cambiarDisponibilidad(producto: Producto, disponible: boolean): void {
    this.productoService
      .actualizarDisponibilidad(producto.idProducto, disponible)
      .subscribe((actualizado) => {
        producto.disponible = actualizado.disponible;
        this.notificationService.success('Disponibilidad actualizada');
      });
  }

  eliminar(producto: Producto): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar producto',
      message: `Seguro que deseas eliminar "${producto.nombre}"?`,
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

  onTabChange(index: number): void {
    if (index === 1 && this.productosConCategoria.length === 0) {
      this.cargarConCategoria();
    }
  }
}

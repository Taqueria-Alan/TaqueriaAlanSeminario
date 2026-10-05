import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { Categoria } from '../models/categoria.model';
import { CategoriaService } from '../services/categoria.service';

type FiltroActiva = 'todas' | 'activas' | 'inactivas';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './categoria-list.html',
  styleUrl: './categoria-list.scss',
})
export class CategoriaListComponent implements OnInit {
  private readonly categoriaService = inject(CategoriaService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly categorias = signal<Categoria[]>([]);
  readonly cargando = signal(false);
  readonly filtro = signal<FiltroActiva>('todas');

  readonly filtros: { valor: FiltroActiva; etiqueta: string }[] = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'activas', etiqueta: 'Activas' },
    { valor: 'inactivas', etiqueta: 'Inactivas' },
  ];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    const activa = this.filtro() === 'todas' ? undefined : this.filtro() === 'activas';
    this.categoriaService
      .listar(activa)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((categorias) => this.categorias.set(categorias));
  }

  cambiarFiltro(filtro: FiltroActiva): void {
    this.filtro.set(filtro);
    this.cargar();
  }

  desactivar(categoria: Categoria): void {
    const data: ConfirmDialogData = {
      title: 'Desactivar categoría',
      message: `¿Seguro que deseas desactivar "${categoria.nombre}"? Si tiene productos asociados no se eliminará, solo se marcará como inactiva.`,
      confirmText: 'Desactivar',
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmado) => {
        if (!confirmado) {
          return;
        }
        this.categoriaService.eliminar(categoria.idCategoria).subscribe(() => {
          this.notificationService.success('Categoría actualizada correctamente');
          this.cargar();
        });
      });
  }
}

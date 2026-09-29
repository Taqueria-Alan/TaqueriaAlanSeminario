import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
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
import { CategoriaService } from '../services/categoria.service';

type FiltroActiva = 'todas' | 'activas' | 'inactivas';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    LoadingSpinner,
    EmptyState,
  ],
  templateUrl: './categoria-list.html',
  styleUrl: './categoria-list.scss',
})
export class CategoriaListComponent implements OnInit {
  categorias: Categoria[] = [];
  loading = false;
  filtro: FiltroActiva = 'todas';
  readonly columnas = ['nombre', 'descripcion', 'activa', 'acciones'];

  constructor(
    private readonly categoriaService: CategoriaService,
    private readonly notificationService: NotificationService,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    const activa = this.filtro === 'todas' ? undefined : this.filtro === 'activas';
    this.categoriaService
      .listar(activa)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((categorias) => {
        this.categorias = categorias;
        this.cdr.markForCheck();
      });
  }

  cambiarFiltro(filtro: FiltroActiva): void {
    this.filtro = filtro;
    this.cargar();
  }

  desactivar(categoria: Categoria): void {
    const data: ConfirmDialogData = {
      title: 'Desactivar categoria',
      message: `Seguro que deseas desactivar "${categoria.nombre}"? Si tiene productos asociados no se eliminara, solo se marcara como inactiva.`,
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
          this.notificationService.success('Categoria actualizada correctamente');
          this.cargar();
        });
      });
  }
}

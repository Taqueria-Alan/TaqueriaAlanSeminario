import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ClienteSearchComponent } from '../cliente-search/cliente-search';
import { ClienteBusqueda } from '../models/cliente.model';
import { Membresia } from '../models/membresia.model';
import { ClubAlanService } from '../services/club-alan.service';

@Component({
  selector: 'app-membresia',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    LoadingSpinner,
    ClienteSearchComponent,
  ],
  templateUrl: './membresia.html',
  styleUrl: './membresia.scss',
})
export class MembresiaComponent {
  loading = false;
  procesando = false;
  buscado = false;
  clienteSeleccionado: ClienteBusqueda | null = null;
  membresia: Membresia | null = null;

  constructor(
    private readonly clubAlanService: ClubAlanService,
    private readonly notificationService: NotificationService,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  onClienteSeleccionado(cliente: ClienteBusqueda): void {
    this.clienteSeleccionado = cliente;
    this.consultar();
  }

  activar(): void {
    if (!this.clienteSeleccionado) {
      return;
    }

    this.procesando = true;
    this.clubAlanService
      .activarMembresia(this.clienteSeleccionado.idCliente)
      .pipe(
        finalize(() => {
          this.procesando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((membresia) => {
        this.membresia = membresia;
        this.notificationService.success('Membresia activada correctamente');
        this.cdr.markForCheck();
      });
  }

  cancelar(): void {
    if (!this.clienteSeleccionado) {
      return;
    }

    const data: ConfirmDialogData = {
      title: 'Cancelar membresia',
      message: 'Seguro que deseas cancelar la membresia Club Alan de este cliente?',
      confirmText: 'Cancelar membresia',
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmado) => {
        if (!confirmado || !this.clienteSeleccionado) {
          return;
        }
        this.procesando = true;
        this.clubAlanService
          .cancelarMembresia(this.clienteSeleccionado.idCliente)
          .pipe(
            finalize(() => {
              this.procesando = false;
              this.cdr.markForCheck();
            }),
          )
          .subscribe(() => {
            this.notificationService.success('Membresia cancelada');
            this.consultar();
          });
      });
  }

  private consultar(): void {
    if (!this.clienteSeleccionado) {
      return;
    }

    this.loading = true;
    this.buscado = true;
    this.membresia = null;

    this.clubAlanService
      .obtenerMembresia(this.clienteSeleccionado.idCliente)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (membresia) => {
          this.membresia = membresia;
          this.cdr.markForCheck();
        },
        error: () => {
          this.membresia = null;
          this.cdr.markForCheck();
        },
      });
  }
}

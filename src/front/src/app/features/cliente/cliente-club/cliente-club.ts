import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { Membresia } from '../../club-alan/models/membresia.model';
import { MovimientoPuntos } from '../../club-alan/models/movimiento.model';
import { ClubAlanService } from '../../club-alan/services/club-alan.service';

const POR_PAGINA = 5;

/**
 * Tarjeta del Club Alan para el inicio del cliente: saldo de puntos, beneficios de la
 * membresia y sus ultimos movimientos. Todo viene de club-alan-service.
 */
@Component({
  selector: 'app-cliente-club',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './cliente-club.html',
  styleUrl: './cliente-club.scss',
})
export class ClienteClubComponent implements OnInit {
  private readonly clubAlan = inject(ClubAlanService);

  readonly idCliente = input.required<number>();

  readonly cargando = signal(true);
  readonly cargandoMas = signal(false);
  readonly puntos = signal<number | null>(null);
  readonly membresia = signal<Membresia | null>(null);
  readonly movimientos = signal<MovimientoPuntos[]>([]);
  readonly hayMas = signal(false);

  private pagina = 0;

  readonly envioGratis = computed(() => !!this.membresia()?.activa && !!this.membresia()?.envioGratis);

  ngOnInit(): void {
    const id = this.idCliente();
    forkJoin({
      puntos: this.clubAlan.obtenerPuntos(id, true).pipe(catchError(() => of(null))),
      membresia: this.clubAlan.obtenerMembresia(id, true).pipe(catchError(() => of(null))),
      movimientos: this.clubAlan.listarMovimientos(id, 0, POR_PAGINA, true).pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe(({ puntos, membresia, movimientos }) => {
        this.puntos.set(puntos?.puntos ?? null);
        this.membresia.set(membresia);
        this.movimientos.set(movimientos?.content ?? []);
        this.hayMas.set(movimientos ? !movimientos.last : false);
      });
  }

  verMas(): void {
    if (this.cargandoMas()) {
      return;
    }
    this.cargandoMas.set(true);
    this.pagina += 1;
    this.clubAlan
      .listarMovimientos(this.idCliente(), this.pagina, POR_PAGINA, true)
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.cargandoMas.set(false)),
      )
      .subscribe((pagina) => {
        if (!pagina) {
          this.pagina -= 1;
          return;
        }
        this.movimientos.update((actuales) => [...actuales, ...pagina.content]);
        this.hayMas.set(!pagina.last);
      });
  }
}

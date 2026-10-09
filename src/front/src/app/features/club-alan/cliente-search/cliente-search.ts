import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {
  Observable,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
} from 'rxjs';
import { ClienteBusqueda } from '../models/cliente.model';
import { ClubAlanService } from '../services/club-alan.service';

@Component({
  selector: 'app-cliente-search',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, MatAutocompleteModule],
  templateUrl: './cliente-search.html',
  styleUrl: './cliente-search.scss',
})
export class ClienteSearchComponent {
  @Output() clienteSeleccionado = new EventEmitter<ClienteBusqueda>();

  readonly control = new FormControl('');
  readonly opciones$: Observable<ClienteBusqueda[]> = this.control.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((valor) => {
      const query = (valor ?? '').trim();
      return query.length >= 2 ? this.clubAlanService.buscarClientes(query) : of([]);
    }),
  );

  constructor(private readonly clubAlanService: ClubAlanService) {}

  mostrarCliente(cliente: ClienteBusqueda | string | null): string {
    if (!cliente) {
      return '';
    }
    if (typeof cliente === 'string') {
      return cliente;
    }
    return cliente.telefono ? `${cliente.nombre} - ${cliente.telefono}` : cliente.nombre;
  }

  onOpcionSeleccionada(event: MatAutocompleteSelectedEvent): void {
    this.clienteSeleccionado.emit(event.option.value as ClienteBusqueda);
  }

  /** Rellena el buscador con un cliente que llego desde otra pantalla. */
  establecer(cliente: ClienteBusqueda): void {
    this.control.setValue(this.mostrarCliente(cliente), { emitEvent: false });
  }
}

import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfiguracionService } from '../../core/config/configuracion.service';
import { MENU_ESTATICO, MenuCategoria } from '../../core/data/menu.data';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent {
  readonly anioActual = new Date().getFullYear();
  private readonly configuracion = inject(ConfiguracionService);

  readonly config = this.configuracion.config;
  readonly telefonoHref = this.configuracion.telefonoHref;
  readonly whatsappHref = this.configuracion.whatsappHref;
  readonly mapaHref = this.configuracion.mapaHref;

  readonly carnes = ['Pastor', 'Pollo', 'Chorizo', 'Longaniza', 'Res', 'Adobado'];
  readonly menu: MenuCategoria[] = MENU_ESTATICO;

  readonly pasos = [
    {
      titulo: 'Crea tu cuenta',
      texto: 'Regístrate con tu nombre, teléfono y correo en menos de un minuto.',
    },
    {
      titulo: 'Arma tu pedido',
      texto: 'Elige tacos, gringas, tortillas o tortas, y la carne que se te antoje.',
    },
    {
      titulo: 'Recoge o recibe',
      texto: 'Sigue el estado de tu pedido en tiempo real, desde que entra a la plancha.',
    },
  ];
}

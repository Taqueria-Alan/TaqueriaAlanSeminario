import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ConfiguracionService } from '../../core/config/configuracion.service';
import { MENU_ESTATICO, MenuCategoria } from '../../core/data/menu.data';
import { MenuService } from '../../core/catalogo/menu.service';

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
  private readonly menuService = inject(MenuService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly config = this.configuracion.config;
  readonly telefonoHref = this.configuracion.telefonoHref;
  readonly whatsappHref = this.configuracion.whatsappHref;
  readonly mapaHref = this.configuracion.mapaHref;

  /**
   * Mapa de Google incrustado (sin llave de API). La URL se arma solo con el nombre y la
   * direccion de Ajustes, codificados; el dominio es fijo.
   */
  readonly mapaIncrustado = computed(() => {
    const { nombre, direccion } = this.config();
    const consulta = encodeURIComponent(`${nombre}, ${direccion}`);
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.google.com/maps?q=${consulta}&output=embed`,
    );
  });

  /** Foto principal del hero (public/images/tacos.webp). */
  readonly fotoHero = 'images/tacos.webp';

  readonly carnes = ['Pastor', 'Pollo', 'Chorizo', 'Longaniza', 'Res', 'Adobado'];
  // Arranca con el menu oficial para que la pagina nunca se vea vacia; en
  // cuanto responde catalogo-service se reemplaza por los productos reales.
  readonly menu = signal<MenuCategoria[]>(MENU_ESTATICO);

  /** Primer producto de cada categoria (maximo 4) para la fila "Lo más pedido". */
  readonly destacados = computed(() =>
    this.menu()
      .map((categoria) => categoria.items[0])
      .filter((item) => !!item)
      .slice(0, 4),
  );

  /**
   * Fotos de los platillos, por nombre de producto (y 'hero' para la principal).
   * Mientras no haya foto se muestra el logo. Ejemplo: { hero: 'images/tacos-pastor.jpg' }.
   */
  readonly fotos: Record<string, string> = {};

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

  constructor() {
    this.menuService.cargar().subscribe(({ menu }) => this.menu.set(menu));
  }
}

import { Injectable, computed, effect, signal } from '@angular/core';

export interface Configuracion {
  nombre: string;
  telefono: string;
  whatsapp: string;
  direccion: string;
  horario: string;
  pedidosActivos: boolean;
  domicilioActivo: boolean;
}

export const CONFIGURACION_INICIAL: Configuracion = {
  nombre: 'Taquería Alan',
  telefono: '+502 5875 6425',
  whatsapp: '+502 5875 6425',
  direccion: 'Altos de Bárcenas 1, Cdad. de Guatemala 00502, Guatemala',
  horario: '7:00 p. m. – 10:00 p. m.',
  pedidosActivos: true,
  domicilioActivo: true,
};

const CONFIG_KEY = 'taqueria_mock_config';

/**
 * CONFIGURACION DEL NEGOCIO SIMULADA.
 *
 * No hay servicio de configuracion en el backend, asi que los datos del negocio
 * y los interruptores de pedidos se guardan en localStorage. La landing y el
 * panel de cliente leen de aqui, y el admin los edita en Ajustes.
 */
@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private readonly _config = signal<Configuracion>(this.leer());

  readonly config = this._config.asReadonly();
  readonly telefonoHref = computed(() => `tel:${soloDigitos(this._config().telefono, true)}`);
  readonly whatsappHref = computed(() => `https://wa.me/${soloDigitos(this._config().whatsapp)}`);
  readonly mapaHref = computed(() => {
    const { nombre, direccion } = this._config();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nombre}, ${direccion}`)}`;
  });

  constructor() {
    effect(() => localStorage.setItem(CONFIG_KEY, JSON.stringify(this._config())));
  }

  guardar(config: Configuracion): void {
    this._config.set({ ...config });
  }

  restablecer(): void {
    this._config.set({ ...CONFIGURACION_INICIAL });
  }

  private leer(): Configuracion {
    try {
      const guardada = JSON.parse(localStorage.getItem(CONFIG_KEY) ?? 'null');
      return { ...CONFIGURACION_INICIAL, ...(guardada ?? {}) };
    } catch {
      return { ...CONFIGURACION_INICIAL };
    }
  }
}

function soloDigitos(texto: string, conservarMas = false): string {
  return texto.replace(conservarMas ? /[^\d+]/g : /\D/g, '');
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface MenuItem {
  nombre: string;
  detalle: string;
  precio: string;
}

interface MenuCategoria {
  titulo: string;
  icono: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent {
  readonly anioActual = new Date().getFullYear();
  readonly telefono = '+502 5875 6425';
  readonly telefonoHref = 'tel:+50258756425';
  readonly whatsappHref = 'https://wa.me/50258756425';
  readonly direccion = 'Altos de Bárcenas 1, Cdad. de Guatemala 00502, Guatemala';
  readonly mapaHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Taqueria Alan, Altos de Bárcenas 1, Cdad. de Guatemala',
  )}`;
  readonly horario = '7:00 p. m. – 10:00 p. m.';

  readonly menu: MenuCategoria[] = [
    {
      titulo: 'Tacos',
      icono: 'lunch_dining',
      items: [
        { nombre: '3 Tacos', detalle: 'Pastor, pollo, chorizo, longaniza o 2 carnes', precio: 'Q18' },
        { nombre: '3 Tacos', detalle: 'Res y adobado', precio: 'Q24' },
        { nombre: '4 Tacos', detalle: 'Pastor, pollo, chorizo, longaniza o 2 carnes', precio: 'Q24' },
        { nombre: '4 Tacos', detalle: 'Res y adobado', precio: 'Q30' },
      ],
    },
    {
      titulo: 'Gringas',
      icono: 'flatware',
      items: [
        { nombre: 'Pequeña', detalle: 'Pastor, pollo, chorizo, longaniza o 2 carnes', precio: 'Q12' },
        { nombre: 'Super', detalle: 'Res, adobado o mixto', precio: 'Q24' },
        { nombre: 'Jumbo', detalle: 'Res, adobado o mixto', precio: 'Q40' },
        { nombre: 'Porción de 3 pequeñas', detalle: 'Res, adobado o mixto', precio: 'Q40' },
      ],
    },
    {
      titulo: 'Tortillas de harina',
      icono: 'bakery_dining',
      items: [
        { nombre: 'Pequeña', detalle: 'Pastor, pollo, chorizo, longaniza o 2 carnes', precio: 'Q18' },
        { nombre: 'Normal', detalle: 'Res, adobado o mixto', precio: 'Q30' },
        { nombre: 'Gigante', detalle: 'Res, adobado o mixto', precio: 'Q40' },
      ],
    },
    {
      titulo: 'Tortas y hamburguesas',
      icono: 'kebab_dining',
      items: [
        { nombre: 'Torta de embutidos', detalle: 'Pan horneado, guarniciones frescas', precio: 'Q18' },
        { nombre: 'Torta de carne especial', detalle: 'Pan horneado, guarniciones frescas', precio: 'Q25' },
        { nombre: 'Hamburguesa', detalle: 'Carne especial de la casa', precio: 'Q16' },
      ],
    },
  ];
}

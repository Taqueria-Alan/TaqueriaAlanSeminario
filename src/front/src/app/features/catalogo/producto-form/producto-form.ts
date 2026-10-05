import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { Categoria } from '../models/categoria.model';
import { CategoriaService } from '../services/categoria.service';
import { ProductoService } from '../services/producto.service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    LoadingSpinner,
  ],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.scss',
})
export class ProductoFormComponent implements OnInit {
  loading = false;
  guardando = false;
  idProducto: number | null = null;
  categorias: Categoria[] = [];

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    idCategoria: [null as number | null, Validators.required],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    disponible: [true],
  });

  constructor(
    private readonly productoService: ProductoService,
    private readonly categoriaService: CategoriaService,
    private readonly notificationService: NotificationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get esEdicion(): boolean {
    return this.idProducto !== null;
  }

  ngOnInit(): void {
    this.categoriaService.listar(true).subscribe((categorias) => {
      this.categorias = categorias;
      this.cdr.markForCheck();
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.idProducto = Number(idParam);
    this.loading = true;
    this.productoService
      .obtenerPorId(this.idProducto)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((producto) => {
        this.form.patchValue({
          idCategoria: producto.idCategoria,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          disponible: producto.disponible,
        });
        this.cdr.markForCheck();
      });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = {
      idCategoria: this.form.value.idCategoria!,
      nombre: this.form.value.nombre!.trim(),
      descripcion: this.form.value.descripcion?.trim() || null,
      precio: this.form.value.precio!,
      disponible: this.form.value.disponible ?? true,
    };

    this.guardando = true;
    const accion = this.esEdicion
      ? this.productoService.actualizar(this.idProducto!, request)
      : this.productoService.crear(request);

    accion
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe(() => {
        this.notificationService.success(this.esEdicion ? 'Producto actualizado' : 'Producto creado');
        this.router.navigate(['/admin/catalogo/productos']);
      });
  }
}

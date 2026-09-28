import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { CategoriaService } from '../services/categoria.service';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    LoadingSpinner,
  ],
  templateUrl: './categoria-form.html',
  styleUrl: './categoria-form.scss',
})
export class CategoriaFormComponent implements OnInit {
  loading = false;
  guardando = false;
  idCategoria: number | null = null;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    activa: [true],
  });

  constructor(
    private readonly categoriaService: CategoriaService,
    private readonly notificationService: NotificationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  get esEdicion(): boolean {
    return this.idCategoria !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.idCategoria = Number(idParam);
    this.loading = true;
    this.categoriaService
      .obtenerPorId(this.idCategoria)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((categoria) => {
        this.form.patchValue({
          nombre: categoria.nombre,
          descripcion: categoria.descripcion,
          activa: categoria.activa,
        });
      });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = {
      nombre: this.form.value.nombre!.trim(),
      descripcion: this.form.value.descripcion?.trim() || null,
      activa: this.form.value.activa ?? true,
    };

    this.guardando = true;
    const accion = this.esEdicion
      ? this.categoriaService.actualizar(this.idCategoria!, request)
      : this.categoriaService.crear(request);

    accion.pipe(finalize(() => (this.guardando = false))).subscribe(() => {
      this.notificationService.success(
        this.esEdicion ? 'Categoria actualizada' : 'Categoria creada',
      );
      this.router.navigate(['/catalogo/categorias']);
    });
  }
}

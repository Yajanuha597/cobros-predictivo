import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import {
  CobroGestion,
  CobroService,
} from '../../../../core/services/cobro.service';

@Component({
  selector: 'app-cobros-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cobros-list.html',
  styleUrl: './cobros-list.scss',
})
export class CobrosList implements OnInit {

  private readonly cobroService = inject(CobroService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  cobros: CobroGestion[] = [];

  cargando = true;
  error = '';

  estado: 'cargando' | 'error' | 'vacio' | 'datos' = 'cargando';

  ngOnInit(): void {
    console.log('=== COBROS LIST INICIADO ===');
    this.cargarCobros();
  }

  cargarCobros(): void {

    console.log('=== INICIANDO CARGA DE COBROS ===');

    this.cargando = true;
    this.error = '';
    this.estado = 'cargando';

    this.cobroService.findGestionCobranza().subscribe({

      next: (response) => {

        console.log('RESPUESTA COMPLETA:', response);
        console.log('CUOTAS RECIBIDAS:', response.cuotas);
        console.log(
          'TOTAL DE CUOTAS:',
          response.cuotas ? response.cuotas.length : 0
        );

        this.cobros = response.cuotas ?? [];

        this.cargando = false;

        if (this.cobros.length === 0) {
          this.estado = 'vacio';
          console.log('ESTADO FINAL: VACIO');
        } else {
          this.estado = 'datos';
          console.log('ESTADO FINAL: DATOS');
        }

        this.changeDetectorRef.detectChanges();

        console.log('CARGANDO:', this.cargando);
        console.log('ESTADO:', this.estado);
        console.log('TOTAL COBROS:', this.cobros.length);
      },

      error: (err) => {

        console.error('ERROR AL CARGAR COBROS:', err);

        this.cargando = false;
        this.estado = 'error';

        this.error =
          'No se pudo cargar la información de cobros.';

        this.changeDetectorRef.detectChanges();

        console.log('ESTADO FINAL: ERROR');
      },

    });
  }

  getNombreCliente(cobro: CobroGestion): string {
    return `${cobro.cliente.nombres} ${cobro.cliente.apellidos}`;
  }

  getClaseRiesgo(nivelRiesgo: string): string {

    switch (nivelRiesgo) {

      case 'BAJO':
        return 'bajo';

      case 'MEDIO':
        return 'medio';

      case 'ALTO':
        return 'alto';

      default:
        return '';
    }
  }
}
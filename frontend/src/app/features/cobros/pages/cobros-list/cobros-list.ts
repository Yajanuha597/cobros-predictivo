import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  CobroGestion,
  CobroService
} from '../../../../core/services/cobro.service';

@Component({
  selector: 'app-cobros-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cobros-list.html',
  styleUrl: './cobros-list.scss'
})
export class CobrosList implements OnInit {
  private readonly cobroService = inject(CobroService);

  cobros: CobroGestion[] = [];

  cargando = false;

  error = '';

  estado: 'cargando' | 'error' | 'vacio' | 'datos' = 'vacio';

  ngOnInit(): void {
    this.cargarCobros();
  }

  cargarCobros(): void {
    this.error = '';

    this.cobroService.findGestionCobranza().subscribe({
      next: (response) => {
        console.log('Respuesta de gestión de cobros:', response);

        this.cobros = response?.cuotas ?? [];

        if (this.cobros.length > 0) {
          this.estado = 'datos';
        } else {
          this.estado = 'vacio';
        }

        this.cargando = false;

        console.log('Cobros:', this.cobros.length);
        console.log('Estado:', this.estado);
        console.log('Cargando:', this.cargando);
      },

      error: (err) => {
        console.error('Error al cargar cobros:', err);

        this.cargando = false;
        this.estado = 'error';

        this.error =
          'No se pudo cargar la información de cobros. Verifica que el servidor esté disponible.';
      }
    });
  }

  getNombreCliente(cobro: CobroGestion): string {
    const nombres = cobro?.cliente?.nombres ?? '';
    const apellidos = cobro?.cliente?.apellidos ?? '';

    return `${nombres} ${apellidos}`.trim() || 'Cliente sin nombre';
  }

  getIdentificacion(cobro: CobroGestion): string {
    return cobro?.cliente?.identificacion || 'Sin identificación';
  }

  getTipoGestion(cobro: CobroGestion): string {
    if (cobro.tipoGestion === 'VENCE_MANANA') {
      return 'Vence mañana';
    }

    if (cobro.tipoGestion === 'VENCIDA') {
      return 'Vencida';
    }

    return cobro.tipoGestion || 'Sin gestión';
  }

  getClaseGestion(cobro: CobroGestion): string {
    if (cobro.tipoGestion === 'VENCE_MANANA') {
      return 'manana';
    }

    if (cobro.tipoGestion === 'VENCIDA') {
      return 'vencida';
    }

    return '';
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
        return 'sin-riesgo';
    }
  }

  getRiesgoTexto(nivelRiesgo: string): string {
    return nivelRiesgo || 'Sin riesgo';
  }

  contarVencidas(): number {
    return this.cobros.filter(
      cobro => cobro.tipoGestion === 'VENCIDA'
    ).length;
  }

  contarManana(): number {
    return this.cobros.filter(
      cobro => cobro.tipoGestion === 'VENCE_MANANA'
    ).length;
  }
}
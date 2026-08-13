import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';

export interface CobroCuota {
  id: number;
  numeroCuota: number;
  fechaVencimiento: string;
  monto: number;
  saldoPendiente: number;
  estado: string;
}

export interface CobroPrestamo {
  id: number;
  monto: number;
  fechaInicio: string;
  numeroCuotas: number;
  estado: string;
}

export interface CobroCliente {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
}

export interface CobroGestion {
  cuota: CobroCuota;
  prestamo: CobroPrestamo;
  cliente: CobroCliente;
  tipoGestion: 'VENCE_MANANA' | 'VENCIDA';
  diasAtraso: number;
  nivelRiesgo: string;
}

export interface GestionCobranzaResponse {
  success: boolean;
  message: string;
  fechaReferencia: string;
  fechaManana: string;
  cuotas: CobroGestion[];
}

export interface CuotasResponse {
  success: boolean;
  message: string;
  cuotas: Array<{
    id: number;
    prestamoId: number;
    prestamo: CobroPrestamo & {
      cliente: CobroCliente;
    };
    numeroCuota: number;
    fechaVencimiento: string;
    monto: string | number;
    saldoPendiente: string | number;
    estado: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class CobroService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'https://backsistemacobros.byronrm.com/cuotas';

  findGestionCobranza(): Observable<GestionCobranzaResponse> {
    return this.http
      .get<GestionCobranzaResponse>(
        `${this.apiUrl}/gestion-cobranza`
      )
      .pipe(
        timeout(15000)
      );
  }

  findAll(): Observable<CuotasResponse> {
    return this.http
      .get<CuotasResponse>(this.apiUrl)
      .pipe(
        timeout(15000)
      );
  }
}
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

import { CUOTA_ESTADOS } from '../entities/cuota.entity';
import type { CuotaEstado } from '../entities/cuota.entity';

export class UpdateCuotaDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  prestamoId?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  numeroCuota?: number;

  @IsDateString()
  @IsOptional()
  fechaVencimiento?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0.01)
  monto?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  saldoPendiente?: number;

  @IsIn(CUOTA_ESTADOS)
  @IsOptional()
  estado?: CuotaEstado;
}

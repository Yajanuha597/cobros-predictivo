import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

import { CUOTA_ESTADOS } from '../entities/cuota.entity';
import type { CuotaEstado } from '../entities/cuota.entity';

export class CreateCuotaDto {
  @IsInt()
  @Min(1)
  prestamoId!: number;

  @IsInt()
  @Min(1)
  numeroCuota!: number;

  @IsDateString()
  @IsNotEmpty()
  fechaVencimiento!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  saldoPendiente!: number;

  @IsIn(CUOTA_ESTADOS)
  @IsOptional()
  estado?: CuotaEstado;
}

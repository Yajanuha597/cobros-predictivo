import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdatePrestamoDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  clienteId?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0.01)
  monto?: number;

  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  numeroCuotas?: number;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  estado?: string;
}

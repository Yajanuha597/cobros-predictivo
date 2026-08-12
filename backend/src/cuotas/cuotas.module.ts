import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Prestamo } from '../prestamos/entities/prestamo.entity';
import { PrestamoRepository } from '../prestamos/repositories/prestamo.repository';
import { CuotasController } from './cuotas.controller';
import { CuotasService } from './cuotas.service';
import { Cuota } from './entities/cuota.entity';
import { CuotaRepository } from './repositories/cuota.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota, Prestamo])],
  controllers: [CuotasController],
  providers: [CuotasService, CuotaRepository, PrestamoRepository],
})
export class CuotasModule {}

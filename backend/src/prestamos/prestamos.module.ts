import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cliente } from '../clientes/entities/cliente.entity';
import { ClienteRepository } from '../clientes/repositories/cliente.repository';
import { Prestamo } from './entities/prestamo.entity';
import { PrestamoRepository } from './repositories/prestamo.repository';
import { PrestamosController } from './prestamos.controller';
import { PrestamosService } from './prestamos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Prestamo, Cliente])],
  controllers: [PrestamosController],
  providers: [PrestamosService, PrestamoRepository, ClienteRepository],
})
export class PrestamosModule {}

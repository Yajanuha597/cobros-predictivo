import { Injectable, NotFoundException } from '@nestjs/common';

import { Cliente } from '../clientes/entities/cliente.entity';
import { ClienteRepository } from '../clientes/repositories/cliente.repository';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';
import { UpdatePrestamoDto } from './dto/update-prestamo.dto';
import { Prestamo } from './entities/prestamo.entity';
import { PrestamoRepository } from './repositories/prestamo.repository';

export interface PrestamoResponse {
  success: boolean;
  message: string;
  prestamo: Prestamo;
}

export interface PrestamosResponse {
  success: boolean;
  message: string;
  prestamos: Prestamo[];
}

@Injectable()
export class PrestamosService {
  constructor(
    private readonly prestamoRepository: PrestamoRepository,
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async findAll(): Promise<PrestamosResponse> {
    const prestamos = await this.prestamoRepository.findAll();

    return {
      success: true,
      message: 'Prestamos obtenidos correctamente',
      prestamos,
    };
  }

  async findOne(id: number): Promise<PrestamoResponse> {
    const prestamo = await this.findPrestamoById(id);

    return {
      success: true,
      message: 'Prestamo obtenido correctamente',
      prestamo,
    };
  }

  async create(data: CreatePrestamoDto): Promise<PrestamoResponse> {
    const { clienteId, ...prestamoData } = data;
    const cliente = await this.findClienteById(clienteId);
    const prestamo = this.prestamoRepository.create(prestamoData, cliente);
    const savedPrestamo = await this.prestamoRepository.save(prestamo);

    return {
      success: true,
      message: 'Prestamo creado correctamente',
      prestamo: savedPrestamo,
    };
  }

  async update(id: number, data: UpdatePrestamoDto): Promise<PrestamoResponse> {
    const prestamo = await this.findPrestamoById(id);
    const { clienteId, ...prestamoData } = data;
    const cliente =
      clienteId === undefined
        ? undefined
        : await this.findClienteById(clienteId);

    const updatedPrestamo = this.prestamoRepository.merge(
      prestamo,
      prestamoData,
      cliente,
    );
    const savedPrestamo = await this.prestamoRepository.save(updatedPrestamo);

    return {
      success: true,
      message: 'Prestamo actualizado correctamente',
      prestamo: savedPrestamo,
    };
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const prestamo = await this.findPrestamoById(id);

    await this.prestamoRepository.delete(prestamo);

    return {
      success: true,
      message: 'Prestamo eliminado correctamente',
    };
  }

  private async findPrestamoById(id: number): Promise<Prestamo> {
    const prestamo = await this.prestamoRepository.findById(id);

    if (!prestamo) {
      throw new NotFoundException('Prestamo no encontrado');
    }

    return prestamo;
  }

  private async findClienteById(id: number): Promise<Cliente> {
    const cliente = await this.clienteRepository.findById(id);

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }
}

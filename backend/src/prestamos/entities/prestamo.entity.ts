import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Cliente } from '../../clientes/entities/cliente.entity';
import { Cuota } from '../../cuotas/entities/cuota.entity';

@Entity('prestamos')
export class Prestamo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'cliente_id' })
  clienteId!: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.prestamos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  monto!: number;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: string;

  @Column({ name: 'numero_cuotas', type: 'int' })
  numeroCuotas!: number;

  @Column({ length: 30, default: 'ACTIVO' })
  estado!: string;

  @OneToMany(() => Cuota, (cuota) => cuota.prestamo)
  cuotas!: Cuota[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

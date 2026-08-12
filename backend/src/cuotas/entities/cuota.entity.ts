import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Prestamo } from '../../prestamos/entities/prestamo.entity';

export const CUOTA_ESTADOS = ['PENDIENTE', 'PAGADA', 'VENCIDA'] as const;
export type CuotaEstado = (typeof CUOTA_ESTADOS)[number];

@Entity('cuotas')
export class Cuota {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'prestamo_id' })
  prestamoId!: number;

  @ManyToOne(() => Prestamo, (prestamo) => prestamo.cuotas, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'prestamo_id' })
  prestamo!: Prestamo;

  @Column({ name: 'numero_cuota', type: 'int' })
  numeroCuota!: number;

  @Column({ name: 'fecha_vencimiento', type: 'date' })
  fechaVencimiento!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  monto!: number;

  @Column({ name: 'saldo_pendiente', type: 'numeric', precision: 12, scale: 2 })
  saldoPendiente!: number;

  @Column({ length: 30, default: 'PENDIENTE' })
  estado!: CuotaEstado;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

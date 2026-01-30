import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Tenant } from "./Tenant";
import { Location } from "./Location";
import { ProductVariant } from "./ProductVariant";

export enum MovementType {
  STOCK_IN = "stock_in",
  STOCK_OUT = "stock_out",
}

@Entity()
export class StockMovement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @ManyToOne(() => Location, (location) => location.stock_movements, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "branch_id" })
  location: Location;

  @ManyToOne(() => ProductVariant, (variant) => variant.stock_movements, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_variant_id" })
  product_variant: ProductVariant;

  @Column({
    type: "varchar",
    enum: MovementType,
  })
  movement_type: MovementType;

  @Column("int")
  quantity: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  unit_cost_price: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  unit_selling_price: number;

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  reference_id: string; // For linking to Invoice ID in case of stock_out

  @Column("int")
  quantity_before: number;

  @Column("int")
  quantity_after: number;

  @CreateDateColumn()
  created_at: Date;
}


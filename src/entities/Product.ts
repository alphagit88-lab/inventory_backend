import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Tenant } from "./Tenant";
import { ProductVariant } from "./ProductVariant";

@Entity()
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.products, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ nullable: true, unique: false })
  product_code: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  discount: number;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];
}

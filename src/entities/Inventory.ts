import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  JoinColumn,
} from "typeorm";
import { Tenant } from "./Tenant";
import { Location } from "./Location";
import { ProductVariant } from "./ProductVariant";

@Entity()
@Unique(["location", "product_variant"])
export class Inventory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @ManyToOne(() => Location, (location) => location.inventory, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "branch_id" })
  location: Location;

  @ManyToOne(() => ProductVariant, (variant) => variant.inventory, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_variant_id" })
  product_variant: ProductVariant;

  @Column("int")
  quantity: number;

  @Column("decimal", { precision: 10, scale: 2 })
  cost_price: number;

  @Column("decimal", { precision: 10, scale: 2 })
  selling_price: number;
}

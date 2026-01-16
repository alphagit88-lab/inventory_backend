import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Unique,
  JoinColumn,
} from "typeorm";
import { Product } from "./Product";
import { Inventory } from "./Inventory";
import { InvoiceItem } from "./InvoiceItem";
import { StockMovement } from "./StockMovement";

@Entity()
@Unique(["product", "brand", "size"])
export class ProductVariant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_id" })
  product: Product;

  @Column()
  brand: string;

  @Column()
  size: string;

  @OneToMany(() => Inventory, (inventory) => inventory.product_variant)
  inventory: Inventory[];

  @OneToMany(() => InvoiceItem, (item) => item.product_variant)
  invoice_items: InvoiceItem[];

  @OneToMany(() => StockMovement, (movement) => movement.product_variant)
  stock_movements: StockMovement[];
}

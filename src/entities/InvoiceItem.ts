import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Invoice } from "./Invoice";
import { ProductVariant } from "./ProductVariant";

@Entity()
export class InvoiceItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "invoice_id" })
  invoice: Invoice;

  @ManyToOne(() => ProductVariant, (variant) => variant.invoice_items, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "product_variant_id" })
  product_variant: ProductVariant;

  @Column("int")
  quantity: number;

  @Column("decimal", { precision: 10, scale: 2 })
  unit_price: number;

  @Column("decimal", { precision: 10, scale: 2 })
  cost_price: number;

  @Column("decimal", { precision: 10, scale: 2 })
  subtotal: number;
}

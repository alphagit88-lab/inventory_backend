import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Tenant } from "./Tenant";
import { Branch } from "./Branch";
import { InvoiceItem } from "./InvoiceItem";

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @ManyToOne(() => Branch, (branch) => branch.invoices, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "branch_id" })
  branch: Branch;

  @Column({ unique: true })
  invoice_number: string;

  @Column("decimal", { precision: 10, scale: 2 })
  total_amount: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  tax_amount: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  change_amount: number | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => InvoiceItem, (item) => item.invoice)
  items: InvoiceItem[];
}

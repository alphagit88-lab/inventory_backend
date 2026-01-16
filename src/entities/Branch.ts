import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Tenant } from "./Tenant";
import { User } from "./User";
import { Inventory } from "./Inventory";
import { Invoice } from "./Invoice";
import { StockMovement } from "./StockMovement";

@Entity()
export class Branch {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.branches, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => User, (user) => user.branch)
  users: User[];

  @OneToMany(() => Inventory, (inventory) => inventory.branch)
  inventory: Inventory[];

  @OneToMany(() => Invoice, (invoice) => invoice.branch)
  invoices: Invoice[];

  @OneToMany(() => StockMovement, (movement) => movement.branch)
  stock_movements: StockMovement[];
}

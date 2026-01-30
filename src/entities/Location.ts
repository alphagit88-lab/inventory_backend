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

@Entity("branch") // Keep table name as 'branch' to avoid database migration
export class Location {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.locations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => User, (user) => user.location)
  users: User[];

  @OneToMany(() => Inventory, (inventory) => inventory.location)
  inventory: Inventory[];

  @OneToMany(() => Invoice, (invoice) => invoice.location)
  invoices: Invoice[];

  @OneToMany(() => StockMovement, (movement) => movement.location)
  stock_movements: StockMovement[];
}

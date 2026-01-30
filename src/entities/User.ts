import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Tenant } from "./Tenant";
import { Location } from "./Location";

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  STORE_ADMIN = "store_admin",
  LOCATION_USER = "location_user",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @ManyToOne(() => Location, (location) => location.users, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "branch_id" })
  location: Location;

  @Column({
    type: "varchar",
    enum: UserRole,
  })
  role: UserRole;

  @Column({ unique: true })
  email: string;

  @Column({ type: "text" })
  password_hash: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}

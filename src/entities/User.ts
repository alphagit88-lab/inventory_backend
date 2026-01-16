import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Tenant } from "./Tenant";
import { Branch } from "./Branch";

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  STORE_ADMIN = "store_admin",
  BRANCH_USER = "branch_user",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @ManyToOne(() => Branch, (branch) => branch.users, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "branch_id" })
  branch: Branch;

  @Column({
    type: "varchar",
    enum: UserRole,
  })
  role: UserRole;

  @Column({ unique: true })
  email: string;

  @Column({ type: "text" })
  password_hash: string;
}

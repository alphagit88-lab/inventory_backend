import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { Location } from "./Location";
import { Product } from "./Product";
import { User } from "./User";

export enum SubscriptionStatus {
  TRIAL = "trial",
  ACTIVE = "active",
  SUSPENDED = "suspended",
}

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({
    type: "varchar",
    default: SubscriptionStatus.TRIAL,
    enum: SubscriptionStatus,
  })
  subscription_status: SubscriptionStatus;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Location, (location) => location.tenant)
  locations: Location[];

  @OneToMany(() => Product, (product) => product.tenant)
  products: Product[];

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}

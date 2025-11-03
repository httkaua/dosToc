import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany } from 'typeorm';
 
@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  companyID: number;

  @Column({
    length: 500,
    unique: true,
    nullable: false,
    update: false,
  })
  name: string;

  @Column({
    length: 500,
    unique: true,
    nullable: false,
    update: false,
  })
  nationalDocument: string;

  @Column({
    length: 18,
    unique: true,
    nullable: false,
  })
  phoneNumber: string;

  @Column({
    length: 80,
    unique: true,
    nullable: false,
  })
  email: string;

  @OneToOne(() => User, (user) => user.userID)
  @JoinColumn({ name: 'owner' })
  owner: User;

  @OneToMany(() => User, (user) => user.userID)
  @JoinColumn({ name: 'owner' })
  supervisors: User;

  @OneToMany(() => User, (user) => user.userID)
  @JoinColumn({ name: 'owner' })
  agents: User;

  @OneToMany(() => User, (user) => user.userID)
  @JoinColumn({ name: 'owner' })
  assistants: User;

  //* <FK>
  @Column()
  realEstates: number[];

  @Column()
  zipCode: string;

  @Column()
  street: string;

  @Column()
  streetNumber: string;

  @Column()
  neighborhood: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  country: string;

  //* ENUM
  @Column()
  signPlan: string;

  @Column()
  supervisorPermissions: object;

  @Column()
  agentPermissions: object;

  @Column()
  assistantPermissions: object;

  @Column()
  notificationSettings: object;

  @Column()
  deadlineRespondOption: boolean;

  @Column()
  deadlineDaysToRespond: number;

  @Column()
  maxLeadsPerAgent: number;

  @Column()
  defaultCurrency: string;

  @Column()
  enabled: boolean;
  
}

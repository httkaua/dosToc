import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import type { Permissions as supervisorPermissionsInterface } from './supervisorPermissions.interface';
import type { Permissions as agentPermissionsInterface } from './agentPermissions.interface';
import type { Permissions as assistantPermissionsInterface } from './assistantPermissions.interface';
import type { Settings as notificationSettingsInterface } from './notificationSettings.interface';
 
@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  companyID: number;

  @Column({
    length: 150,
    unique: true,
    nullable: false,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
  })
  name: string;

  @Column({
    length: 50,
    unique: true,
    nullable: false,
  })
  nationalDocument: string;

  @Column({
    length: 16,
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

  @OneToOne(() => User, (user) => user.userID, {
    nullable: false,
  })
  @JoinColumn({ name: 'owner' })
  owner: User;

  @OneToMany(() => User, (user) => user.userID)
  supervisors: User[];

  @OneToMany(() => User, (user) => user.userID)
  agents: User[];

  @OneToMany(() => User, (user) => user.userID)
  assistants: User[];

  @OneToMany(() => RealEstate, (realEstate) => realEstate.realEstateID)
  realEstatesEntity: RealEstate[];

  @Column({
    length: 20,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
    nullable: false,
  })
  zipCode: string;

  @Column({
    length: 100,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
    nullable: false,
  })
  street: string;

  @Column({
    length: 6
  })
  streetNumber: string;

  @Column({
    length: 50,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    }
  })
  complement: string;

  @Column({
    length: 100,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
    nullable: false,
  })
  neighborhood: string;

  @Column({
    length: 100,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
    nullable: false,
  })
  city: string;

  @Column({
    length: 100,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
    nullable: false,
  })
  state: string;

  @Column({
    length: 100,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
    nullable: false,
    default: 'Brazil',
  })
  country: string;

  @Column({
    type: 'enum',
    enum: [
      'FREE',
      'SINGLE',
      'BUSINESS',
    ],
    nullable: false,
    default: 'FREE',
  })
  signPlan: string;

  @Column({
    type: 'json',
    nullable: true
  })
  supervisorPermissions: supervisorPermissionsInterface;

  @Column({
    type: 'json',
    nullable: true
  })
  agentPermissions: agentPermissionsInterface;

  @Column({
    type: 'json',
    nullable: true
  })
  assistantPermissions: assistantPermissionsInterface;

  @Column({
    type: 'json',
    nullable: true
  })
  notificationSettings: notificationSettingsInterface;

  @Column({
    nullable: false,
    default: true,
  })
  deadlineToRespondOption: boolean;

  @Column({
    nullable: false,
    default: 5,
    unsigned: true,
    type: 'smallint',
  })
  deadlineDaysToRespond: number;

  @Column({
    nullable: false,
    default: 150,
    unsigned: true,
    type: 'smallint',
  })
  maxLeadsPerAgent: number;

  @Column({
    nullable: false,
    default: 'BRL',
  })
  defaultCurrency: string;

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;

  @Column({
    nullable: false,
    default: true,
  })
  enabled: boolean;
  
}

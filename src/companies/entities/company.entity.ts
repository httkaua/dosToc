import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm';
import type { Permissions as supervisorPermissionsInterface } from './supervisorPermissions.interface';
import type { Permissions as agentPermissionsInterface } from './agentPermissions.interface';
import type { Permissions as assistantPermissionsInterface } from './assistantPermissions.interface';
import type { Settings as notificationSettingsInterface } from './notificationSettings.interface';
import { Lead } from 'src/leads/entities/lead.entity';
import { PropertyOwner } from 'src/propertyowners/entities/property-owner.entity';
import { Record } from 'src/records/entities/record.entity';
import { Task } from 'src/tasks/entities/task.entity';
 
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

  @OneToOne(() => User, (user) => user.companyOwned, {
    nullable: false,
  })
  @JoinColumn({ name: 'owner' })
  owner: User;

  @OneToMany(() => User, (user) => user.supervisorOf)
  @JoinColumn({ name: 'supervisors' })
  supervisors: User[];

  @OneToMany(() => User, (user) => user.agentOf)
  @JoinColumn({ name: 'agents' })
  agents: User[];

  @OneToMany(() => User, (user) => user.assistantOf)
  @JoinColumn({ name: 'assistants' })
  assistants: User[];

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
    length: 6,
    nullable: true,
  })
  streetNumber: string;

  @Column({
    length: 50,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
    nullable: true,
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
    type: 'enum',
    enum: [
      'CENTRAL',
      'NORTH',
      'NORTHEAST',
      'EAST',
      'SOUTHEAST',
      'SOUTH',
      'SOUTHWEST',
      'WEST',
      'NORTHWEST',
      'UNKNOWN'
    ],
    nullable: false,
    default: 'UNKNOWN',
  })
  cityRegion: string;

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

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;

  @Column({
    nullable: false,
    default: true,
  })
  enabled: boolean;



  @OneToMany(() => User, (user) => user.userCompany, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  userCompanyOf: User[];

  @OneToMany(() => RealEstate, (realEstate) => realEstate.realEstateCompany)
  realEstateCompanyOf: RealEstate[];

  @OneToMany(() => Lead, (lead) => lead.leadCompany)
  leadCompanyOf: Lead[]

  @OneToMany(() => PropertyOwner, (propertyOwner) => propertyOwner.company)
  propertyOwnerCompanyOf: PropertyOwner[]

  @OneToMany(() => Record, (record) => record.recordCompany)
  recordCompanyOf: Record[]

  @OneToMany(() => Task, (task) => task.company)
  taskCompanyOf: Task[]

  
}

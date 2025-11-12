import { Company } from 'src/companies/entities/company.entity';
import { Lead } from 'src/leads/entities/lead.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany, ManyToOne, ManyToMany } from 'typeorm';
 
@Entity()
export class RealEstate {
  @PrimaryGeneratedColumn()
  realEstateID: number;

  @Column({
    unique: true,
    nullable: false,
    update: false,
  })
  easyID: string;

  @Column({
    type: 'enum',
    enum: [
      'HOUSE',
      'LAND',
      'APARTMENT',
      'TOWNHOUSE',
      'SITE',
      'WAREHOUSE',
      'STUDIO/ COMMERCIAL ROOM'
    ],
    nullable: false,
    update: false,
  })
  type: string;

  @Column({
    length: 20,
  })
  condominiumBlock: string;

  @Column({
    length: 20,
  })
  condominiumInternalNumber: string;

  @Column({
    type: 'smallint',
  })
  floor: number;

  @Column({
    type: 'enum',
    enum: [
      'SALE',
      'RENTAL',
      'RENTAL AND SALE'
    ],
    nullable: false,
    default: 'SALE',
  })
  rentalOrSale: string;

  @Column({
    type: 'enum',
    enum: [
      'NEW',
      'USED',
      'IN THE CONSTRUCTION',
      'REFORMED',
      'IN REFORM'
    ],
    nullable: false,
    default: 'USED',
  })
  propertySituation: string;

  @Column({
    type: 'enum',
    enum: [
      'ACTIVE',
      'INACTIVE',
      'SOLD',
      'SUSPENDED',
      'RENTED',
      'EXCHANGED',
      'UNDER OFFER',
      'IN NEGOTIATION'
    ],
    nullable: false,
    default: 'ACTIVE',
  })
  commercialSituation: string;

  @Column({
    length: 500,
    nullable: false,
  })
  description: string;

  @Column({
    type: 'smallint',
  })
  bedrooms: number;

  @Column({
    type: 'smallint',
  })
  livingRooms: number;

  @Column({
    type: 'smallint',
  })
  bathrooms: number;

  @Column({
    type: 'smallint',
  })
  parkingSpaces: number;

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
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
    nullable: false,
  })
  streetNumber: string;

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
    length: 50,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
    nullable: false,
  })
  complement: string;

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
    default: 'BRAZIL',
  })
  country: string;

  @Column('decimal', { precision: 10, scale: 2 })
  landArea: number;

  @Column('decimal', { precision: 10, scale: 2 })
  builtUpArea: number;

  @Column({
    type: 'enum',
    enum: [
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
  face: string;

  @Column("text", { array: true })
  tags: string[];

  @Column("text", {
    array: true,
    nullable: false,
  })
  media: string[];

  @Column({
    nullable: false,
    default: true,
  })
  published: boolean;

  @ManyToOne(() => User, (user) => user.userID, {
    nullable: false,
  })
  @JoinColumn({ name: 'userID' })
  creatorUser: User;

  @ManyToOne(() => Company, (company) => company.companyID, {
    nullable: false,
  })
  @JoinColumn({ name: 'companyID' })
  company: Company;

  @ManyToMany(() => Lead, (lead) => lead.realEstatesInterested)
  interestedLeads: Lead[];

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

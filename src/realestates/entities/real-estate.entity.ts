import { Company } from 'src/companies/entities/company.entity';
import { Lead } from 'src/leads/entities/lead.entity';
import { PropertyOwner } from 'src/propertyowners/entities/property-owner.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany, ManyToOne, ManyToMany } from 'typeorm';
 
@Entity()
export class RealEstate {
  @PrimaryGeneratedColumn()
  realEstateID: number;

  @Column({
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
  propertyType: string;

  @Column({
    length: 20,
    nullable: true,
  })
  condominiumBlock: string;

  @Column({
    length: 20,
    nullable: true,
  })
  condominiumInternalNumber: string;

  @Column({
    type: 'smallint',
    nullable: true,
  })
  condominiumFloor: number;

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
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  saleValue: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  rentalValue: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  assessedValue: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  financingMaxValue: number

  @Column({
    nullable: false,
    default: false
  })
  exchange: boolean

  @Column({
    type: 'enum',
    enum: [
      'BRL',
      'USD',
      'EUR',
      'ARS',
      'PYG'
    ],
    nullable: false,
    default: 'BRL',
  })
  currency: string;

  @Column({
    nullable: false,
    default: true
  })
  financeable: boolean

  @Column({
    nullable: false,
    default: false
  })
  includesTax: boolean

  @Column({
    type: 'enum',
    enum: [
      'MONTHLY',
      'ANNUAL',
    ],
    default: 'MONTHLY',
    nullable: true,
  })
  taxFrequency: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  taxValue: number

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
    nullable: true,
  })
  bedrooms: number;

  @Column({
    type: 'smallint',
    nullable: true,
  })
  livingRooms: number;

  @Column({
    type: 'smallint',
    nullable: true,
  })
  bathrooms: number;

  @Column({
    type: 'smallint',
    nullable: true,
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
    default: 'BRAZIL',
  })
  country: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  landArea: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
  })
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

  @Column("text", {
    array: true,
    nullable: true,
  })
  tags: string[];

  @Column("text", {
    array: true,
    nullable: true,
  })
  media: string[];

  @Column({
    nullable: false,
    default: true,
  })
  published: boolean;

  @ManyToOne(() => User, (user) => user.realEstateCreatorUser, {
    nullable: false,
  })
  @JoinColumn({ name: 'creatorUser' })
  creatorUser: User;

  @ManyToOne(() => Company, (company) => company.realEstateCompanyOf, {
    nullable: false,
  }) 
  @JoinColumn({ name: 'realEstateCompany' })
  realEstateCompany: Company;

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;

  @Column({
    nullable: false,
    default: true,
  })
  enabled: boolean;



  @ManyToOne(() => PropertyOwner, (propertyOwner) => propertyOwner.realEstatesOwning)
  realEstatesOwningOf: PropertyOwner

  @ManyToMany(() => Lead, (lead) => lead.realEstatesInterested)
  interestedLeads: Lead[];

}

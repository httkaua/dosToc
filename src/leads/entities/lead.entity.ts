import { Company } from 'src/companies/entities/company.entity';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
 
@Entity()
export class Lead {
  @PrimaryGeneratedColumn()
  leadID: number;

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
  searchableName: string;

  @Column({
    length: 500,
    unique: true,
    nullable: false,
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

  @Column()
  tags: string[];

  @ManyToMany(() => RealEstate, (realEstate) => realEstate.interestedLeads)
  @JoinTable({
    name: "lead_realestates_interested",
    joinColumn: {
      name: "leadID",
      referencedColumnName: "leadID",
    },
    inverseJoinColumn: {
      name: "realEstateID",
      referencedColumnName: "realEstateID",
    },
  })
  realEstatesInterested: RealEstate[];

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
  })
  propertyTypesInterested: string[];

  @Column()
  citiesInterested: string[];

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  familyIncome: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  inputValue: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  realEstateMaxValue: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  realEstateMaxMonthlyFee: number;

  @Column({
    type: 'enum',
    enum: [
      'UNKNOWN',
      'EMPLOYMENT',
      'AUTONOMOUS',
      'FREELANCER',
      'CIVIL SERVANT',
      'BUSINESS OWNER',
      'RETIRED',
      'MIXED',
      'UNEMPLOYED',
      'OTHERS'
    ],
    nullable: false,
    default: 'UNKNOWN',
  })
  sourceOfIncome: string;

  @Column({
    type: 'enum',
    enum: [
      'NEW',
      'IN CONVERSATION',
      'INTERESTED',
      'SCHEDULED VISIT',
      'FINANCIAL CONSTRAINT',
      'FUTURE CONTACT',
      'DISCARDED'
    ],
    nullable: false,
    default: 'NEW',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: [
      'META ADS',
      'FACEBOOK ORGANIC',
      'INSTAGRAM ORGANIC',
      'WEBSITE "CHAVES NA MÃO"',
      'WEBSITE "IMÓVELWEB"',
      'OTHER WEBSITES',
      'GOOGLE',
      'REFERRAL',
      'WALK-IN',
      'COLD CALL',
      'EVENT OR TRADE SHOW',
      'UNKNOWN FROM INTERNET',
      'OTHER'
    ],
    nullable: false,
    default: 'OTHER',
  })
  sourceOfLead: string;

  @Column({
    length: 1000,
  })
  observations: string;

  @ManyToOne(() => User, (user) => user.userID)
  @JoinColumn({ name: 'attendingUser' })
  attendingUser: User;

  @ManyToOne(() => Company, (company) => company.companyID)
  @JoinColumn({ name: 'companyID' })
  companyID: Company;

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

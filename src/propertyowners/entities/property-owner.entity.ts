import { Company } from 'src/companies/entities/company.entity';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany, ManyToOne, ManyToMany } from 'typeorm';
 
@Entity()
export class PropertyOwner {
  @PrimaryGeneratedColumn()
  propertyOwnerID: number;

  @Column({
    length: 100,
    nullable: false,
  })
  name: string;

  @Column({
    length: 100,
    nullable: false,
  })
  searchableName: string;

  @Column({
    type: 'enum',
    enum: [
      'PERSON PROPERTY OWNER',
      'CONSTRUCTION COMPANY',
      'COMPANY PROPERTY OWNER',
    ],
    nullable: false,
    default: 'PERSON PROPERTY OWNER',
  })
  type: string;

  @Column({
    nullable: false,
    length: 16,
  })
  phoneNumber: string;

  @Column({
    length: 80,
    nullable: false,
  })
  email: string;

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
  sourceOfPropertyOwner: string;

  @ManyToOne(() => Company, (company) => company.companyID, {
    nullable: false,
  })
  @JoinColumn({ name: 'companyID' })
  company: Company;

  @OneToMany(() => RealEstate, (realEstate) => realEstate.realEstateID)
  properties: RealEstate[];

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;

}

import { Company } from 'src/companies/entities/company.entity';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany, ManyToOne, ManyToMany } from 'typeorm';
 
@Entity()
export class PropertyOwner {
  @PrimaryGeneratedColumn()
  propertyOwnerID: number;

  @Column()
  name: string;

  //* ENUM */
  @Column()
  type: string;

  @Column()
  phoneNumber: string;

  @Column()
  email: string;

  @ManyToOne(() => Company, (company) => company.companyID)
  @JoinColumn({ name: 'companyID' })
  company: Company;

  @ManyToMany(() => RealEstate, (realEstate) => realEstate.realEstateID)
  @JoinColumn({ name: 'properties' })
  properties: RealEstate[];

}

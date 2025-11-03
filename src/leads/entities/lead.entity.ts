import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany } from 'typeorm';
 
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

  @Column()
  tags: string[];

  //* <FK>
  @Column()
  realEstateCodeInterested: string

  //* ENUM
  @Column()
  typeInterested: string[];

  @Column()
  cityInterested: string[];

  @Column()
  familyIncome: number;

  @Column()
  inputValue: number;

  @Column()
  realEstateMaxValue: number;

  @Column()
  realEstateMaxMonthlyFee: number;

  //* ENUM
  @Column()
  sourceOfIncome: string;

  //* ENUM
  @Column()
  status: string;

  //* ENUM
  @Column()
  sourceOfLead: string;

  @Column({
    length: 1000,
  })
  observations: string;

  @OneToOne(() => User, (user) => user.userID)
  @JoinColumn({ name: 'attendingUser' })
  attendingUser: User;

  @OneToMany(() => Company, (company) => company.companyID)
  @JoinColumn({ name: 'companyID' })
  companyID: Company;

  @Column()
  enabled: boolean;
  
}

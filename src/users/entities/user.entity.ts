import { Company } from 'src/companies/entities/company.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, ManyToMany, JoinColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userID: number;

  @ManytoOne(() => Company, (company) => company.companyID)
  @JoinColumn({ name: 'companyID' })
  companyID: Company;

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
    length: 100,
    unique: true,
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

  @Column({
    nullable: false,
  })
  password: string;

  @Column()
  profilePhoto: string;

  @Column({
    nullable: false,
  })
  userClassification: number;

  @Column({
    nullable: false,
    update: false,
    default: false,
  })
  isDevUser: boolean;

  @Column({
    nullable: false,
  })
  managers: number[];

  @Column({
    nullable: false,
  })
  underManagement: number[];

  @Column()
  enabled: boolean;
  
}
function ManytoOne(arg0: () => typeof Company, arg1: (company: any) => any): (target: User, propertyKey: "companyID") => void {
  throw new Error('Function not implemented.');
}


import { Company } from 'src/companies/entities/company.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, ManyToMany, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userID: number;

  @ManyToOne(() => Company, (company) => company.companyID)
  @JoinColumn({ name: 'companyID' })
  companyID: Company;

  @Column({
    length: 150,
    unique: true,
    nullable: false,
    update: false,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
  })
  name: string;

  @Column({
    length: 150,
    unique: true,
    nullable: false,
    update: false,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value?.trim(),
    },
  })
  searchableName: string;

  @Column({
    length: 50,
    unique: true,
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

  @Column({
    nullable: false,
    length: 255,
    select: false,
  })
  password: string;

  @Column({
    nullable: true,
  })
  profilePhoto: string;

  @Column({
    nullable: false,
    enum: [1, 2, 3, 4, 5, 6, 7],
    default: 6,
  })
  userClassification: number;

  @Column({
    nullable: false,
    update: false,
    default: false,
  })
  isDevUser: boolean;

  @Column("text", {
    array: true,
    nullable: false,
  })
  managers: number[];

  @Column("text", {
    array: true,
    nullable: false,
  })
  underManagement: number[];

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


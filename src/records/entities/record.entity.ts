import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm';
 
@Entity()
export class Record {
  @PrimaryGeneratedColumn()
  recordID: number;

  @ManyToOne(() => User, (user) => user.userID, {
    nullable: false,
  })
  @JoinColumn({ name: 'userID' })
  userWhoMadeTheAction: User;
  
  @Column({
    nullable: false,
  })
  affectedType: string;

  @Column({
    nullable: false,
  })
  affectedData: string;

  @Column({
    nullable: false,
  })
  affectedPropertie: string;

  @Column({
    type: 'enum',
    enum: [
      'CREATE',
      'UPDATE',
      'DELETE',
      'SOFTDELETE',
      'REMOVE',
      'LOGIN',
      'LOGOUT',
      'OTHER'
    ],
    nullable: false,
  })
  actionType: string;

  @Column({
    type: 'enum',
    enum: [
      'USERS',
      'COMPANIES',
      'REAL-ESTATES',
      'TASKS',
      'LEADS',
      'TEAMS',
      'OTHER'
    ],
    nullable: false,
  })
  category: string;

  @Column({
    nullable: false,
  })
  message: string;

  @ManyToOne(() => Company, (company) => company.companyID, {
    nullable: false,
  })
  @JoinColumn({ name: 'companyID' })
  company: Company;

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;

}

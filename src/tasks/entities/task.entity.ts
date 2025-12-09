import { Company } from 'src/companies/entities/company.entity';
import { Lead } from 'src/leads/entities/lead.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm';
 
@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  taskID: number;

  @ManyToOne(() => User, (user) => user.taskCreatorUserOf, {
    nullable: false,
  })
  @JoinColumn({ name: 'creatorUser' })
  creatorUser: User;

  @ManyToOne(() => User, (user) => user.taskResponsibleUserOf, {
    nullable: false,
  })
  @JoinColumn({ name: 'responsibleUser' })
  responsibleUser: User;

  @ManyToOne(() => Lead, (lead) => lead.taskTargetLeadOf, {
    nullable: true,
  })
  @JoinColumn({ name: 'targetLead' })
  targetLead: Lead;

  @ManyToOne(() => Company, (company) => company.taskCompanyOf, {
    nullable: false,
  })
  @JoinColumn({ name: 'companyID' })
  taskCompany: Company;
  
  @Column({
    type: 'enum',
    enum: [
      'CALL',
      'EMAIL',
      'VISIT IN THE STORE',
      'MESSAGE',
      'OTHER'
    ],
    nullable: false,
    default: 'OTHER',
  })
  taskType: string;

  @Column({
    length: 500,
    nullable: true,
  })
  observations: string;

  @CreateDateColumn({ name: "deadline",
    type: 'timestamp',
    nullable: false
  })
  deadline: Date;

  @Column({
    nullable: false,
    default: false,
  })
  notifyByEmail: boolean;

  @Column({
    type: 'enum',
    enum: [
      'PENDING',
      'COMPLETED',
      'CANCELLED',
      'OVERDUE'
    ],
    nullable: false,
    default: 'PENDING'
  })
  status: string;

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;

}

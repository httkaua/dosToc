import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm';
 
@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  taskID: number;

  @ManyToOne(() => User, (user) => user.userID, {
    nullable: false,
  })
  @JoinColumn({ name: 'userID' })
  creatorUser: User;

  @ManyToOne(() => User, (user) => user.userID, {
    nullable: false,
  })
  @JoinColumn({ name: 'userID' })
  responsibleUser: User;

  @ManyToOne(() => Company, (company) => company.companyID, {
    nullable: false,
  })
  @JoinColumn({ name: 'companyID' })
  company: Company;
  
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
    default: 'Other',
  })
  type: string;

  @Column({
    length: 500,
  })
  observations: string;

  @CreateDateColumn({ name: "deadline",
    type: 'timestamp with local time zone',
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
  })
  status: string;

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;

}

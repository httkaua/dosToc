import { Company } from 'src/companies/entities/company.entity';
import { Lead } from 'src/leads/entities/lead.entity';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { Record } from 'src/records/entities/record.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, ManyToMany, JoinColumn, ManyToOne, OneToOne, JoinTable, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userID: number;

  @ManyToOne(() => Company, (company) => company.userCompanyOf)
  @JoinColumn({ name: 'userCompany' })
  userCompany: Company;

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
  username: string;

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

  @ManyToMany(() => User, (user) => user.underManagement)
  @JoinTable({
    name: "user_managers",
    joinColumn: { name: "userID", referencedColumnName: "userID" },
    inverseJoinColumn: { name: "managerID", referencedColumnName: "userID" }
  })
  managers: User[];

  @ManyToMany(() => User, (user) => user.managers)
  underManagement: User[];

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;

  @Column({
    nullable: false,
    default: true,
  })
  enabled: boolean;



  @OneToOne(() => Company, (company) => company.owner)
  companyOwned: Company;

  @ManyToOne(() => Company, (company) => company.supervisors)
  supervisorOf: Company;

  @ManyToOne(() => Company, (company) => company.agents)
  agentOf: Company;

  @ManyToOne(() => Company, (company) => company.assistants)
  assistantOf: Company;

  @OneToMany(() => RealEstate, (realestate) => realestate.creatorUser)
  realEstateCreatorUser: RealEstate[];

  @OneToMany(() => Lead, (lead) => lead.attendingUser)
  attendingUserOf: Lead[]

  @OneToMany(() => Record, (record) => record.userWhoMadeTheAction)
  userWhoMadeTheActionOf: Record[]

  @OneToMany(() => Task, (task) => task.creatorUser)
  taskCreatorUserOf: Task[]

  @OneToMany(() => Task, (task) => task.responsibleUser)
  taskResponsibleUserOf: Task[]
  
}


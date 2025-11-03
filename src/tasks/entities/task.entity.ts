import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany } from 'typeorm';
 
@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  taskID: number;

  @OneToOne(() => User, (user) => user.userID)
  @JoinColumn({ name: 'userID' })
  creatorUser: User;

  @OneToOne(() => User, (user) => user.userID)
  @JoinColumn({ name: 'userID' })
  responsibleUser: User;

  @OneToOne(() => Company, (company) => company.companyID)
  @JoinColumn({ name: 'companyID' })
  company: Company;
  
  //* ENUM */
  @Column()
  type: string;

  @Column({
    length: 500,
  })
  observations: string;

  @Column()
  deadline: Date;

  @Column()
  notifyByEmail: boolean;

  //* ENUM */
  @Column()
  status: string;

}

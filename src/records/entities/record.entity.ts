import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany } from 'typeorm';
 
@Entity()
export class Record {
  @PrimaryGeneratedColumn()
  recordID: number;

  @OneToOne(() => User, (user) => user.userID)
  @JoinColumn({ name: 'userID' })
  userWhoMadeTheAction: User;
  
  @Column()
  affectedType: string;

  @Column()
  affectedData: string;

  @Column()
  affectedPropertie: string;

  //* ENUM */
  @Column()
  actionType: string;

  //* ENUM */
  @Column()
  category: string;

  @Column()
  message: string;

  @OneToOne(() => Company, (company) => company.companyID)
  @JoinColumn({ name: 'companyID' })
  company: Company;

}

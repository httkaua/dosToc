import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, ForeignKey, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm';
 
@Entity()
export class RealEstate {
  @PrimaryGeneratedColumn()
  realEstateID: number;

  @Column({
    unique: true,
    nullable: false,
  })
  easyID: string;

  //* ENUM */
  @Column()
  type: string;

  @Column()
  condominiumBlock: string;

    @Column()
    condominiumInternalNumber: string;

    @Column()
    floor: number;

    //* ENUM */
    @Column()
    rentalOrSale: string;

    //* ENUM */
    @Column()
    propertySituation: string;

    //* ENUM */
    @Column()
    commercialSituation: string;

    @Column({
        length: 500,
    })
    description: string;

    @Column()
    bedrooms: number;

    @Column()
    livingRooms: number;

    @Column()
    bathrooms: number;

    @Column()
    parkingSpaces: number;

    @Column()
    zipCode: string;

    @Column()
    street: string;

    @Column()
    streetNumber: number;

    @Column()
    neighborhood: string;

    @Column({
        length: 50,
    })
    complement: string;

    //* ENUM */
    @Column()
    region: string;

    @Column()
    city: string;

    @Column()
    state: string;

    @Column()
    country: string;
    

    @Column('decimal', { precision: 10, scale: 2 })
    landArea: number;

    @Column('decimal', { precision: 10, scale: 2 })
    builtUpArea: number;

    //* ENUM
    @Column()
    face: string;

    @Column()
    tags: string[];

    @Column()
    media: string[];

    @Column()
    published: boolean;

    @ManyToOne(() => User, (user) => user.userID)
    @JoinColumn({ name: 'userID' })
    creatorUser: User;

    @ManyToOne(() => Company, (company) => company.companyID)
    @JoinColumn({ name: 'companyID' })
    company: Company;

    @Column()
    enabled: boolean;

}

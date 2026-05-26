import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Paper } from './Paper';
import { Review } from './Review';

export type UserRole = 'author' | 'reviewer' | 'chair';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({
    type: 'simple-enum',
    enum: ['author', 'reviewer', 'chair'],
    default: 'author'
  })
  role!: UserRole;

  @Column({ type: 'simple-array', nullable: true })
  researchKeywords!: string[] | null;

  @Column({ nullable: true })
  affiliation!: string;

  @OneToMany(() => Paper, paper => paper.author)
  papers!: Paper[];

  @OneToMany(() => Review, review => review.reviewer)
  reviews!: Review[];
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Paper } from './Paper';

export type Recommendation = 'accept' | 'minor_revision' | 'major_revision' | 'reject';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  rating!: number | null;

  @Column('text', { nullable: true })
  comment!: string | null;

  @Column({
    type: 'simple-enum',
    enum: ['accept', 'minor_revision', 'major_revision', 'reject'],
    nullable: true
  })
  recommendation!: Recommendation | null;

  @Column({ default: false })
  completed!: boolean;

  @ManyToOne(() => Paper, paper => paper.reviews)
  paper!: Paper;

  @Column()
  paperId!: number;

  @ManyToOne(() => User, user => user.reviews)
  reviewer!: User;

  @Column()
  reviewerId!: number;

  @CreateDateColumn()
  assignedAt!: Date;

  @UpdateDateColumn()
  completedAt!: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { Review } from './Review';

export type PaperStatus = 'submitted' | 'reviewing' | 'reviewed' | 'accepted' | 'rejected' | 'minor_revision' | 'major_revision';
export type FinalDecision = 'accept' | 'minor_revision' | 'major_revision' | 'reject' | null;

@Entity()
export class Paper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('text')
  abstract!: string;

  @Column({ type: 'simple-array' })
  keywords!: string[];

  @Column()
  filePath!: string;

  @Column()
  originalFileName!: string;

  @Column({
    type: 'simple-enum',
    enum: ['submitted', 'reviewing', 'reviewed', 'accepted', 'rejected', 'minor_revision', 'major_revision'],
    default: 'submitted'
  })
  status!: PaperStatus;

  @Column({
    type: 'simple-enum',
    enum: ['accept', 'minor_revision', 'major_revision', 'reject'],
    nullable: true
  })
  finalDecision!: FinalDecision;

  @Column('text', { nullable: true })
  decisionSummary!: string | null;

  @Column({ default: false })
  emailSent!: boolean;

  @ManyToOne(() => User, user => user.papers)
  author!: User;

  @Column()
  authorId!: number;

  @OneToMany(() => Review, review => review.paper)
  reviews!: Review[];

  @CreateDateColumn()
  submittedAt!: Date;
}

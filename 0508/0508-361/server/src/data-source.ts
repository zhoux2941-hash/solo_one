import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Paper } from './entities/Paper';
import { Review } from './entities/Review';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: './data/conference.db',
  synchronize: true,
  logging: false,
  entities: [User, Paper, Review],
  migrations: [],
  subscribers: [],
});

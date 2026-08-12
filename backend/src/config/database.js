import { Sequelize } from 'sequelize';
import 'dotenv/config';

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: process.env.NODE_ENV === 'development' ? false : false,
  dialectOptions: process.env.NODE_ENV === 'production' ? { ssl: { require: true, rejectUnauthorized: false } } : {}
});

import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  verification_token: { type: DataTypes.STRING(64), allowNull: true },
  verification_token_expires: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'users', underscored: true, createdAt: 'created_at', updatedAt: 'updated_at' });

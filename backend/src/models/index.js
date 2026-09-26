import { User }               from './User.js';
import { PasswordResetToken } from './PasswordResetToken.js';
import { Farm }               from './Farm.js';
import { Field }              from './Field.js';
import { Prediction }         from './Prediction.js';
import { Alert }              from './Alert.js';

// Auth
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id' });

// Farm/Field
User.hasMany(Farm,  { foreignKey: 'user_id', as: 'farms',  onDelete: 'CASCADE' });
Farm.belongsTo(User, { foreignKey: 'user_id' });
Farm.hasMany(Field,  { foreignKey: 'farm_id', as: 'fields', onDelete: 'CASCADE' });
Field.belongsTo(Farm, { foreignKey: 'farm_id', as: 'farm' });

// Predictions
User.hasMany(Prediction, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Prediction.belongsTo(User, { foreignKey: 'user_id' });

// Alerts
User.hasMany(Alert, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Alert.belongsTo(User, { foreignKey: 'user_id' });

export { User, PasswordResetToken, Farm, Field, Prediction, Alert };

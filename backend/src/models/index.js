import { User } from './User.js';
import { PasswordResetToken } from './PasswordResetToken.js';
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id' });
export { User, PasswordResetToken };

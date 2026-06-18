import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },
  currency: { type: String, default: 'USD' },
  orgs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
  activeOrg: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.virtual('initials').get(function () {
  return this.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_, obj) => { delete obj.passwordHash; delete obj.__v; return obj; },
});

export default mongoose.model('User', userSchema);

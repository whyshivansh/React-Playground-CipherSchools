import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Schema based on the helping guide [cite: 22-40]
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  mobile: { type: String },
  settings: {
    theme: { 
      type: String, 
      enum: ['light', 'dark'], 
      default: 'light' 
    },
  },
  lastLoggedIn: { type: Date, default: Date.now }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// --- Password Hashing ---
// This function runs before any 'save' operation
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Password Comparison Method ---
// Add a method to the user model to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
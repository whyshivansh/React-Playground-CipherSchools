import jwt from 'jsonwebtoken';
import 'dotenv/config';

// This function creates a signed JWT
const generateToken = (res, userId) => {
  const token = jwt.sign(
    { userId }, // The data we want to store in the token
    process.env.JWT_SECRET, // The secret key from our .env file
    { expiresIn: '30d' } // The token will be valid for 30 days
  );

  // --- Set token in an HTTP-Only Cookie ---
  // This is a secure way to store the token, as it prevents
  // it from being accessed by client-side JavaScript (XSS attacks)
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    sameSite: 'strict', // Prevents CSRF attacks
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  });
};

export default generateToken;

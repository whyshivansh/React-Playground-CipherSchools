import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import 'dotenv/config';

// This middleware function will protect our private routes
const protect = async (req, res, next) => {
  let token;

  // 1. Read the JWT from the 'jwt' cookie
  token = req.cookies.jwt;

  if (token) {
    try {
      // 2. Verify the token using our secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user from the token's ID
      //    and attach the user object (without the password) to the request
      req.user = await User.findById(decoded.userId).select('-password');

      // 4. Call the next middleware or route handler
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };

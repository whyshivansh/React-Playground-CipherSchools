import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
} from '../controllers/userContoller.js';

const router = express.Router();

// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser); // Technically needs to be authenticated, but just clears cookie

// We can add routes for fetching/updating profiles later
// router.get('/profile', getProfile);
// router.put('/profile', updateProfile);

export default router;

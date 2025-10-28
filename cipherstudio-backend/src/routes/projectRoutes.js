import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';

import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- All these routes are protected ---
// We apply the 'protect' middleware first.
// If the user is not logged in, these routes will fail.

router.route('/')
  .get(protect, getProjects)
  .post(protect, createProject);

router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

export default router;
// routes/problem.routes.js
const express = require('express');
const {
  createProblem,
  getProblems,
  getProblemById,
  assignProblem,
  getStats,
} = require('../controllers/problem.controller');
const authMiddleware = require('../middleware/auth.middleware');
const optionalAuthMiddleware = require('../middleware/optionalAuth.middleware');
const rbacMiddleware = require('../middleware/rbac.middlewre');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Citizen routes
router.post(
  '/',
  authMiddleware,
  rbacMiddleware(['citizen']),
  upload.array('images', 5),
  createProblem
);

// All authenticated and unauthenticated users (Public feeds)
router.get('/', optionalAuthMiddleware, getProblems);
router.get('/:id', optionalAuthMiddleware, getProblemById);

// Admin only
router.put('/:id/assign',authMiddleware,rbacMiddleware(['admin']),assignProblem);
router.get('/stats/dashboard',authMiddleware,rbacMiddleware(['admin']),getStats);

module.exports = router;
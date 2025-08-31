const express = require('express');
const {
  createResource,
  getTeamResources,
  getResource,
  updateResource,
  deleteResource,
  toggleLike,
  addComment,
  uploadFileResource,
  createLinkOrNote
} = require('../controllers/resourceController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// All routes are protected
router.use(protect);

// Resource CRUD routes
router.post('/upload', upload.single('file'), uploadFileResource);
router.post('/create', createLinkOrNote);
router.post('/', createResource); // Legacy route
router.get('/team/:teamId', getTeamResources);
router.get('/:id', getResource);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

// Resource interaction routes
router.post('/:id/like', toggleLike);
router.post('/:id/comments', addComment);

module.exports = router;

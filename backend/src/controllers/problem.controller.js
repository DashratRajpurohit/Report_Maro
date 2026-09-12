// controllers/problem.controller.js
const Problem = require('../models/problem.model');
const Project = require('../models/project.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const AuditLog = require('../models/auditlog.model');
const { enqueueClassification } = require('../queue/producer');
const { getCache, setCache } = require('../utils/redisCache');
const { uploadToCloudinary } = require('../utils/cloudinary');

// POST /api/problems - Citizen submits problem
const createProblem = async (req, res, next) => {
  try {
    let { title, description, location, image_urls } = req.body;

    // Handle parsed location if submitted as JSON string in multipart/form-data
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (err) {
        // keep as is
      }
    }

    // Validate required fields
    if (!title || !description || !location || !location.lat || !location.lng || !location.district) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, location (lat, lng, district)',
      });
    }

    // Upload images to Cloudinary (if any)
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path);
        uploadedImages.push(result.secure_url);
      }
    }

    // Create problem
    const problem = await Problem.create({
      title,
      description,
      location,
      image_urls: uploadedImages.length > 0 ? uploadedImages : (image_urls || []),
      submitted_by: req.user.id,
      status: 'submitted',
    });

    // Enqueue for AI processing (Fire and forget)
    await enqueueClassification(problem._id, description);

    // 202 Accepted - Processing in background
    res.status(202).json({
      success: true,
      message: 'Problem submitted successfully. AI is processing it in the background.',
      data: {
        id: problem._id,
        title: problem.title,
        status: problem.status,
        created_at: problem.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 📝 GET /api/problems - List problems with filters
const getProblems = async (req, res, next) => {
  try {
    const { category, district, status, submitted_by, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (district) filter['location.district'] = district;
    if (status) filter.status = status;
    if (submitted_by === 'me') {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Login required to view your reports' });
      }
      filter.submitted_by = req.user.id;
    } else if (submitted_by) {
      filter.submitted_by = submitted_by;
    }

    const problems = await Problem.find(filter)
      .populate('submitted_by', 'full_name email')
      .populate('assigned_university', 'full_name organization')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Problem.countDocuments(filter);

    res.json({
      success: true,
      data: problems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// 📝 GET /api/problems/:id - Get single problem
const getProblemById = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('submitted_by', 'full_name email')
      .populate('assigned_university', 'full_name organization')
      .populate('recommended_universities.university', 'full_name organization university_profile');

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    res.json({ success: true, data: problem });
  } catch (error) {
    next(error);
  }
};

// 📝 PUT /api/problems/:id/assign - Admin assigns to university
const assignProblem = async (req, res, next) => {
  try {
    const { universityId } = req.body;
    const problemId = req.params.id;

    if (!universityId) {
      return res.status(400).json({
        success: false,
        message: 'University ID is required',
      });
    }

    // Find problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Validate status
    if (problem.status !== 'verified') {
      return res.status(409).json({
        success: false,
        message: 'Problem must be verified before assignment',
        currentStatus: problem.status,
      });
    }

    // Validate university exists and has correct role
    const university = await User.findOne({
      _id: universityId,
      role: 'university',
    });
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found',
      });
    }

    // Update problem
    problem.status = 'assigned';
    problem.assigned_university = universityId;
    await problem.save();

    // Create project stub
    const project = await Project.create({
      problem_id: problem._id,
      university_id: universityId,
      status: 'proposed',
    });

    // Audit log
    await AuditLog.create({
      eventType: 'PROBLEM_ASSIGNED',
      payload: { problemId: problem._id, universityId, assignedBy: req.user.id },
      source: 'admin',
    }).catch(err => console.error('AuditLog error:', err.message));

    // Create notification
    await Notification.create({
      userId: universityId,
      message: `New problem assigned: "${problem.title}"`,
      type: 'assignment',
      link: `/problems/${problem._id}`,
    });

    // Emit Socket event (if Socket.io is attached)
    const io = req.app.get('io');
    if (io) {
      io.to(`university_${universityId}`).emit('problem_assigned', {
        problemId: problem._id,
        title: problem.title,
        category: problem.category,
      });
    }

    // Invalidate stats cache
    await setCache('stats:dashboard', null, 0);

    res.json({
      success: true,
      message: 'Problem assigned successfully',
      data: {
        problem,
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 📝 GET /api/problems/stats - Admin dashboard stats (cached 5 min)
const getStats = async (req, res, next) => {
  try {
    const cacheKey = 'stats:dashboard';

    // Check cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        source: 'cache',
        data: cached,
      });
    }

    // Aggregations
    const total = await Problem.countDocuments();
    const byCategory = await Problem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byStatus = await Problem.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byDistrict = await Problem.aggregate([
      { $group: { _id: '$location.district', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const stats = {
      total,
      byCategory,
      byStatus,
      byDistrict,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 5 minutes (300 seconds)
    await setCache(cacheKey, stats, 300);

    res.json({
      success: true,
      source: 'database',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProblem,
  getProblems,
  getProblemById,
  assignProblem,
  getStats,
};
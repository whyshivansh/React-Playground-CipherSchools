import Project from '../model/Project.js';

// --- @desc    Get all projects for the logged-in user
// --- @route   GET /api/projects
// --- @access  Private
const getProjects = async (req, res) => {
  try {
    // req.user._id is available thanks to our 'protect' middleware
    const projects = await Project.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- @desc    Get a single project by ID
// --- @route   GET /api/projects/:id
// --- @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Ensure the project belongs to the user
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- @desc    Create a new project
// --- @route   POST /api/projects
// --- @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, files, settings } = req.body;
    const filesArray = Array.isArray(files)
      ? files
      : isPlainObject(files)
      ? filesObjectToArray(files)
      : [];

    const project = await Project.create({
      name,
      description,
      user: req.user._id,
      files: filesArray,
      settings,
    });

    res.status(201).json(project);
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ message: 'Failed to create project' });
  }
};

// --- @desc    Update a project (This is our "Save" function)
// --- @route   PUT /api/projects/:id
// --- @access  Private
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, files, settings } = req.body;

    const filesArray = Array.isArray(files)
      ? files
      : isPlainObject(files)
      ? filesObjectToArray(files)
      : undefined; // ignore if not provided

    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (settings !== undefined) update.settings = settings;
    if (filesArray !== undefined) update.files = filesArray;

    const project = await Project.findOneAndUpdate(
      { _id: id, user: req.user._id },
      update,
      { new: true }
    );

    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('updateProject error:', err);
    res.status(500).json({ message: 'Failed to update project' });
  }
};

// --- @desc    Delete a project
// --- @route   DELETE /api/projects/:id
// --- @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await project.deleteOne(); // Mongoose v6+
    res.status(200).json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// helpers to normalize files
const filesObjectToArray = (filesObj = {}) =>
  Object.entries(filesObj).map(([path, meta]) =>
    typeof meta === 'string' ? { path, code: meta } : { path, ...(meta || {}) }
  );

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};

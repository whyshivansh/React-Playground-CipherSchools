import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema(
  {
    path: { type: String, required: true }, // e.g. "/src/App.js"
    code: { type: String, default: '' },
    hidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'MyProject' },
    description: { type: String },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Store files as an array (safe for MongoDB)
    files: { type: [FileSchema], default: [] },
    settings: {
      framework: { type: String, default: 'react' },
      autoSave: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
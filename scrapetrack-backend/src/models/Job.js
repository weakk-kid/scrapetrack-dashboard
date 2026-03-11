const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);

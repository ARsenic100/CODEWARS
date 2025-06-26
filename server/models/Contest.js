const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  startTime: Date,
  endTime: Date,
  duration: Number, // in minutes
  status: { type: String, enum: ['live', 'finished'], default: 'live' },
  solves: [
    {
      user: { type: String, enum: ['Aditya', 'Ananya'] },
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      solved: Boolean,
      timestamp: Date
    }
  ],
  winner: { type: String, enum: ['Aditya', 'Ananya', null], default: null }
});

module.exports = mongoose.model('Contest', contestSchema); 
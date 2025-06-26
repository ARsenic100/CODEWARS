const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  company: String,
  question: String,
  link: String,
  level: String,
  solvedByAditya: { type: Boolean, default: false },
  solvedByAnanya: { type: Boolean, default: false },
  winner: { type: String, enum: ['Aditya', 'Ananya', null], default: null }
});

module.exports = mongoose.model('Question', questionSchema); 
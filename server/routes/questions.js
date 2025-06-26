const express = require('express');
const Question = require('../models/Question');
const router = express.Router();

// Get all questions
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get random unsolved questions
router.get('/random', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 1;
    const questions = await Question.aggregate([
      { $match: { solvedByAditya: false, solvedByAnanya: false } },
      { $sample: { size: count } }
    ]);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark/unmark question as solved by Aditya or Ananya
router.patch('/:id/solve', async (req, res) => {
  try {
    const { id } = req.params;
    const { solver, solved } = req.body;
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (solver === 'Aditya') {
      question.solvedByAditya = solved;
    } else if (solver === 'Ananya') {
      question.solvedByAnanya = solved;
    }
    if (!question.solvedByAditya || !question.solvedByAnanya) {
      question.winner = null;
    }
    await question.save();
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new question
router.post('/', async (req, res) => {
  try {
    const { company, question, link, level } = req.body;
    const newQuestion = new Question({
      company,
      question,
      link,
      level,
      solvedByAditya: false,
      solvedByAnanya: false,
      winner: null
    });
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 
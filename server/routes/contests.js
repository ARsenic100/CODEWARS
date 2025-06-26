const express = require('express');
const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Question = require('../models/Question');
const generateContestCode = require('../utils/generateContestCode');
const router = express.Router();

// Create Contest
router.post('/', async (req, res) => {
  try {
    const { numQuestions, duration } = req.body;
    const unsolved = await Question.find({ solvedByAditya: false, solvedByAnanya: false });
    if (unsolved.length < numQuestions) {
      return res.status(400).json({ message: 'Not enough unsolved questions.' });
    }
    const shuffled = unsolved.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numQuestions);
    const code = generateContestCode();
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const contest = new Contest({
      code,
      questions: selected.map(q => q._id),
      startTime,
      endTime,
      duration,
      status: 'live',
      solves: [],
      winner: null
    });
    await contest.save();
    res.json({ code, startTime, endTime, questions: selected, duration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List live contests
router.get('/live', async (req, res) => {
  try {
    const contests = await Contest.find({ status: 'live' }).select('code startTime endTime duration');
    res.json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List past contests
router.get('/past', async (req, res) => {
  try {
    const contests = await Contest.find({ status: 'finished' }).populate('questions');
    res.json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get contest by code
router.get('/:code', async (req, res) => {
  try {
    const contest = await Contest.findOne({ code: req.params.code }).populate('questions');
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark/unmark solve in contest
router.post('/:code/solve', async (req, res) => {
  try {
    const { user, questionId, solved } = req.body;
    const contest = await Contest.findOne({ code: req.params.code });
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    contest.solves = contest.solves.filter(s => !(s.user === user && s.question.toString() === questionId));
    if (solved) {
      contest.solves.push({ user, question: questionId, solved: true, timestamp: new Date() });
    }
    await contest.save();
    // Also update the Question solved status for the user
    if (solved) {
      if (user === 'Aditya') {
        await Question.findByIdAndUpdate(questionId, { solvedByAditya: true });
      } else if (user === 'Ananya') {
        await Question.findByIdAndUpdate(questionId, { solvedByAnanya: true });
      }
    } else {
      if (user === 'Aditya') {
        await Question.findByIdAndUpdate(questionId, { solvedByAditya: false });
      } else if (user === 'Ananya') {
        await Question.findByIdAndUpdate(questionId, { solvedByAnanya: false });
      }
    }
    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cron job to finish contests
setInterval(async () => {
  const now = new Date();
  const liveContests = await Contest.find({ status: 'live', endTime: { $lte: now } });
  for (const contest of liveContests) {
    const adityaPoints = contest.solves.filter(s => s.user === 'Aditya' && s.solved).length;
    const ananyaPoints = contest.solves.filter(s => s.user === 'Ananya' && s.solved).length;
    let winner = null;
    if (adityaPoints > ananyaPoints) winner = 'Aditya';
    else if (ananyaPoints > adityaPoints) winner = 'Ananya';
    else if (adityaPoints === ananyaPoints && adityaPoints > 0) {
      const adityaTimes = contest.solves.filter(s => s.user === 'Aditya' && s.solved).map(s => s.timestamp).sort();
      const ananyaTimes = contest.solves.filter(s => s.user === 'Ananya' && s.solved).map(s => s.timestamp).sort();
      if (adityaTimes[adityaPoints - 1] < ananyaTimes[ananyaPoints - 1]) winner = 'Aditya';
      else winner = 'Ananya';
    }
    contest.status = 'finished';
    contest.winner = winner;
    await contest.save();
  }
}, 10000);

module.exports = router;
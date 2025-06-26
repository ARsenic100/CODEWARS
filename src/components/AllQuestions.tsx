import React, { useState, useEffect } from 'react';
import { getQuestions, solveQuestion, addQuestion, Question } from '../api';

// Fade-in animation

const AllQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  // Add question form state
  const [form, setForm] = useState({
    company: '',
    question: '',
    link: '',
    level: 'Easy',
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const data = await getQuestions();
    setQuestions(data);
  };

  const handleSolve = async (id: string, solver: 'Aditya' | 'Ananya', solved: boolean) => {
    // Optimistic update
    setQuestions((prev) => prev.map(q =>
      q._id === id ? { ...q, [solver === 'Aditya' ? 'solvedByAditya' : 'solvedByAnanya']: solved } : q
    ));
    await solveQuestion(id, solver, solved);
    // Optionally, you can re-fetch or handle errors here
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const newQ = await addQuestion(form);
      setQuestions((prev) => [newQ, ...prev]);
      setForm({ company: '', question: '', link: '', level: 'Easy' });
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Failed to add question');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto p-4">
        <div className="bg-zinc-950/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 min-h-[60vh] p-4 sm:p-8 flex flex-col gap-6 animate-fade-in">
          <h1 className="text-4xl font-extrabold mb-4 text-center drop-shadow-lg bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent tracking-tight z-10">All Questions</h1>
          <form className="mb-6 p-4 bg-white/10 rounded-2xl shadow-xl border border-white/20 flex flex-wrap gap-4 items-end sm:flex-row flex-col transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl z-10 backdrop-blur-xl" onSubmit={handleAddQuestion}>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-blue-200 mb-1">Company</label>
              <input className="border-2 border-transparent focus:border-blue-400 rounded-lg px-3 py-2 bg-black/70 text-white w-full transition-all duration-200 shadow-inner focus:shadow-blue-400/20 outline-none" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required />
            </div>
            <div className="flex-1 min-w-[200px] w-full sm:w-auto">
              <label className="block text-xs font-semibold text-blue-200 mb-1">Question</label>
              <input className="border-2 border-transparent focus:border-pink-400 rounded-lg px-3 py-2 w-full bg-black/70 text-white transition-all duration-200 shadow-inner focus:shadow-pink-400/20 outline-none" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} required />
            </div>
            <div className="flex-1 min-w-[200px] w-full sm:w-auto">
              <label className="block text-xs font-semibold text-blue-200 mb-1">Link</label>
              <input className="border-2 border-transparent focus:border-purple-400 rounded-lg px-3 py-2 w-full bg-black/70 text-white transition-all duration-200 shadow-inner focus:shadow-purple-400/20 outline-none" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} required />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-blue-200 mb-1">Difficulty</label>
              <select className="border-2 border-transparent focus:border-blue-400 rounded-lg px-3 py-2 bg-black/70 text-white w-full transition-all duration-200 shadow-inner focus:shadow-blue-400/20 outline-none" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <button type="submit" className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 hover:shadow-pink-400/30 transition-all duration-200 w-full sm:w-auto z-10" disabled={adding}>
              {adding ? 'Adding...' : 'Add Question'}
            </button>
            {addError && <div className="text-red-400 ml-4 w-full font-semibold">{addError}</div>}
          </form>
          <div className="overflow-x-auto bg-black/40 rounded-2xl shadow-lg border border-white/20">
            <table className="min-w-full text-white text-xs sm:text-sm">
              <thead className="bg-black/60 text-white rounded-t-2xl">
                <tr>
                  <th className="py-3 px-4 text-center font-bold">Company</th>
                  <th className="py-3 px-4 text-center font-bold">Question</th>
                  <th className="py-3 px-4 text-center font-bold">Difficulty</th>
                  <th className="py-3 px-4 text-center font-bold">Aditya</th>
                  <th className="py-3 px-4 text-center font-bold">Ananya</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-center">{q.company}</td>
                    <td className="py-3 px-4 text-center">
                      <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{q.question}</a>
                    </td>
                    <td className="py-3 px-4 text-center">{q.level}</td>
                    <td className="py-3 px-4 text-center">
                      <label className="inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={q.solvedByAditya}
                          onChange={() => handleSolve(q._id, 'Aditya', !q.solvedByAditya)}
                          className="sr-only"
                        />
                        <span className="w-7 h-7 flex items-center justify-center">
                          <svg width="28" height="28" viewBox="0 0 28 28" className="block">
                            <circle
                              cx="14" cy="14" r="12"
                              className="stroke-green-400"
                              strokeWidth="3"
                              fill="none"
                            />
                            {q.solvedByAditya && (
                              <path
                                d="M8 15l4 4 8-9"
                                className="stroke-green-500 transition-all duration-200 origin-left scale-100 opacity-100"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                          </svg>
                        </span>
                      </label>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <label className="inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={q.solvedByAnanya}
                          onChange={() => handleSolve(q._id, 'Ananya', !q.solvedByAnanya)}
                          className="sr-only"
                        />
                        <span className="w-7 h-7 flex items-center justify-center">
                          <svg width="28" height="28" viewBox="0 0 28 28" className="block">
                            <circle
                              cx="14" cy="14" r="12"
                              className="stroke-pink-400"
                              strokeWidth="3"
                              fill="none"
                            />
                            {q.solvedByAnanya && (
                              <path
                                d="M8 15l4 4 8-9"
                                className="stroke-pink-400 transition-all duration-200 origin-left scale-100 opacity-100"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                          </svg>
                        </span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllQuestions; 
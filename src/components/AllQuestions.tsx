import React, { useState, useEffect } from 'react';
import { getQuestions, solveQuestion, addQuestion, Question } from '../api';

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
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">All Questions</h1>
        <form className="mb-6 p-4 bg-gray-800 rounded flex flex-wrap gap-4 items-end sm:flex-row flex-col" onSubmit={handleAddQuestion}>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-200">Company</label>
            <input className="border rounded px-2 py-1 bg-gray-900 text-white w-full" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required />
          </div>
          <div className="flex-1 min-w-[200px] w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-200">Question</label>
            <input className="border rounded px-2 py-1 w-full bg-gray-900 text-white" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} required />
          </div>
          <div className="flex-1 min-w-[200px] w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-200">Link</label>
            <input className="border rounded px-2 py-1 w-full bg-gray-900 text-white" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} required />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-200">Difficulty</label>
            <select className="border rounded px-2 py-1 bg-gray-900 text-white w-full" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto" disabled={adding}>
            {adding ? 'Adding...' : 'Add Question'}
          </button>
          {addError && <div className="text-red-500 ml-4 w-full">{addError}</div>}
        </form>
        <div className="overflow-x-auto bg-gray-800 rounded-lg">
          <table className="min-w-full text-white text-xs sm:text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="py-2 px-2 sm:px-4 text-center">Company</th>
                <th className="py-2 px-2 sm:px-4 text-center">Question</th>
                <th className="py-2 px-2 sm:px-4 text-center">Difficulty</th>
                <th className="py-2 px-2 sm:px-4 text-center">Solved by Aditya</th>
                <th className="py-2 px-2 sm:px-4 text-center">Solved by Ananya</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q._id} className="border-b border-gray-700">
                  <td className="py-2 px-2 sm:px-4 text-center">{q.company}</td>
                  <td className="py-2 px-2 sm:px-4 text-center">
                    <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {q.question}
                    </a>
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center">{q.level}</td>
                  <td className="py-2 px-2 sm:px-4 text-center">
                    <input
                      type="checkbox"
                      checked={q.solvedByAditya}
                      onChange={() => handleSolve(q._id, 'Aditya', !q.solvedByAditya)}
                    />
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center">
                    <input
                      type="checkbox"
                      checked={q.solvedByAnanya}
                      onChange={() => handleSolve(q._id, 'Ananya', !q.solvedByAnanya)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllQuestions; 
import React, { useState } from 'react';
import { getRandomQuestions, Question } from '../api';

const Contest: React.FC = () => {
  const [numQuestions, setNumQuestions] = useState<number>(1);
  const [questions, setQuestions] = useState<Question[]>([]);

  const handleStartContest = async () => {
    const data = await getRandomQuestions(numQuestions);
    setQuestions(data);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Contest</h1>
      <div className="mb-4">
        <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700">
          Number of Questions
        </label>
        <input
          type="number"
          id="numQuestions"
          value={numQuestions}
          onChange={(e) => setNumQuestions(parseInt(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <button
        onClick={handleStartContest}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        Start Contest
      </button>

      {questions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Contest Questions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="py-2 px-4">Company</th>
                  <th className="py-2 px-4">Question</th>
                  <th className="py-2 px-4">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id} className="border-b">
                    <td className="py-2 px-4">{q.company}</td>
                    <td className="py-2 px-4">
                      <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {q.question}
                      </a>
                    </td>
                    <td className="py-2 px-4">{q.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contest; 
import React, { useEffect, useState } from 'react';
import { getPastContests, Contest, getQuestions } from './api';

const LEETCODE_USERS = [
  {
    name: 'Aditya',
    username: 'ARSENIC_O',
    url: 'https://leetcode.com/u/ARSENIC_O/'
  },
  {
    name: 'Ananya',
    username: 'shecodesaswell',
    url: 'https://leetcode.com/u/shecodesaswell/'
  }
];

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function fetchLeetCodeProfile(username: string) {
  const res = await fetch(`${API_URL}/leetcode-profile/${username}`);
  return await res.json();
}

const Profile: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any>({});
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    getPastContests().then(data => {
      setContests(data);
      setLoading(false);
    });
    // Fetch LeetCode profiles
    LEETCODE_USERS.forEach(async (u) => {
      const profile = await fetchLeetCodeProfile(u.username);
      setProfiles((p: any) => ({ ...p, [u.name]: profile }));
    });
    getQuestions().then(setQuestions);
  }, []);

  const adityaWins = contests.filter(c => c.winner === 'Aditya').length;
  const ananyaWins = contests.filter(c => c.winner === 'Ananya').length;
  const ties = contests.filter(c => !c.winner).length;
  const total = contests.length;
  const adityaSolved = questions.filter(q => q.solvedByAditya).length;
  const ananyaSolved = questions.filter(q => q.solvedByAnanya).length;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-gray-800 rounded-lg shadow text-white mt-4 sm:mt-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Head-to-Head</h1>
      <div className="flex flex-col sm:flex-row justify-around mb-8 gap-4">
        {LEETCODE_USERS.map(u => (
          <div key={u.name} className="flex flex-col items-center bg-gray-900 rounded-lg p-4 w-full sm:w-1/2 mb-4 sm:mb-0">
            {profiles[u.name]?.profile?.userAvatar ? (
              <img
                src={profiles[u.name].profile.userAvatar}
                alt={u.name}
                className="w-20 h-20 rounded-full mb-2 border-2 border-blue-400"
              />
            ) : (
              <div className="w-20 h-20 rounded-full mb-2 bg-gray-700 animate-pulse" />
            )}
            <a
              href={u.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-lg text-blue-400 hover:underline mb-1"
            >
              {profiles[u.name]?.username || u.username}
            </a>
            <div className="text-gray-300 text-sm mb-1">{profiles[u.name]?.profile?.realName || ''}</div>
            <div className="text-gray-400 text-xs">{profiles[u.name]?.profile?.countryName || ''}</div>
            <div className="text-gray-400 text-xs">Leetcode Ranking: {profiles[u.name]?.profile?.ranking ?? '—'}</div>
            <div className="mt-2 text-sm text-gray-300">
              Solved: <span className="font-bold text-blue-400">{u.name === 'Aditya' ? adityaSolved : ananyaSolved}</span>
            </div>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-around mb-8 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{adityaWins}</div>
              <div className="text-lg">Aditya Wins</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400">{ties}</div>
              <div className="text-lg">Ties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400">{ananyaWins}</div>
              <div className="text-lg">Ananya Wins</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
            <div className="text-lg">Total CodeWars: <span className="font-bold">{total}</span></div>
          </div>
          <div className="bg-gray-900 rounded p-2 sm:p-4">
            <h2 className="text-lg font-semibold mb-2">Recent Contests</h2>
            <ul className="divide-y divide-gray-700 text-xs sm:text-sm">
              {contests.slice(0, 5).map((c, i) => (
                <li key={c.code} className="py-2 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                  <span className="text-gray-300">{new Date(c.endTime).toLocaleDateString()} - </span>
                  <span className="font-semibold text-blue-400">{c.winner || 'Tie'}</span>
                  <span className="text-sm text-gray-400">Code: {c.code}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile; 
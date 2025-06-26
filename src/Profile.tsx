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
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto p-4">
        <div className="bg-zinc-950/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 min-h-[60vh] p-4 sm:p-8 flex flex-col gap-6 animate-fade-in">
          <h1 className="text-4xl font-extrabold mb-4 text-center drop-shadow-lg bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent tracking-tight z-10">Head-to-Head</h1>
          <div className="flex justify-center mb-6">
            <div className="px-8 py-2 rounded-full bg-black/40 border border-blue-400/40 shadow text-blue-300 font-bold text-lg flex items-center gap-2 backdrop-blur-lg">
              Total CodeWars: <span className="text-white font-extrabold">{total}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-around mb-8 gap-6 sm:gap-8">
            {LEETCODE_USERS.map((u, idx) => (
              <div key={u.name} className="flex flex-col items-center bg-neutral-900/80 rounded-2xl shadow-xl border-2 border-white/30 p-8 w-full sm:w-1/2 transition-transform duration-300 hover:scale-[1.03] hover:shadow-2xl animate-fade-in relative">
                {idx === 1 && <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-3/4 bg-gradient-to-b from-blue-400/30 via-white/10 to-pink-400/30"></div>}
                {profiles[u.name]?.profile?.userAvatar ? (
                  <img
                    src={profiles[u.name].profile.userAvatar}
                    alt={u.name}
                    className="w-20 h-20 rounded-full mb-2 border-2 border-blue-400"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full mb-2 bg-zinc-800 animate-pulse" />
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
                <div className="text-gray-400 text-xs">Leetcode Ranking: {profiles[u.name]?.profile?.ranking ?? '—'}</div>
                <div className="mt-2 text-sm text-gray-300">
                  Solved: <span className="font-bold text-blue-400">{u.name === 'Aditya' ? adityaSolved : ananyaSolved}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-around items-center mb-8 gap-4 sm:gap-8">
            <div className="px-6 py-2 rounded-full bg-black/40 border border-blue-400/40 shadow text-blue-400 font-bold text-xl flex items-center gap-2">
              <span className="text-2xl text-blue-300 font-extrabold">{adityaWins}</span> Aditya Wins
            </div>
            <div className="px-6 py-2 rounded-full bg-black/40 border border-white/20 shadow text-white font-bold text-xl flex items-center gap-2">
              <span className="text-2xl text-white font-extrabold">{ties}</span> Ties
            </div>
            <div className="px-6 py-2 rounded-full bg-black/40 border border-pink-400/40 shadow text-pink-400 font-bold text-xl flex items-center gap-2">
              <span className="text-2xl text-pink-300 font-extrabold">{ananyaWins}</span> Ananya Wins
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 
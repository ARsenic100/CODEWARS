import React, { useState, useEffect, useRef } from 'react';
import {
  createContest,
  getLiveContests,
  getContestByCode,
  solveContestQuestion,
  Contest,
  Question,
  getPastContests,
} from '../api';

const USERS = ['Aditya', 'Ananya'] as const;
type User = typeof USERS[number];

function AnalogClock({ secondsLeft, totalSeconds }: { secondsLeft: number, totalSeconds: number }) {
  const radius = 40;
  const center = 50;
  const handLength = 32;
  const angle = (360 * (secondsLeft / totalSeconds)) - 90; // -90 to start at 12 o'clock
  const rad = (angle * Math.PI) / 180;
  const x = center + handLength * Math.cos(rad);
  const y = center + handLength * Math.sin(rad);
  return (
    <svg
      width={100}
      height={100}
      viewBox="0 0 100 100"
      className="drop-shadow-2xl"
      style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.7))' }}
    >
      {/* Outer glassy ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="url(#clock-glass)"
        stroke="#b3b3b3"
        strokeWidth={4}
        style={{ filter: 'drop-shadow(0 2px 8px #222)' }}
      />
      {/* Inner shadow for depth */}
      <circle
        cx={center}
        cy={center}
        r={radius - 6}
        fill="url(#clock-inner)"
        stroke="#222"
        strokeWidth={1}
        opacity={0.7}
      />
      {/* Clock hand with glow */}
      <line
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        stroke="#4fd1c5"
        strokeWidth={5}
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 8px #4fd1c5)' }}
      />
      {/* Center dot with glow */}
      <circle
        cx={center}
        cy={center}
        r={7}
        fill="#222"
        stroke="#4fd1c5"
        strokeWidth={3}
        style={{ filter: 'drop-shadow(0 0 8px #4fd1c5)' }}
      />
      {/* Gradients */}
      <defs>
        <radialGradient id="clock-glass" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#222" stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id="clock-inner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#444" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#111" stopOpacity="0.9" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const Contests: React.FC = () => {
  const [tab, setTab] = useState<'create' | 'join' | 'past'>('create');
  // Create Contest state
  const [numQuestions, setNumQuestions] = useState(5);
  const [duration, setDuration] = useState(30);
  const [creating, setCreating] = useState(false);
  const [createdContest, setCreatedContest] = useState<Contest | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join Contest state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [liveContests, setLiveContests] = useState<Contest[]>([]);
  const [joinedContest, setJoinedContest] = useState<Contest | null>(null);
  const [selectedUser, setSelectedUser] = useState<User>('Aditya');
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Past Contests state
  const [pastContests, setPastContests] = useState<Contest[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [pastError, setPastError] = useState<string | null>(null);

  // Fetch live contests for join tab
  useEffect(() => {
    if (tab === 'join') {
      getLiveContests().then(setLiveContests);
    }
  }, [tab]);

  // Timer logic for joined contest
  useEffect(() => {
    if (!joinedContest) return;
    const end = new Date(joinedContest.endTime).getTime();
    const update = () => {
      const now = Date.now();
      setTimer(Math.max(0, Math.floor((end - now) / 1000)));
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [joinedContest]);

  // Poll contest status every 5s
  useEffect(() => {
    if (!joinedContest) return;
    const poll = setInterval(async () => {
      const updated = await getContestByCode(joinedContest.code);
      setJoinedContest(updated);
    }, 5000);
    return () => clearInterval(poll);
  }, [joinedContest]);

  // Fetch past contests when tab is selected
  useEffect(() => {
    if (tab === 'past') {
      setLoadingPast(true);
      setPastError(null);
      getPastContests()
        .then((data) => {
          setPastContests(data.sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()));
        })
        .catch(() => setPastError('Failed to load past contests'))
        .finally(() => setLoadingPast(false));
    }
  }, [tab]);

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreatedContest(null);
    try {
      const contest = await createContest(numQuestions, duration);
      setCreatedContest(contest as any);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create contest');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinContest = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setJoinError(null);
    setJoinedContest(null);
    try {
      const contest = await getContestByCode(joinCode.trim().toUpperCase());
      setJoinedContest(contest);
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Contest not found');
    } finally {
      setJoining(false);
    }
  };

  const handleSelectLiveContest = async (code: string) => {
    setJoinCode(code);
    setJoining(true);
    setJoinError(null);
    setJoinedContest(null);
    try {
      const contest = await getContestByCode(code);
      setJoinedContest(contest);
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Contest not found');
    } finally {
      setJoining(false);
    }
  };

  const handleSolve = async (questionId: string, user: User, solved: boolean) => {
    if (!joinedContest || joinedContest.status !== 'live') return;
    // Optimistic update
    setJoinedContest((prev) => {
      if (!prev) return prev;
      const newSolves = prev.solves.filter(s => !(s.user === user && s.question === questionId));
      if (solved) {
        newSolves.push({ user, question: questionId, solved: true, timestamp: new Date().toISOString() });
      }
      return { ...prev, solves: newSolves };
    });
    await solveContestQuestion(joinedContest.code, user, questionId, solved);
    // Optionally, re-fetch contest
    const updated = await getContestByCode(joinedContest.code);
    setJoinedContest(updated);
  };

  // Helper: get solved status for a user/question
  const isSolved = (qId: string, user: User) =>
    joinedContest?.solves.some(s => s.user === user && s.question === qId && s.solved);

  // Helper: get points
  const getPoints = (user: User) =>
    joinedContest?.solves.filter(s => s.user === user && s.solved).length || 0;

  // Helper: get finish time for tie-breaker
  const getFinishTime = (user: User) => {
    const solves = joinedContest?.solves.filter(s => s.user === user && s.solved).map(s => new Date(s.timestamp).getTime()).sort((a, b) => a - b) || [];
    return solves.length > 0 ? new Date(solves[solves.length - 1]).toLocaleTimeString() : '-';
  };

  // Head-to-head stats
  const adityaWins = pastContests.filter(c => c.winner === 'Aditya').length;
  const ananyaWins = pastContests.filter(c => c.winner === 'Ananya').length;

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto p-4">
        <div className="bg-zinc-950/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 min-h-[60vh] p-4 sm:p-8 flex flex-col gap-6 animate-fade-in">
          <div className="flex mb-8 justify-center">
            <div className="flex rounded-2xl bg-black/40 border border-white/20 shadow-lg p-1 gap-1 backdrop-blur-lg">
              <button
                className={`px-6 py-2 rounded-2xl font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${tab === 'create'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-xl scale-105 z-10'
                    : 'bg-black/10 text-gray-200 hover:bg-white/10 hover:text-blue-400'}
                `}
                onClick={() => setTab('create')}
              >
                Create Contest
              </button>
              <button
                className={`px-6 py-2 rounded-2xl font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${tab === 'join'
                    ? 'bg-gradient-to-r from-blue-400 to-pink-500 text-white shadow-xl scale-105 z-10'
                    : 'bg-black/10 text-gray-200 hover:bg-white/10 hover:text-pink-400'}
                `}
                onClick={() => setTab('join')}
              >
                Live Contest Join
              </button>
              <button
                className={`px-6 py-2 rounded-2xl font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${tab === 'past'
                    ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-xl scale-105 z-10'
                    : 'bg-black/10 text-gray-200 hover:bg-white/10 hover:text-blue-400'}
                `}
                onClick={() => setTab('past')}
              >
                Past Contest Results
              </button>
            </div>
          </div>
          {tab === 'create' && (
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 max-w-xl mx-auto animate-fade-in flex flex-col gap-6">
              <h2 className="text-3xl font-extrabold mb-2 text-white drop-shadow-lg">Create Contest</h2>
              <p className="text-gray-400 mb-4 text-base">Set up a new head-to-head contest. Choose the number of questions and the duration.</p>
              <form className="space-y-6 flex flex-col" onSubmit={handleCreateContest}>
                <div>
                  <label className="block mb-1 font-semibold text-gray-200">Number of Questions</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border-none rounded-xl px-4 py-2 bg-black/60 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner transition-all duration-200"
                    value={numQuestions}
                    onChange={e => setNumQuestions(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-200">Time (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border-none rounded-xl px-4 py-2 bg-black/60 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner transition-all duration-200"
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    required
                  />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold text-lg shadow-lg hover:scale-105 hover:shadow-blue-500/40 transition-all duration-200 focus:ring-2 focus:ring-blue-400" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </form>
              {createError && <div className="text-red-400 mt-2 font-semibold">{createError}</div>}
              {createdContest && (
                <div className="mt-6 p-4 bg-neutral-900/80 rounded-2xl shadow-lg border border-white/30">
                  <div className="font-bold mb-2 text-white">Contest Created!</div>
                  <div>Contest Code: <span className="font-mono text-lg text-blue-400">{createdContest.code}</span></div>
                  <div>Start Time: {new Date(createdContest.startTime).toLocaleString()}</div>
                  <div>End Time: {new Date(createdContest.endTime).toLocaleString()}</div>
                  <div>Duration: {createdContest.duration} min</div>
                  <div className="mt-2">
                    <div className="font-semibold text-gray-200">Questions:</div>
                    <ul className="list-disc ml-6">
                      {createdContest.questions.map(q => (
                        <li key={q._id}>
                          <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{q.question}</a> <span className="text-gray-400">({q.level})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'join' && !joinedContest && (
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 max-w-3xl mx-auto animate-fade-in flex flex-col gap-6">
              <h2 className="text-3xl font-extrabold mb-2 text-white drop-shadow-lg">Join Live Contest</h2>
              <p className="text-gray-400 mb-4 text-base">Enter a contest code or select from available live contests below.</p>
              <form className="space-y-6 flex flex-col" onSubmit={handleJoinContest}>
                <div>
                  <label className="block mb-1 font-semibold text-gray-200">Enter Contest Code</label>
                  <input
                    type="text"
                    className="w-full border-none rounded-xl px-4 py-2 bg-black/60 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner transition-all duration-200"
                    placeholder="e.g. ABC123"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold text-lg shadow-lg hover:scale-105 hover:shadow-blue-500/40 transition-all duration-200 focus:ring-2 focus:ring-blue-400" disabled={joining}>
                  {joining ? 'Joining...' : 'Join'}
                </button>
              </form>
              {joinError && <div className="text-red-400 mt-2 font-semibold">{joinError}</div>}
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-gray-200">Or select from available live contests:</h3>
                <div className="overflow-x-auto bg-black/40 rounded-2xl shadow-lg border border-white/20">
                  <table className="min-w-full text-white text-xs sm:text-sm">
                    <thead className="bg-black/60 text-white rounded-t-2xl">
                      <tr>
                        <th className="py-3 px-4 text-center font-bold">Code</th>
                        <th className="py-3 px-4 text-center font-bold">Start</th>
                        <th className="py-3 px-4 text-center font-bold">End</th>
                        <th className="py-3 px-4 text-center font-bold">Duration</th>
                        <th className="py-3 px-4 text-center font-bold">Join</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveContests.map((c) => (
                        <tr key={c.code} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-center font-mono">{c.code}</td>
                          <td className="py-3 px-4 text-center">{new Date(c.startTime).toLocaleTimeString()}</td>
                          <td className="py-3 px-4 text-center">{new Date(c.endTime).toLocaleTimeString()}</td>
                          <td className="py-3 px-4 text-center">{c.duration} min</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow hover:scale-105 hover:shadow-blue-500/40 transition-all duration-200 focus:ring-2 focus:ring-blue-400"
                              onClick={() => handleSelectLiveContest(c.code)}
                            >
                              Join
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {tab === 'join' && joinedContest && (
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 max-w-5xl mx-auto animate-fade-in flex flex-col gap-6">
              <h2 className="text-3xl font-extrabold mb-4 text-white drop-shadow-lg">Live Contest: <span className="font-mono text-blue-400">{joinedContest.code}</span></h2>
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-lg text-gray-200">Time Left:</span>
                  <span className="font-mono text-2xl text-white font-bold">{Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}</span>
                  <AnalogClock secondsLeft={timer} totalSeconds={Math.floor((new Date(joinedContest.endTime).getTime() - new Date(joinedContest.startTime).getTime()) / 1000)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-200 mb-1">Acting as:</label>
                  <select
                    className="border-none rounded-xl px-4 py-2 bg-black/60 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner transition-all duration-200"
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value as User)}
                    disabled={joinedContest.status !== 'live'}
                  >
                    {USERS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <div className="flex gap-4 mt-2">
                    <div className="px-4 py-1 rounded-full bg-black/40 border border-blue-400/40 shadow text-blue-400 font-bold text-base flex items-center gap-2">
                      Aditya Points: <span className="text-white font-extrabold">{getPoints('Aditya')}</span>
                    </div>
                    <div className="px-4 py-1 rounded-full bg-black/40 border border-pink-400/40 shadow text-pink-400 font-bold text-base flex items-center gap-2">
                      Ananya Points: <span className="text-white font-extrabold">{getPoints('Ananya')}</span>
                    </div>
                  </div>
                </div>
              </div>
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
                    {joinedContest.questions.map((q: Question) => (
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
                              checked={isSolved(q._id, 'Aditya')}
                              disabled={joinedContest.status !== 'live' || selectedUser !== 'Aditya'}
                              onChange={() => handleSolve(q._id, 'Aditya', !isSolved(q._id, 'Aditya'))}
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
                                {isSolved(q._id, 'Aditya') && (
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
                              checked={isSolved(q._id, 'Ananya')}
                              disabled={joinedContest.status !== 'live' || selectedUser !== 'Ananya'}
                              onChange={() => handleSolve(q._id, 'Ananya', !isSolved(q._id, 'Ananya'))}
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
                                {isSolved(q._id, 'Ananya') && (
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
              <div className="mt-4">
                {joinedContest.status === 'finished' && (
                  <div className="p-4 bg-neutral-900/80 rounded-2xl shadow-lg border border-white/30">
                    <div className="font-bold text-lg mb-2 text-white">Contest Finished!</div>
                    <div>Winner: <span className="font-semibold text-blue-400">{joinedContest.winner || 'Tie'}</span></div>
                    <div>Aditya Points: {getPoints('Aditya')} (Finish: {getFinishTime('Aditya')})</div>
                    <div>Ananya Points: {getPoints('Ananya')} (Finish: {getFinishTime('Ananya')})</div>
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === 'past' && (
            <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 max-w-5xl mx-auto animate-fade-in flex flex-col gap-6">
              <h2 className="text-3xl font-extrabold mb-4 text-white drop-shadow-lg">Past Contest Results</h2>
              <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:gap-8 items-center justify-center">
                <div className="px-6 py-2 rounded-full bg-black/40 border border-blue-400/40 shadow text-blue-400 font-bold text-lg flex items-center gap-2">
                  Aditya Wins: <span className="text-white font-extrabold">{adityaWins}</span>
                </div>
                <div className="px-6 py-2 rounded-full bg-black/40 border border-pink-400/40 shadow text-pink-400 font-bold text-lg flex items-center gap-2">
                  Ananya Wins: <span className="text-white font-extrabold">{ananyaWins}</span>
                </div>
              </div>
              {loadingPast ? (
                <div className="text-gray-200">Loading...</div>
              ) : pastError ? (
                <div className="text-red-400 font-semibold">{pastError}</div>
              ) : (
                <div className="overflow-x-auto bg-black/40 rounded-2xl shadow-lg border border-white/20">
                  <table className="min-w-full text-white text-xs sm:text-sm">
                    <thead className="bg-black/60 text-white rounded-t-2xl">
                      <tr>
                        <th className="py-3 px-4 text-center font-bold">End Time</th>
                        <th className="py-3 px-4 text-center font-bold">Winner</th>
                        <th className="py-3 px-4 text-center font-bold">Questions</th>
                        <th className="py-3 px-4 text-center font-bold">Aditya Points</th>
                        <th className="py-3 px-4 text-center font-bold">Ananya Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastContests.map((c) => {
                        const adityaPoints = c.solves.filter(s => s.user === 'Aditya' && s.solved).length;
                        const ananyaPoints = c.solves.filter(s => s.user === 'Ananya' && s.solved).length;
                        return (
                          <tr key={c.code} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-center">{new Date(c.endTime).toLocaleString()}</td>
                            <td className="py-3 px-4 text-center font-semibold">
                              <span className={
                                c.winner === 'Aditya' ? 'text-blue-400' : c.winner === 'Ananya' ? 'text-pink-400' : 'text-gray-300'
                              }>
                                {c.winner || 'Tie'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <ul className="list-disc ml-4">
                                {c.questions.map(q => (
                                  <li key={q._id}>
                                    <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{q.question}</a>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-blue-400">{adityaPoints}</td>
                            <td className="py-3 px-4 text-center font-bold text-pink-400">{ananyaPoints}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contests; 
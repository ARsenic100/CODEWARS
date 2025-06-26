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
    <div className="container mx-auto p-4">
      <div className="flex mb-4">
        <button
          className={`px-4 py-2 rounded-l-md ${tab === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => setTab('create')}
        >
          Create Contest
        </button>
        <button
          className={`px-4 py-2 ${tab === 'join' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => setTab('join')}
        >
          Live Contest Join
        </button>
        <button
          className={`px-4 py-2 rounded-r-md ${tab === 'past' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => setTab('past')}
        >
          Past Contest Results
        </button>
      </div>
      {tab === 'create' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2 text-white">Create Contest</h2>
          <form className="max-w-md space-y-4" onSubmit={handleCreateContest}>
            <div>
              <label className="block mb-1 font-medium text-gray-200">Number of Questions</label>
              <input
                type="number"
                min={1}
                className="w-full border rounded px-2 py-1 bg-gray-900 text-white"
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-200">Time (minutes)</label>
              <input
                type="number"
                min={1}
                className="w-full border rounded px-2 py-1 bg-gray-900 text-white"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                required
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
          {createError && <div className="text-red-400 mt-2">{createError}</div>}
          {createdContest && (
            <div className="mt-6 p-4 bg-gray-900 rounded">
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
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2 text-white">Join Live Contest</h2>
          <form className="max-w-md space-y-4" onSubmit={handleJoinContest}>
            <div>
              <label className="block mb-1 font-medium text-gray-200">Enter Contest Code</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 bg-gray-900 text-white"
                placeholder="e.g. ABC123"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={joining}>
              {joining ? 'Joining...' : 'Join'}
            </button>
          </form>
          {joinError && <div className="text-red-400 mt-2">{joinError}</div>}
          <div className="mt-6">
            <h3 className="font-semibold mb-2 text-gray-200">Or select from available live contests:</h3>
            <div className="overflow-x-auto bg-gray-900 rounded-lg">
              <table className="min-w-full text-white">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="py-2 px-4">Code</th>
                    <th className="py-2 px-4">Start</th>
                    <th className="py-2 px-4">End</th>
                    <th className="py-2 px-4">Duration</th>
                    <th className="py-2 px-4">Join</th>
                  </tr>
                </thead>
                <tbody>
                  {liveContests.map((c) => (
                    <tr key={c.code} className="border-b border-gray-700">
                      <td className="py-2 px-4 font-mono">{c.code}</td>
                      <td className="py-2 px-4">{new Date(c.startTime).toLocaleTimeString()}</td>
                      <td className="py-2 px-4">{new Date(c.endTime).toLocaleTimeString()}</td>
                      <td className="py-2 px-4">{c.duration} min</td>
                      <td className="py-2 px-4">
                        <button
                          className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
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
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2 text-white">Live Contest: <span className="font-mono text-blue-400">{joinedContest.code}</span></h2>
          <div className="mb-2 text-gray-200">Time Left: <span className="font-mono text-lg text-white">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span></div>
          <div className="mb-2">
            <label className="mr-2 font-medium text-gray-200">Acting as:</label>
            <select
              className="border rounded px-2 py-1 bg-gray-900 text-white"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value as User)}
              disabled={joinedContest.status !== 'live'}
            >
              {USERS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="mb-4 flex gap-8">
            <div className="font-semibold text-blue-400">Aditya Points: <span className="text-white">{getPoints('Aditya')}</span></div>
            <div className="font-semibold text-pink-400">Ananya Points: <span className="text-white">{getPoints('Ananya')}</span></div>
          </div>
          <div className="overflow-x-auto bg-gray-900 rounded-lg">
            <table className="min-w-full text-white">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="py-2 px-4">Company</th>
                  <th className="py-2 px-4">Question</th>
                  <th className="py-2 px-4">Difficulty</th>
                  <th className="py-2 px-4">Aditya</th>
                  <th className="py-2 px-4">Ananya</th>
                </tr>
              </thead>
              <tbody>
                {joinedContest.questions.map((q: Question) => (
                  <tr key={q._id} className="border-b border-gray-700">
                    <td className="py-2 px-4">{q.company}</td>
                    <td className="py-2 px-4">
                      <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{q.question}</a>
                    </td>
                    <td className="py-2 px-4">{q.level}</td>
                    <td className="py-2 px-4">
                      <input
                        type="checkbox"
                        checked={isSolved(q._id, 'Aditya')}
                        disabled={joinedContest.status !== 'live' || selectedUser !== 'Aditya'}
                        onChange={() => handleSolve(q._id, 'Aditya', !isSolved(q._id, 'Aditya'))}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="checkbox"
                        checked={isSolved(q._id, 'Ananya')}
                        disabled={joinedContest.status !== 'live' || selectedUser !== 'Ananya'}
                        onChange={() => handleSolve(q._id, 'Ananya', !isSolved(q._id, 'Ananya'))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            {joinedContest.status === 'finished' && (
              <div className="p-4 bg-gray-900 rounded">
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
        <div>
          <h2 className="text-xl font-bold mb-2 text-white">Past Contest Results</h2>
          <div className="mb-4 p-4 bg-gray-800 rounded flex gap-8 items-center">
            <div className="font-semibold text-blue-400">Aditya Wins: {adityaWins}</div>
            <div className="font-semibold text-pink-400">Ananya Wins: {ananyaWins}</div>
          </div>
          {loadingPast ? (
            <div className="text-gray-200">Loading...</div>
          ) : pastError ? (
            <div className="text-red-400">{pastError}</div>
          ) : (
            <div className="overflow-x-auto bg-gray-900 rounded-lg">
              <table className="min-w-full text-white">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="py-2 px-4">End Time</th>
                    <th className="py-2 px-4">Winner</th>
                    <th className="py-2 px-4">Questions</th>
                    <th className="py-2 px-4">Aditya Points</th>
                    <th className="py-2 px-4">Ananya Points</th>
                  </tr>
                </thead>
                <tbody>
                  {pastContests.map((c) => {
                    const adityaPoints = c.solves.filter(s => s.user === 'Aditya' && s.solved).length;
                    const ananyaPoints = c.solves.filter(s => s.user === 'Ananya' && s.solved).length;
                    return (
                      <tr key={c.code} className="border-b border-gray-700">
                        <td className="py-2 px-4">{new Date(c.endTime).toLocaleString()}</td>
                        <td className="py-2 px-4 font-semibold text-blue-400">{c.winner || 'Tie'}</td>
                        <td className="py-2 px-4">
                          <ul className="list-disc ml-4">
                            {c.questions.map(q => (
                              <li key={q._id}>
                                <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{q.question}</a>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-2 px-4">{adityaPoints}</td>
                        <td className="py-2 px-4">{ananyaPoints}</td>
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
  );
};

export default Contests; 
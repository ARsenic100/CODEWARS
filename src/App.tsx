import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AllQuestions from './components/AllQuestions';
import Contests from './components/Contests';
import Profile from './Profile';

function App() {
  React.useEffect(() => {
    document.body.classList.add('dark');
    return () => document.body.classList.remove('dark');
  }, []);

  return (
    <Router>
      <div className="bg-gray-900 min-h-screen text-white">
        <nav className="bg-gray-800 shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <Link to="/" className="text-2xl font-bold text-white tracking-wide">
                <span className="bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent">AdiAnaCodeWars</span>
              </Link>
              <div className="flex gap-2">
                <Link
                  to="/"
                  className="px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  All Questions
                </Link>
                <Link
                  to="/contests"
                  className="px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Contests
                </Link>
                <Link
                  to="/profile"
                  className="px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <Routes>
              <Route path="/" element={<AllQuestions />} />
              <Route path="/contests/*" element={<Contests />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </main>
    </div>
    </Router>
  );
}

export default App;

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
          <div className="container mx-auto px-2 sm:px-4">
            <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-2 sm:gap-0">
              <Link to="/" className="text-2xl font-bold text-white tracking-wide mb-2 sm:mb-0">
                <span className="bg-gradient-to-r from-blue-400 via-pink-400 to-blue-400 bg-[length:200%_100%] bg-clip-text text-transparent animate-gradient-x">AdiAnaCodeWars</span>
              </Link>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Link
                  to="/"
                  className="px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors text-center"
                >
                  All Questions
                </Link>
                <Link
                  to="/contests"
                  className="px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors text-center"
                >
                  Contests
                </Link>
                <Link
                  to="/profile"
                  className="px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors text-center"
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="w-full px-0 sm:px-0 py-4 sm:py-8 flex justify-center items-center min-h-[80vh]">
          <div className="w-full bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-2 sm:p-6 transition-transform duration-500 ease-in-out transform hover:scale-[1.01] hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)] animate-fade-in">
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

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFindMatch = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsLoading(true);
    
    // Generate unique player ID for each window/session
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store player info in sessionStorage
    sessionStorage.setItem('playerName', playerName);
    sessionStorage.setItem('playerId', playerId);
    sessionStorage.setItem('sessionId', `session_${Date.now()}`);
    
    console.log('Creating new session:', { playerName, playerId });
    
    // Navigate to matchmaking page
    router.push('/match');
  };

  return (
    <>
      <Head>
        <title>CNP Trading Card Game</title>
        <meta name="description" content="CNP-TCG Online Battle Game" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-slate-700/50 shadow-2xl">
            {/* Logo and title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
                <span className="text-2xl font-bold text-white">🃏</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                CNP-TCG
              </h1>
              <p className="text-slate-400 text-sm">Epic Trading Card Battles</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="playerName" className="block text-slate-300 text-sm font-semibold mb-3">
                  Enter the Battlefield
                </label>
                <div className="relative">
                  <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFindMatch()}
                    placeholder="Your warrior name..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 border border-slate-600/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                    maxLength={20}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>

              <button
                onClick={handleFindMatch}
                disabled={isLoading || !playerName.trim()}
                className="group w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>{isLoading ? 'Searching for opponent...' : 'Find Match'}</span>
                  {isLoading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {!isLoading && <span className="text-lg">⚔️</span>}
                </span>
              </button>

              <button
                onClick={() => {
                  if (!playerName.trim()) {
                    alert('Please enter your name');
                    return;
                  }
                  
                  // Generate unique IDs for test mode
                  const playerId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  const roomId = `test-${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                  
                  sessionStorage.setItem('playerName', playerName);
                  sessionStorage.setItem('playerId', playerId);
                  sessionStorage.setItem('roomId', roomId);
                  sessionStorage.setItem('sessionId', `session_${Date.now()}`);
                  
                  console.log('Creating test session:', { playerName, playerId, roomId });
                  
                  router.push(`/play/${roomId}`);
                }}
                disabled={!playerName.trim()}
                className="group w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>Test Mode</span>
                  <span className="text-lg">🎯</span>
                </span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg"></div>
                <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                  <h3 className="text-slate-300 font-semibold mb-4 text-center">Explore More</h3>
                  <div className="space-y-3">
                    <Link 
                      href="/deck-builder"
                      className="group block w-full py-3 px-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 text-slate-300 text-center rounded-lg hover:from-slate-600/50 hover:to-slate-500/50 hover:text-white transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>🏗️</span>
                        <span>Deck Builder</span>
                      </span>
                    </Link>
                    
                    <Link 
                      href="/rules"
                      className="group block w-full py-3 px-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 text-slate-300 text-center rounded-lg hover:from-slate-600/50 hover:to-slate-500/50 hover:text-white transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span>📖</span>
                        <span>Game Rules</span>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
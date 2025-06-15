import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import io, { Socket } from 'socket.io-client';

export default function Match() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('Connecting to server...');
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    // Get player name from sessionStorage
    const name = sessionStorage.getItem('playerName');
    if (!name) {
      router.push('/');
      return;
    }
    setPlayerName(name);

    // Connect to socket.io server
    const socketInstance = io(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setStatus('Looking for opponent...');
      // Request matchmaking
      const playerId = sessionStorage.getItem('playerId') || Date.now().toString();
      sessionStorage.setItem('playerId', playerId);
      socketInstance.emit('find-match', { playerId, playerName: name });
    });

    socketInstance.on('match-found', (data: { roomId: string; setupData?: any; phase?: string }) => {
      setStatus(`Match found! Starting deck setup...`);
      // Store room data
      sessionStorage.setItem('roomId', data.roomId);
      
      // Redirect to setup flow instead of directly to game
      setTimeout(() => {
        router.push(`/setup/${data.roomId}`);
      }, 1000);
    });

    socketInstance.on('searching-match', () => {
      setStatus('Searching for opponent...');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setStatus('Connection error. Please try again.');
    });

    socketInstance.on('disconnect', () => {
      setStatus('Disconnected from server');
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, [router]);

  const handleCancel = () => {
    if (socket) {
      socket.emit('cancel-matchmaking');
      socket.disconnect();
    }
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Finding Match - CNP-TCG</title>
        <meta name="description" content="Finding opponent for CNP-TCG match" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-white mb-8">
            Finding Match
          </h1>

          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
            </div>
            
            <p className="text-white text-lg mb-2">{status}</p>
            <p className="text-white/60 text-sm">Player: {playerName}</p>
          </div>

          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
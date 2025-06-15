"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import io, { Socket } from 'socket.io-client'
import { useGameSetupStore } from '../../store/gameSetupStore'
import { GameSetupPhase } from '../../types/game-setup'
import DeckInputScreen from '../../components/DeckInputScreen'
import ReikiSelectionScreen from '../../components/ReikiSelectionScreen'
import MulliganScreen from '../../components/MulliganScreen'
import LoadingSpinner from '../../components/LoadingSpinner'

interface SetupData {
  player1: {
    playerId: string
    playerName: string
    isReady: boolean
  }
  player2: {
    playerId: string
    playerName: string
    isReady: boolean
  }
  phase: 'deck_input' | 'reiki_selection' | 'turn_order' | 'initial_hand' | 'mulligan' | 'gauge_placement' | 'game_ready'
  firstPlayerId: string | null
}

export default function GameSetup() {
  const router = useRouter()
  const { roomId } = router.query
  const [socket, setSocket] = useState<Socket | null>(null)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [currentPhase, setCurrentPhase] = useState<string>('deck_input')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialHand, setInitialHand] = useState<any[]>([])

  const {
    resetSetup,
    setCurrentPhase: setStorePhase,
    setError: setStoreError
  } = useGameSetupStore()

  useEffect(() => {
    // Get player info from session storage
    const storedPlayerId = sessionStorage.getItem('playerId')
    const storedPlayerName = sessionStorage.getItem('playerName')
    
    if (!storedPlayerId || !storedPlayerName || !roomId) {
      router.push('/')
      return
    }

    setPlayerId(storedPlayerId)
    setPlayerName(storedPlayerName)

    // Reset setup store
    resetSetup()

    // Connect to socket.io server
    const socketInstance = io(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected successfully')
      setIsConnected(true)
      setError(null)
      // Join the room
      socketInstance.emit('join-room', { roomId, playerId: storedPlayerId })
    })

    // Setup event handlers
    socketInstance.on('deck-setup-started', (data: { setupData: SetupData; phase: string }) => {
      setSetupData(data.setupData)
      setCurrentPhase(data.phase)
      setStorePhase(data.phase as GameSetupPhase)
    })

    socketInstance.on('setup-progress', (data: { phase: string; playersReady: Record<string, boolean> }) => {
      setCurrentPhase(data.phase)
      setStorePhase(data.phase as GameSetupPhase)
    })

    socketInstance.on('decks-submitted', (data: { setupData: SetupData; phase: string }) => {
      console.log('Received decks-submitted event:', data)
      try {
        setSetupData(data.setupData)
        setCurrentPhase(data.phase)
        setStorePhase(data.phase as GameSetupPhase)
        setError(null) // Clear any previous errors
        console.log('Successfully moved to phase:', data.phase)
      } catch (error) {
        console.error('Error handling decks-submitted event:', error)
        setError('Phase transition failed. Please refresh the page.')
      }
    })

    socketInstance.on('reiki-phase-complete', (data: { firstPlayerId: string; setupData: SetupData }) => {
      setSetupData(data.setupData)
      setCurrentPhase('mulligan')
      setStorePhase(GameSetupPhase.MULLIGAN)
      
      // Extract initial hand for current player
      const currentPlayerData = data.setupData.player1.playerId === storedPlayerId 
        ? data.setupData.player1 
        : data.setupData.player2
      
      if ((currentPlayerData as any).initialHand) {
        setInitialHand((currentPlayerData as any).initialHand)
      }
    })

    socketInstance.on('setup-complete', (data: { gameState: any; setupData: SetupData }) => {
      // Setup is complete, redirect to game
      sessionStorage.setItem('gameState', JSON.stringify(data.gameState))
      router.push(`/play/${roomId}`)
    })

    socketInstance.on('error', (data: { message: string }) => {
      console.error('Socket error received:', data)
      setError(data.message)
      setStoreError({
        type: 'network',
        message: data.message,
        phase: currentPhase as GameSetupPhase,
        retryable: true
      })
    })

    socketInstance.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
      setError('Failed to connect to server')
    })

    socketInstance.on('disconnect', (reason: string) => {
      console.warn('Socket disconnected:', reason)
      setIsConnected(false)
      setError('Connection lost')
    })

    socketInstance.on('reconnect', () => {
      console.log('Socket reconnected')
      setIsConnected(true)
      setError(null)
    })

    setSocket(socketInstance)

    // Cleanup
    return () => {
      socketInstance.disconnect()
    }
  }, [roomId, router, resetSetup, setStorePhase, setStoreError, currentPhase])

  const handleDeckInput = () => {
    setCurrentPhase('reiki_selection')
    setStorePhase(GameSetupPhase.REIKI_SELECTION)
  }

  const handleReikiSelection = () => {
    setCurrentPhase('mulligan')
    setStorePhase(GameSetupPhase.MULLIGAN)
  }

  const handleMulligan = () => {
    // Mulligan processing is handled by the backend
    // The setup-complete event will be received when ready
  }

  if (!isConnected) {
    return (
      <>
        <Head>
          <title>Connecting - CNP-TCG</title>
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-white text-lg">Connecting to game...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Error - CNP-TCG</title>
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-500/20 rounded-lg p-6 border border-red-500/30">
              <h2 className="text-xl font-bold text-red-300 mb-2">Connection Error</h2>
              <p className="text-red-200 mb-4">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!setupData || !playerId) {
    return (
      <>
        <Head>
          <title>Loading Setup - CNP-TCG</title>
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-white text-lg">Initializing game setup...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Game Setup - CNP-TCG</title>
        <meta name="description" content="CNP-TCG Game Setup" />
      </Head>

      {currentPhase === 'deck_input' && (
        <DeckInputScreen
          onNext={handleDeckInput}
          playerId={playerId}
          playerName={playerName}
          roomId={roomId as string}
          socket={socket}
        />
      )}

      {currentPhase === 'reiki_selection' && (
        <ReikiSelectionScreen
          onNext={handleReikiSelection}
          playerId={playerId}
          playerName={playerName}
          roomId={roomId as string}
          socket={socket}
        />
      )}

      {currentPhase === 'mulligan' && initialHand.length > 0 && (
        <MulliganScreen
          onNext={handleMulligan}
          playerId={playerId}
          playerName={playerName}
          initialHand={initialHand}
          roomId={roomId as string}
          socket={socket}
        />
      )}

      {currentPhase === 'game_ready' && (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-white text-lg">Game setup complete! Starting game...</p>
          </div>
        </div>
      )}
    </>
  )
}
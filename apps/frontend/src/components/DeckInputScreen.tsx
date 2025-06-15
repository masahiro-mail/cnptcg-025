"use client"

import { useState, useEffect } from 'react'
import { useGameSetupStore } from '../store/gameSetupStore'
import { validateDeck, generateDeckPreview } from '../utils/deck-utils'
import DeckPreviewModal from './DeckPreviewModal'
import LoadingSpinner from './LoadingSpinner'

interface DeckInputScreenProps {
  onNext: () => void
  playerId: string
  playerName: string
  roomId: string
  socket: any
}

export default function DeckInputScreen({ onNext, playerId, playerName, roomId, socket }: DeckInputScreenProps) {
  const {
    deckInput,
    deckValidation,
    deckPreview,
    isLoading,
    showPreview,
    error,
    progress,
    setDeckInput,
    setDeckValidation,
    setDeckPreview,
    setIsLoading,
    setShowPreview,
    setError,
    validateDeck: validateDeckAction
  } = useGameSetupStore()

  const [localDeckId, setLocalDeckId] = useState(deckInput)
  const [submitting, setSubmitting] = useState(false)

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleDeckSubmitted = () => {
      console.log('Deck submitted successfully')
      setSubmitting(false)
      
      // Set a timeout in case the phase transition event is delayed
      setTimeout(() => {
        console.log('Calling onNext after deck submission')
        onNext()
      }, 500) // 500ms delay to ensure server processing
    }

    const handleDeckSubmitError = (data: { message: string; errors?: string[] }) => {
      console.error('Deck submit error:', data)
      setSubmitting(false)
      setError({
        type: 'system',
        message: data.message,
        phase: 'deck_input' as any,
        retryable: true
      })
    }

    const handleConnectionError = (error: any) => {
      console.error('Socket connection error:', error)
      setSubmitting(false)
      setError({
        type: 'network',
        message: 'Connection error occurred. Please check your network and try again.',
        phase: 'deck_input' as any,
        retryable: true
      })
    }

    const handleDisconnect = (reason: string) => {
      console.warn('Socket disconnected:', reason)
      setSubmitting(false)
      setError({
        type: 'network',
        message: 'Lost connection to server. Please refresh the page.',
        phase: 'deck_input' as any,
        retryable: true
      })
    }

    const handleError = (error: any) => {
      console.error('Socket error:', error)
      setSubmitting(false)
      setError({
        type: 'system',
        message: error.message || 'An unexpected error occurred.',
        phase: 'deck_input' as any,
        retryable: true
      })
    }

    socket.on('deck-submitted', handleDeckSubmitted)
    socket.on('deck-submit-error', handleDeckSubmitError)
    socket.on('connect_error', handleConnectionError)
    socket.on('disconnect', handleDisconnect)
    socket.on('error', handleError)

    return () => {
      socket.off('deck-submitted', handleDeckSubmitted)
      socket.off('deck-submit-error', handleDeckSubmitError)
      socket.off('connect_error', handleConnectionError)
      socket.off('disconnect', handleDisconnect)
      socket.off('error', handleError)
    }
  }, [socket, onNext, setError])

  // デッキID入力の処理
  const handleDeckIdChange = (value: string) => {
    setLocalDeckId(value)
    setDeckInput(value)
    
    // 既存の検証結果をクリア
    if (deckValidation) {
      setDeckValidation(null)
    }
    if (error) {
      setError(null)
    }
  }

  // デッキ検証の実行
  const handleValidateDeck = async () => {
    if (!localDeckId.trim()) {
      setError({
        type: 'validation',
        message: 'デッキIDを入力してください',
        phase: 'deck_input' as any,
        retryable: true
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await validateDeckAction(localDeckId.trim())
      
      if (result.isValid && result.deck) {
        // プレビューデータを生成
        const preview = generateDeckPreview(result.deck)
        setDeckPreview(preview)
      }
    } catch (error) {
      setError({
        type: 'system',
        message: 'デッキの検証中にエラーが発生しました',
        phase: 'deck_input' as any,
        retryable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  // プレビュー表示
  const handleShowPreview = () => {
    if (deckPreview) {
      setShowPreview(true)
    }
  }

  // 次の段階へ進む（デッキを送信）
  const handleNext = async () => {
    if (!deckValidation?.isValid || !deckValidation.deck || submitting) {
      console.warn('Cannot submit deck:', { 
        isValid: deckValidation?.isValid, 
        hasDeck: !!deckValidation?.deck, 
        submitting 
      })
      return
    }

    if (!socket) {
      setError({
        type: 'network',
        message: 'Socket connection not available',
        phase: 'deck_input' as any,
        retryable: true
      })
      return
    }

    console.log('Submitting deck:', {
      roomId,
      playerId,
      deckId: localDeckId.trim(),
      cardCount: deckValidation.deck.length
    })

    setSubmitting(true)
    setError(null)

    try {
      // Validate socket connection
      if (!socket.connected) {
        throw new Error('Socket is not connected to server')
      }

      // Submit deck via socket
      socket.emit('submit-deck', {
        roomId,
        playerId,
        deckId: localDeckId.trim(),
        cards: deckValidation.deck
      })

      console.log('Deck submission request sent successfully')
    } catch (error) {
      console.error('Failed to submit deck:', error)
      setSubmitting(false)
      setError({
        type: 'system',
        message: `デッキの送信に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        phase: 'deck_input' as any,
        retryable: true
      })
    }
  }

  // Enterキーでの検証実行
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleValidateDeck()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-slate-700/50 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">🃏</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              デッキ選択
            </h1>
            <p className="text-slate-400 text-sm">
              {playerName}さん、使用するデッキIDを入力してください
            </p>
          </div>

          {/* Progress indicator */}
          {progress && (
            <div className="mb-6 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <div className="text-blue-300 text-sm text-center">
                {progress.message}
                {progress.timeRemaining && (
                  <div className="text-xs mt-1">
                    残り時間: {Math.ceil(progress.timeRemaining / 1000)}秒
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deck ID Input */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="deckId" className="block text-slate-300 text-sm font-semibold mb-3">
                デッキID
              </label>
              <div className="relative">
                <input
                  id="deckId"
                  type="text"
                  value={localDeckId}
                  onChange={(e) => handleDeckIdChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="デッキIDを入力またはペースト..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 border border-slate-600/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                  disabled={isLoading}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            {/* Validation Result */}
            {deckValidation && (
              <div className={`p-4 rounded-lg border ${
                deckValidation.isValid 
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                {deckValidation.isValid ? (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">デッキが有効です</span>
                    </div>
                    <div className="text-sm">
                      カード数: {deckValidation.cardCount}枚
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="font-semibold">デッキエラー</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {deckValidation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                <div className="flex items-center space-x-2 text-red-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm">{error.message}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Validate Button */}
              <button
                onClick={handleValidateDeck}
                disabled={isLoading || !localDeckId.trim()}
                className="group w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>検証中...</span>
                    </>
                  ) : (
                    <>
                      <span>デッキを検証</span>
                      <span className="text-lg">🔍</span>
                    </>
                  )}
                </span>
              </button>

              {/* Preview Button */}
              {deckValidation?.isValid && deckPreview && (
                <button
                  onClick={handleShowPreview}
                  className="group w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <span>デッキをプレビュー</span>
                    <span className="text-lg">👁️</span>
                  </span>
                </button>
              )}

              {/* Next Button */}
              {deckValidation?.isValid && (
                <button
                  onClick={handleNext}
                  disabled={submitting}
                  className="group w-full py-4 px-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-green-500/25 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>デッキを送信中...</span>
                      </>
                    ) : (
                      <>
                        <span>次へ進む</span>
                        <span className="text-lg">➡️</span>
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deck Preview Modal */}
      {showPreview && deckPreview && (
        <DeckPreviewModal
          preview={deckPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
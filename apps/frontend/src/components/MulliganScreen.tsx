"use client"

import { useState, useEffect } from 'react'
import { useGameSetupStore } from '../store/gameSetupStore'
import { UnifiedCard } from '../types/deckbuilder-card'
import DeckBuilderCardComponent from './DeckBuilderCard'
import LoadingSpinner from './LoadingSpinner'

interface MulliganScreenProps {
  onNext: () => void
  playerId: string
  playerName: string
  initialHand: UnifiedCard[]
  roomId?: string
  socket?: any
}

export default function MulliganScreen({ onNext, playerId, playerName, initialHand, roomId, socket }: MulliganScreenProps) {
  const {
    mulliganData,
    isLoading,
    error,
    progress,
    showMulliganConfirm,
    setMulliganData,
    toggleMulliganCard,
    confirmMulligan,
    setShowMulliganConfirm,
    setError,
    getMulliganSelectionCount
  } = useGameSetupStore()

  const [localSelectedCards, setLocalSelectedCards] = useState<number[]>([])
  const [isConfirming, setIsConfirming] = useState(false)

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleMulliganSubmitted = () => {
      setIsConfirming(false)
      onNext()
    }

    const handleMulliganError = (data: { message: string }) => {
      setIsConfirming(false)
      setError({
        type: 'system',
        message: data.message,
        phase: 'mulligan' as any,
        retryable: true
      })
    }

    socket.on('mulligan-submitted', handleMulliganSubmitted)
    socket.on('mulligan-error', handleMulliganError)

    return () => {
      socket.off('mulligan-submitted', handleMulliganSubmitted)
      socket.off('mulligan-error', handleMulliganError)
    }
  }, [socket, onNext, setError])

  // 初期化
  useEffect(() => {
    setMulliganData({
      selectedCards: [],
      isConfirmed: false
    })
    setLocalSelectedCards([])
  }, [setMulliganData])

  // カードの選択/選択解除
  const handleCardClick = (index: number) => {
    if (isLoading || mulliganData.isConfirmed) return

    const newSelected = [...localSelectedCards]
    const selectedIndex = newSelected.indexOf(index)

    if (selectedIndex >= 0) {
      newSelected.splice(selectedIndex, 1)
    } else {
      if (newSelected.length < 5) { // 最大5枚まで選択可能
        newSelected.push(index)
      }
    }

    setLocalSelectedCards(newSelected.sort())
    toggleMulliganCard(index)
  }

  // マリガン確認ダイアログを表示
  const handleConfirmClick = () => {
    if (localSelectedCards.length === 0) {
      // マリガンしない場合
      setIsConfirming(true)
      setError(null)
      
      if (socket && roomId) {
        // Submit empty mulligan (no cards selected)
        socket.emit('submit-mulligan', {
          roomId,
          playerId,
          selectedIndices: []
        })
      } else {
        // Fallback to local progression
        setTimeout(() => {
          confirmMulligan()
          onNext()
        }, 1000)
      }
    } else {
      setShowMulliganConfirm(true)
    }
  }

  // マリガン実行の確定
  const handleConfirmMulligan = () => {
    setShowMulliganConfirm(false)
    setIsConfirming(true)
    setError(null)
    
    if (socket && roomId) {
      // Submit mulligan via socket
      socket.emit('submit-mulligan', {
        roomId,
        playerId,
        selectedIndices: localSelectedCards
      })
    } else {
      // Fallback to local progression (for testing)
      setTimeout(() => {
        confirmMulligan()
        onNext()
      }, 1500)
    }
  }

  // マリガン確認ダイアログのキャンセル
  const handleCancelMulligan = () => {
    setShowMulliganConfirm(false)
  }

  // 全選択/全解除
  const handleSelectAll = () => {
    if (localSelectedCards.length === 5) {
      // 全解除
      setLocalSelectedCards([])
      setMulliganData({
        selectedCards: [],
        isConfirmed: false
      })
    } else {
      // 全選択
      const allIndices = [0, 1, 2, 3, 4]
      setLocalSelectedCards(allIndices)
      setMulliganData({
        selectedCards: allIndices,
        isConfirmed: false
      })
    }
  }

  const selectedCount = localSelectedCards.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">🔄</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            マリガン
          </h1>
          <p className="text-slate-400 text-sm">
            {playerName}さん、手札を交換しますか？（0〜5枚選択可能）
          </p>
        </div>

        {/* Progress indicator */}
        {progress && (
          <div className="mb-6 max-w-md mx-auto w-full">
            <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <div className="text-blue-300 text-sm text-center">
                {progress.message}
                {progress.timeRemaining && (
                  <div className="text-xs mt-1">
                    残り時間: {Math.ceil(progress.timeRemaining / 1000)}秒
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Selection Counter */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <span className="text-slate-300">選択中:</span>
            <div className={`text-2xl font-bold px-4 py-2 rounded-lg border-2 ${
              selectedCount === 0 
                ? 'text-gray-400 border-gray-400 bg-gray-500/20'
                : 'text-blue-400 border-blue-400 bg-blue-500/20'
            }`}>
              {selectedCount}/5枚
            </div>
          </div>
        </div>

        {/* Hand Cards */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center">
              {initialHand.map((card, index) => (
                <div
                  key={`${card.id}-${index}`}
                  className="relative cursor-pointer transform transition-all duration-300 hover:scale-105"
                  onClick={() => handleCardClick(index)}
                >
                  <DeckBuilderCardComponent
                    card={card}
                    isSelected={localSelectedCards.includes(index)}
                    className={`${
                      localSelectedCards.includes(index)
                        ? 'ring-4 ring-blue-400 ring-opacity-75 scale-105'
                        : 'hover:ring-2 hover:ring-blue-300 hover:ring-opacity-50'
                    } transition-all duration-300`}
                  />
                  
                  {/* Selection indicator */}
                  {localSelectedCards.includes(index) && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Card index */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center border border-slate-500 text-xs text-white font-bold">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-md mx-auto w-full space-y-4">
          {/* Select All/Clear Button */}
          <button
            onClick={handleSelectAll}
            disabled={isLoading || mulliganData.isConfirmed}
            className="w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedCount === 5 ? '全て選択解除' : '全て選択'}
          </button>

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

          {/* Confirm Button */}
          <button
            onClick={handleConfirmClick}
            disabled={isLoading || mulliganData.isConfirmed || isConfirming}
            className="group w-full py-4 px-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-green-500/25 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center space-x-2">
              {isConfirming ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>マリガン処理中...</span>
                </>
              ) : (
                <>
                  <span>
                    {selectedCount === 0 ? 'マリガンしない' : `${selectedCount}枚をマリガン`}
                  </span>
                  <span className="text-lg">✓</span>
                </>
              )}
            </span>
          </button>

          {/* Help Text */}
          <div className="text-center text-slate-400 text-sm">
            <p>交換したいカードをタップして選択してください</p>
            <p className="text-xs mt-1">選択したカードはデッキに戻され、同じ枚数を新たにドローします</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showMulliganConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
          
          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">マリガン確認</h3>
              <p className="text-slate-300 mb-6">
                {selectedCount}枚のカードをマリガンしますか？<br />
                <span className="text-sm text-slate-400">
                  選択したカードはデッキに戻され、新しいカードをドローします
                </span>
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelMulligan}
                  className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmMulligan}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all duration-200"
                >
                  マリガン実行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
"use client"

import { useState, useEffect } from 'react'
import { useGameSetupStore } from '../store/gameSetupStore'
import { CardColor } from '../types/deckbuilder-card'
import { validateReikiConfiguration } from '../utils/deck-utils'
import LoadingSpinner from './LoadingSpinner'

interface ReikiSelectionScreenProps {
  onNext: () => void
  playerId: string
  playerName: string
  roomId?: string
  socket?: any
}

export default function ReikiSelectionScreen({ onNext, playerId, playerName, roomId, socket }: ReikiSelectionScreenProps) {
  const {
    reikiConfig,
    isLoading,
    error,
    progress,
    setReikiConfig,
    updateReikiColor,
    canUpdateReikiColor,
    setError,
    canProceedToNextPhase
  } = useGameSetupStore()

  const [isConfirming, setIsConfirming] = useState(false)

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleReikiConfigSubmitted = () => {
      setIsConfirming(false)
      onNext()
    }

    const handleReikiConfigError = (data: { message: string }) => {
      setIsConfirming(false)
      setError({
        type: 'system',
        message: data.message,
        phase: 'reiki_selection' as any,
        retryable: true
      })
    }

    socket.on('reiki-config-submitted', handleReikiConfigSubmitted)
    socket.on('reiki-config-error', handleReikiConfigError)

    return () => {
      socket.off('reiki-config-submitted', handleReikiConfigSubmitted)
      socket.off('reiki-config-error', handleReikiConfigError)
    }
  }, [socket, onNext, setError])

  // REIKI色の情報
  const reikiColors: Array<{
    key: keyof typeof reikiConfig
    name: string
    displayName: string
    bgClass: string
    hoverClass: string
    textClass: string
    borderClass: string
    icon: string
  }> = [
    {
      key: 'blue',
      name: '青',
      displayName: '青（水/CNP）',
      bgClass: 'bg-blue-500',
      hoverClass: 'hover:bg-blue-400',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-400',
      icon: '💧'
    },
    {
      key: 'red',
      name: '赤',
      displayName: '赤（火/カグツチ）',
      bgClass: 'bg-red-500',
      hoverClass: 'hover:bg-red-400',
      textClass: 'text-red-400',
      borderClass: 'border-red-400',
      icon: '🔥'
    },
    {
      key: 'yellow',
      name: '黄',
      displayName: '黄（光/ミッドガン）',
      bgClass: 'bg-yellow-500',
      hoverClass: 'hover:bg-yellow-400',
      textClass: 'text-yellow-400',
      borderClass: 'border-yellow-400',
      icon: '⚡'
    },
    {
      key: 'green',
      name: '緑',
      displayName: '緑（森/メテオラス）',
      bgClass: 'bg-green-500',
      hoverClass: 'hover:bg-green-400',
      textClass: 'text-green-400',
      borderClass: 'border-green-400',
      icon: '🌿'
    }
  ]

  // 色の数を変更
  const handleColorChange = (color: keyof typeof reikiConfig, delta: number) => {
    if (color === 'total') return
    
    if (canUpdateReikiColor(color, delta)) {
      const newCount = reikiConfig[color] + delta
      updateReikiColor(color, newCount)
      
      // エラーをクリア
      if (error) {
        setError(null)
      }
    }
  }

  // 次の段階へ進む
  const handleNext = () => {
    if (!validateReikiConfiguration(reikiConfig)) {
      setError({
        type: 'validation',
        message: 'REIKI構成が無効です。合計15枚になるように調整してください。',
        phase: 'reiki_selection' as any,
        retryable: true
      })
      return
    }

    setIsConfirming(true)
    setError(null)

    if (socket && roomId) {
      // Submit REIKI configuration via socket
      socket.emit('submit-reiki-config', {
        roomId,
        playerId,
        config: reikiConfig
      })
    } else {
      // Fallback to local progression (for testing)
      setTimeout(() => {
        onNext()
      }, 1000)
    }
  }

  // プリセット構成の適用
  const applyPreset = (presetName: string) => {
    const presets = {
      balanced: { blue: 4, red: 4, yellow: 4, green: 3, total: 15 },
      blueHeavy: { blue: 6, red: 3, yellow: 3, green: 3, total: 15 },
      redHeavy: { blue: 3, red: 6, yellow: 3, green: 3, total: 15 },
      yellowHeavy: { blue: 3, red: 3, yellow: 6, green: 3, total: 15 },
      greenHeavy: { blue: 3, red: 3, yellow: 3, green: 6, total: 15 }
    }

    const preset = presets[presetName as keyof typeof presets]
    if (preset) {
      setReikiConfig(preset)
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
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full border border-slate-700/50 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">⚡</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              REIKI構成選択
            </h1>
            <p className="text-slate-400 text-sm">
              {playerName}さん、REIKIカードの色構成を選択してください（合計15枚）
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

          {/* Total Counter */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center space-x-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <span className="text-slate-300">合計:</span>
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg border-2 ${
                reikiConfig.total === 15 
                  ? 'text-green-400 border-green-400 bg-green-500/20'
                  : reikiConfig.total > 15
                    ? 'text-red-400 border-red-400 bg-red-500/20'
                    : 'text-yellow-400 border-yellow-400 bg-yellow-500/20'
              }`}>
                {reikiConfig.total}/15
              </div>
            </div>
          </div>

          {/* REIKI Color Selection */}
          <div className="space-y-6 mb-8">
            {reikiColors.map((color) => (
              <div key={color.key} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full ${color.bgClass} flex items-center justify-center text-2xl shadow-lg`}>
                      {color.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{color.displayName}</h3>
                      <p className="text-slate-400 text-sm">現在: {reikiConfig[color.key]}枚</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Decrease Button */}
                    <button
                      onClick={() => handleColorChange(color.key, -1)}
                      disabled={reikiConfig[color.key] <= 0 || isLoading}
                      className={`w-10 h-10 rounded-full ${color.bgClass} ${color.hoverClass} text-white font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg`}
                    >
                      -
                    </button>
                    
                    {/* Count Display */}
                    <div className={`w-16 h-10 rounded-lg border-2 ${color.borderClass} bg-slate-800/50 flex items-center justify-center`}>
                      <span className={`text-xl font-bold ${color.textClass}`}>
                        {reikiConfig[color.key]}
                      </span>
                    </div>
                    
                    {/* Increase Button */}
                    <button
                      onClick={() => handleColorChange(color.key, 1)}
                      disabled={!canUpdateReikiColor(color.key, 1) || isLoading}
                      className={`w-10 h-10 rounded-full ${color.bgClass} ${color.hoverClass} text-white font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preset Buttons */}
          <div className="mb-6">
            <h3 className="text-slate-300 text-sm font-semibold mb-3">プリセット構成:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <button
                onClick={() => applyPreset('balanced')}
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg text-xs transition-all duration-200"
              >
                バランス (4/4/4/3)
              </button>
              <button
                onClick={() => applyPreset('blueHeavy')}
                className="px-3 py-2 bg-blue-600/30 hover:bg-blue-500/40 text-blue-300 hover:text-white rounded-lg text-xs transition-all duration-200"
              >
                青重視 (6/3/3/3)
              </button>
              <button
                onClick={() => applyPreset('redHeavy')}
                className="px-3 py-2 bg-red-600/30 hover:bg-red-500/40 text-red-300 hover:text-white rounded-lg text-xs transition-all duration-200"
              >
                赤重視 (3/6/3/3)
              </button>
              <button
                onClick={() => applyPreset('yellowHeavy')}
                className="px-3 py-2 bg-yellow-600/30 hover:bg-yellow-500/40 text-yellow-300 hover:text-white rounded-lg text-xs transition-all duration-200"
              >
                黄重視 (3/3/6/3)
              </button>
              <button
                onClick={() => applyPreset('greenHeavy')}
                className="px-3 py-2 bg-green-600/30 hover:bg-green-500/40 text-green-300 hover:text-white rounded-lg text-xs transition-all duration-200"
              >
                緑重視 (3/3/3/6)
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 rounded-lg border border-red-500/30">
              <div className="flex items-center space-x-2 text-red-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm">{error.message}</span>
              </div>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!canProceedToNextPhase() || isLoading || isConfirming}
            className="group w-full py-4 px-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-green-500/25 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center space-x-2">
              {isConfirming ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>REIKI構成を確定中...</span>
                </>
              ) : (
                <>
                  <span>REIKI構成を確定</span>
                  <span className="text-lg">⚡</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
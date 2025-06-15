"use client"

import { useEffect } from 'react'
import { DeckPreview } from '../types/game-setup'
import DeckBuilderCardComponent from './DeckBuilderCard'
import { CardColor } from '../types/deckbuilder-card'

interface DeckPreviewModalProps {
  preview: DeckPreview
  onClose: () => void
}

export default function DeckPreviewModal({ preview, onClose }: DeckPreviewModalProps) {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // コスト分布グラフの最大値
  const maxCostCount = Math.max(...Object.values(preview.costDistribution))

  // 色の日本語名マッピング
  const colorNames: { [key in CardColor]: string } = {
    blue: '青',
    red: '赤',
    yellow: '黄',
    green: '緑',
    purple: '紫'
  }

  // 色のCSSクラス
  const colorClasses: { [key in CardColor]: string } = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            デッキプレビュー
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Statistics Panel */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Basic Stats */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                <h3 className="text-lg font-semibold text-white mb-4">基本情報</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">総カード数:</span>
                    <span className="text-white font-semibold">{preview.totalCards}枚</span>
                  </div>
                </div>
              </div>

              {/* Cost Distribution */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                <h3 className="text-lg font-semibold text-white mb-4">コスト分布</h3>
                <div className="space-y-2">
                  {Object.entries(preview.costDistribution)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([cost, count]) => (
                    <div key={cost} className="flex items-center space-x-3">
                      <span className="text-slate-400 w-8 text-sm">コスト{cost}:</span>
                      <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${(count / maxCostCount) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-sm font-semibold w-8">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Distribution */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                <h3 className="text-lg font-semibold text-white mb-4">色分布</h3>
                <div className="space-y-2">
                  {Object.entries(preview.colorDistribution)
                    .filter(([_, count]) => count > 0)
                    .map(([color, count]) => (
                    <div key={color} className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${colorClasses[color as CardColor]}`}></div>
                      <span className="text-slate-400 text-sm flex-1">
                        {colorNames[color as CardColor]}
                      </span>
                      <span className="text-white text-sm font-semibold">{count}枚</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Type Distribution */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                <h3 className="text-lg font-semibold text-white mb-4">タイプ分布</h3>
                <div className="space-y-2">
                  {Object.entries(preview.typeDistribution).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-slate-400">{type}:</span>
                      <span className="text-white font-semibold">{count}枚</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card List */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                <h3 className="text-lg font-semibold text-white mb-4">
                  カード一覧 ({preview.cards.length}枚)
                </h3>
                
                {/* Card Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {preview.cards
                    .sort((a, b) => {
                      // コスト順、同じコストなら名前順でソート
                      if (a.cost !== b.cost) {
                        return a.cost - b.cost
                      }
                      return a.name.localeCompare(b.name)
                    })
                    .map((card, index) => (
                    <div key={`${card.id}-${index}`} className="relative">
                      <DeckBuilderCardComponent
                        card={card}
                        className="transform hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-700/50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
import React from 'react';
import { Card as CardType } from '@cnp-tcg/common-types';

interface CardActionMenuProps {
  card: CardType | null;
  isVisible: boolean;
  onClose: () => void;
  onTrashCard: () => void;
  onMoveToSupport: () => void;
  onMoveToUnit: () => void;
  onMoveToBase: (baseIndex: number) => void;
}

export default function CardActionMenu({ 
  card, 
  isVisible, 
  onClose, 
  onTrashCard, 
  onMoveToSupport, 
  onMoveToUnit, 
  onMoveToBase 
}: CardActionMenuProps) {
  if (!isVisible || !card) return null;

  const isGrayedOut = card.hasAttacked;
  // const isEventOrSupporter = card?.type === 'EVENT' || card?.type === 'SUPPORTER';
  // const isUnit = card?.type === 'UNIT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Card Display */}
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        {/* Large Card Display */}
        <div className="flex justify-center mb-6">
          <div className="w-48 h-64 bg-gray-700 rounded-lg border-2 border-gray-600 flex flex-col items-center justify-center text-white p-4">
            <div className="text-3xl font-bold mb-3">{card?.cost || 0}</div>
            <div className="text-xl font-semibold mb-3 text-center">{card?.name || 'Unknown'}</div>
            <div className="text-lg mb-2">{card?.type || 'Unknown'}</div>
            <div className="text-lg mb-3">{card?.attribute || 'Unknown'}</div>
            {(card?.bp || card?.attack) && (
              <div className="text-2xl font-bold">{card?.bp || card?.attack}/{card?.sp || card?.defense}</div>
            )}
            {card?.text && (
              <div className="text-sm text-gray-300 mt-3 text-center">{card.text}</div>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg text-lg font-semibold"
          >
            キャンセル
          </button>

          {isGrayedOut && (
            <div className="w-full bg-gray-500 text-gray-300 py-3 px-4 rounded-lg text-lg font-semibold text-center">
              グレーアウト中のカードは移動できません
            </div>
          )}

          <button
            onClick={onTrashCard}
            disabled={isGrayedOut}
            className={`w-full py-3 px-4 rounded-lg text-lg font-semibold ${
              isGrayedOut 
                ? 'bg-gray-500 text-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            トラッシュエリアへ
          </button>

          <button
            onClick={onMoveToSupport}
            disabled={isGrayedOut}
            className={`w-full py-3 px-4 rounded-lg text-lg font-semibold ${
              isGrayedOut 
                ? 'bg-gray-500 text-gray-400 cursor-not-allowed' 
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            サポートエリアへ移動
          </button>

          <button
            onClick={onMoveToUnit}
            disabled={isGrayedOut}
            className={`w-full py-3 px-4 rounded-lg text-lg font-semibold ${
              isGrayedOut 
                ? 'bg-gray-500 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            ユニットエリアへ移動
          </button>

          <div className="space-y-2">
            <div className="text-white text-lg font-semibold text-center">拠点に進軍</div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((baseNum) => (
                <button
                  key={baseNum}
                  onClick={() => onMoveToBase(baseNum - 1)}
                  disabled={isGrayedOut}
                  className={`py-2 px-3 rounded-lg font-semibold ${
                    isGrayedOut 
                      ? 'bg-gray-500 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  拠点{baseNum}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
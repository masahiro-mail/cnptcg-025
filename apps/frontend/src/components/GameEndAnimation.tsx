import React, { useEffect, useState } from 'react';

interface GameEndAnimationProps {
  isVisible: boolean;
  isVictory: boolean;
  onAnimationEnd?: () => void;
  onRematch?: () => void;
  onGoHome?: () => void;
}

export default function GameEndAnimation({ isVisible, isVictory, onAnimationEnd, onRematch, onGoHome }: GameEndAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      // Show buttons after animation plays for 3 seconds
      const buttonTimer = setTimeout(() => {
        setShowButtons(true);
      }, 3000);
      
      return () => clearTimeout(buttonTimer);
    }
  }, [isVisible]);

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-70" />
      
      {/* Animation content */}
      <div className="relative z-10">
        {isVictory ? (
          // Victory Animation
          <div className="text-center">
            <div className="animate-bounce mb-8">
              <div className="text-8xl mb-4">🏆</div>
              <div className="text-6xl font-bold text-yellow-400 animate-pulse mb-4">
                勝利！
              </div>
              <div className="text-2xl text-white">
                おめでとうございます！
              </div>
            </div>
            
            {/* Confetti effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                >
                  🎉
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Defeat Animation
          <div className="text-center">
            <div className="animate-pulse mb-8">
              <div className="text-8xl mb-4">💀</div>
              <div className="text-6xl font-bold text-red-400 mb-4">
                敗北...
              </div>
              <div className="text-2xl text-white">
                次は頑張りましょう
              </div>
            </div>
            
            {/* Rain effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-blue-400 animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 50}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random()}s`
                  }}
                >
                  💧
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        {showButtons && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
            <button
              onClick={() => {
                if (onRematch) onRematch();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              もう一度対戦する
            </button>
            <button
              onClick={() => {
                if (onGoHome) onGoHome();
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { Card as CardType } from '@cnp-tcg/common-types';
import Card from './Card';

interface CardModalProps {
  card: CardType | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CardModal({ card, isOpen, onClose }: CardModalProps) {
  if (!isOpen || !card) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-xl font-bold">{card.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="w-48 h-64 bg-gray-700 rounded-lg border-2 border-gray-600 flex flex-col items-center justify-center text-white p-4">
            <div className="text-2xl font-bold mb-2">{card.cost}</div>
            <div className="text-lg font-semibold mb-2 text-center">{card.name}</div>
            <div className="text-sm mb-2">{card.type}</div>
            <div className="text-sm mb-2">{card.attribute}</div>
            {(card.bp || card.attack) && (
              <div className="text-lg font-bold">{card.bp || card.attack}/{card.sp || card.defense}</div>
            )}
          </div>
        </div>
        
        <div className="text-white text-sm space-y-2">
          <div className="flex justify-between">
            <span>Cost:</span>
            <span>{card.cost}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Type:</span>
            <span>{card.type}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Attribute:</span>
            <span>{card.attribute}</span>
          </div>
          
          {(card.bp || card.attack) && (
            <div className="flex justify-between">
              <span>BP:</span>
              <span>{card.bp || card.attack}</span>
            </div>
          )}
          
          {(card.sp || card.defense) && (
            <div className="flex justify-between">
              <span>SP:</span>
              <span>{card.sp || card.defense}</span>
            </div>
          )}
          
          {card.text && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="text-gray-300 text-xs">{card.text}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
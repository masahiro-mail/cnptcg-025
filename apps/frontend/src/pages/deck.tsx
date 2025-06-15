import { useState, useEffect } from 'react';
import { Card, CardType, Attribute, DeckValidation } from '@cnp-tcg/common-types';
import { validateDeck, allCards } from '@cnp-tcg/card-database';
import Link from 'next/link';
import CardComponent from '@/components/Card';

interface DeckData {
  id: string;
  name: string;
  cards: Card[];
}

export default function DeckBuilder() {
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState('新しいデッキ');
  const [savedDecks, setSavedDecks] = useState<DeckData[]>([]);
  const [filterType, setFilterType] = useState<CardType | 'ALL'>('ALL');
  const [filterAttribute, setFilterAttribute] = useState<Attribute | 'ALL'>('ALL');
  const [validation, setValidation] = useState<DeckValidation>({ valid: false, errors: [] });

  useEffect(() => {
    // Load saved decks from localStorage
    const saved = localStorage.getItem('cnp-tcg-decks');
    if (saved) {
      setSavedDecks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Validate deck whenever it changes
    const deckIds = currentDeck.map(card => card.id);
    setValidation(validateDeck(deckIds));
  }, [currentDeck]);

  const filteredCards = allCards.filter(card => {
    if (filterType !== 'ALL' && card.type !== filterType) return false;
    if (filterAttribute !== 'ALL' && card.attribute !== filterAttribute) return false;
    return true;
  });

  const addCardToDeck = (card: Card) => {
    const cardCount = currentDeck.filter(c => c.id === card.id).length;
    if (cardCount >= 4) {
      alert('同じカードは最大4枚までです');
      return;
    }
    if (currentDeck.length >= 50) {
      alert('デッキは50枚までです');
      return;
    }
    setCurrentDeck([...currentDeck, card]);
  };

  const removeCardFromDeck = (index: number) => {
    setCurrentDeck(currentDeck.filter((_, i) => i !== index));
  };

  const saveDeck = () => {
    if (!validation.valid) {
      alert('デッキが無効です:\n' + validation.errors.join('\n'));
      return;
    }

    const deckId = generateDeckId();
    const newDeck: DeckData = {
      id: deckId,
      name: deckName,
      cards: currentDeck
    };

    const updatedDecks = [...savedDecks, newDeck];
    setSavedDecks(updatedDecks);
    localStorage.setItem('cnp-tcg-decks', JSON.stringify(updatedDecks));
    alert(`デッキを保存しました！\nデッキID: ${deckId}`);
  };

  const loadDeck = (deck: DeckData) => {
    setCurrentDeck(deck.cards);
    setDeckName(deck.name);
  };

  const deleteDeck = (deckId: string) => {
    const updatedDecks = savedDecks.filter(d => d.id !== deckId);
    setSavedDecks(updatedDecks);
    localStorage.setItem('cnp-tcg-decks', JSON.stringify(updatedDecks));
  };

  const generateDeckId = (): string => {
    // Generate 24-char base62 ID
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 24; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  };

  const getDeckStats = () => {
    const stats = {
      total: currentDeck.length,
      units: currentDeck.filter(c => c.type === CardType.UNIT).length,
      events: currentDeck.filter(c => c.type === CardType.EVENT).length,
      supporters: currentDeck.filter(c => c.type === CardType.SUPPORTER).length,
      blue: currentDeck.filter(c => c.attribute === Attribute.BLUE).length,
      red: currentDeck.filter(c => c.attribute === Attribute.RED).length,
      yellow: currentDeck.filter(c => c.attribute === Attribute.YELLOW).length,
      green: currentDeck.filter(c => c.attribute === Attribute.GREEN).length,
    };
    return stats;
  };

  const stats = getDeckStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cnp-dark to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">デッキ構築</h1>
          <Link href="/" className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
            ホームに戻る
          </Link>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Card Pool */}
          <div className="col-span-8 bg-gray-800 rounded-lg p-4">
            <div className="mb-4 flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as CardType | 'ALL')}
                className="px-3 py-1 bg-gray-700 rounded"
              >
                <option value="ALL">全タイプ</option>
                <option value={CardType.UNIT}>ユニット</option>
                <option value={CardType.EVENT}>イベント</option>
                <option value={CardType.SUPPORTER}>サポーター</option>
              </select>
              <select
                value={filterAttribute}
                onChange={(e) => setFilterAttribute(e.target.value as Attribute | 'ALL')}
                className="px-3 py-1 bg-gray-700 rounded"
              >
                <option value="ALL">全属性</option>
                <option value={Attribute.BLUE}>青</option>
                <option value={Attribute.RED}>赤</option>
                <option value={Attribute.YELLOW}>黄</option>
                <option value={Attribute.GREEN}>緑</option>
              </select>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => addCardToDeck(card)}
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  <CardComponent card={card} />
                </div>
              ))}
            </div>
          </div>

          {/* Current Deck */}
          <div className="col-span-4 space-y-4">
            {/* Deck Info */}
            <div className="bg-gray-800 rounded-lg p-4">
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full mb-4 px-3 py-2 bg-gray-700 rounded"
                placeholder="デッキ名"
              />

              <div className="space-y-2 text-sm mb-4">
                <div>合計: {stats.total}/50枚</div>
                <div>ユニット: {stats.units}枚</div>
                <div>イベント: {stats.events}枚</div>
                <div>サポーター: {stats.supporters}枚</div>
                <div className="pt-2 border-t border-gray-700">
                  <span className="text-cnp-blue">青: {stats.blue}</span>{' '}
                  <span className="text-cnp-red">赤: {stats.red}</span>{' '}
                  <span className="text-cnp-yellow">黄: {stats.yellow}</span>{' '}
                  <span className="text-cnp-green">緑: {stats.green}</span>
                </div>
              </div>

              {validation.errors.length > 0 && (
                <div className="mb-4 p-2 bg-red-900/50 rounded text-sm">
                  {validation.errors.map((error, i) => (
                    <div key={i}>{error}</div>
                  ))}
                </div>
              )}

              <button
                onClick={saveDeck}
                disabled={!validation.valid}
                className="w-full py-2 bg-cnp-blue text-white rounded hover:bg-cnp-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                デッキを保存
              </button>
            </div>

            {/* Current Deck Cards */}
            <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-2">現在のデッキ</h3>
              <div className="space-y-1">
                {currentDeck.map((card, index) => (
                  <div
                    key={`deck-${card.id}-${index}`}
                    onClick={() => removeCardFromDeck(index)}
                    className="flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer"
                  >
                    <span className="text-sm">{card.name}</span>
                    <span className="text-xs text-gray-400">クリックで削除</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Decks */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">保存済みデッキ</h3>
              <div className="space-y-2">
                {savedDecks.map((deck) => (
                  <div key={deck.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div>
                      <div className="font-medium">{deck.name}</div>
                      <div className="text-xs text-gray-400">ID: {deck.id}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadDeck(deck)}
                        className="px-2 py-1 bg-cnp-blue text-white rounded text-sm"
                      >
                        読込
                      </button>
                      <button
                        onClick={() => deleteDeck(deck.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
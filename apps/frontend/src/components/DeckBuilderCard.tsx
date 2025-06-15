"use client"

import { useState } from "react"
import type { DeckBuilderCard } from "../types/deckbuilder-card"

interface DeckBuilderCardComponentProps {
  card: DeckBuilderCard
  isFaceUp?: boolean
  onClick?: () => void
  className?: string
  deckCount?: number
  isSelected?: boolean
}

export default function DeckBuilderCardComponent({
  card,
  isFaceUp = true,
  onClick,
  className = "",
  deckCount = 0,
  isSelected = false,
}: DeckBuilderCardComponentProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  // カードの色に基づいて背景色を設定
  const getCardColorClass = () => {
    switch (card.color) {
      case "blue":
        return "bg-blue-500"
      case "red":
        return "bg-red-500"
      case "yellow":
        return "bg-yellow-500"
      case "green":
        return "bg-green-500"
      case "purple":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  // カードの色に基づいてテキスト色を設定
  const getCardTextColorClass = () => {
    switch (card.color) {
      case "blue":
        return "text-blue-500"
      case "red":
        return "text-red-500"
      case "yellow":
        return "text-yellow-500"
      case "green":
        return "text-green-500"
      case "purple":
        return "text-purple-500"
      default:
        return "text-gray-500"
    }
  }

  // カード名を適切に改行する関数
  const formatCardName = () => {
    const name = card.name

    // 特定のカード名の改行位置を指定
    if (name === "アクアノーヴァの元飼い猫") {
      return (
        <>
          <div>アクアノーヴァの</div>
          <div>元飼い猫</div>
        </>
      )
    }

    if (name === "アクアペンギンの長 ニヴェルト") {
      return (
        <>
          <div>アクアペンギンの長</div>
          <div>ニヴェルト</div>
        </>
      )
    }

    if (name === "式神・リュウグウノツカイ") {
      return (
        <>
          <div>式神・</div>
          <div>リュウグウノツカイ</div>
        </>
      )
    }

    if (name === "サラマンダーのクロヤキ") {
      return (
        <>
          <div>サラマンダーの</div>
          <div>クロヤキ</div>
        </>
      )
    }

    if (name === "オイシノサラマンダー") {
      return (
        <>
          <div>オイシノ</div>
          <div>サラマンダー</div>
        </>
      )
    }

    // 改行しないカード名のリスト
    const noBreakNames = [
      "リーリー",
      "ナルカミ",
      "ルナ",
      "レイラ",
      "オロチ",
      "ヤマタノオロチ",
      "スサノオ",
      "オオクニヌシ",
      "ツクヨミ",
      "アマテラス",
      "イザナギ",
      "イザナミ",
      "メタモル",
      "シナジー",
      "エナジー",
      "ポテンシャル",
      "アビリティ",
      "パワー",
      "グロウ",
      "エボリューション",
      "トランスフォーム",
      "ミューテーション",
      "アクアノーヴァ",
      "アーキペラゴ",
      "ペンギン",
      "モンキー",
      "シャーク",
      "ウィザード",
      "ナイト",
      "アサシン",
      "ローグ",
      "プリースト",
      "パラディン",
      "ドルイド",
      "シャーマン",
      "ウォーロック",
      "ハンター",
      "ウォリアー",
      "メイジ",
      "イレイサー",
      "ガーディアン",
      "ディフェンダー",
      "アタッカー",
      "サポーター",
      "ヒーラー",
      "バッファー",
      "デバッファー",
      "タンク",
      "DPS",
      "CC",
    ]

    // 改行しないカード名
    if (noBreakNames.includes(name)) {
      return <div className="leading-[20px]">{name}</div>
    }

    // 空白があるカード名は空白で分割
    const spaceIndex = name.indexOf(" ")
    if (spaceIndex !== -1) {
      return (
        <>
          <div>{name.substring(0, spaceIndex)}</div>
          <div>{name.substring(spaceIndex + 1)}</div>
        </>
      )
    }

    // 長い名前は適当な位置で分割
    if (name.length > 8 && !noBreakNames.includes(name)) {
      // 名前が非常に長い場合は切り詰める
      if (name.length > 16) {
        return (
          <>
            <div>{name.substring(0, 8)}</div>
            <div>{name.substring(8, 15)}...</div>
          </>
        )
      }

      // 漢字とひらがなの境目を探す
      for (let i = 4; i < name.length - 2; i++) {
        const char = name.charAt(i)
        const nextChar = name.charAt(i + 1)
        // 漢字とひらがなの境目を優先
        if (/[\u4e00-\u9faf]/.test(char) && /[\u3040-\u309f]/.test(nextChar)) {
          return (
            <>
              <div>{name.substring(0, i + 1)}</div>
              <div>{name.substring(i + 1)}</div>
            </>
          )
        }
      }

      // 適切な境目が見つからない場合は単純に半分で分割
      const midpoint = Math.min(Math.ceil(name.length / 2), 8)
      return (
        <>
          <div>{name.substring(0, midpoint)}</div>
          <div>{name.length > 16 ? name.substring(midpoint, 15) + "..." : name.substring(midpoint)}</div>
        </>
      )
    }

    // 短い名前は中央に1行で表示（空の行を追加しない）
    return <div className="leading-[20px]">{name}</div>
  }

  // カードの裏面を表示
  if (!isFaceUp) {
    return (
      <div
        className={`relative w-32 h-44 rounded-lg overflow-hidden shadow-lg transform transition-transform ${className}`}
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-purple-900 flex items-center justify-center">
          <div className="text-white font-bold text-xl">CNP</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative w-32 h-44 rounded-lg overflow-hidden shadow-lg transform transition-transform ${
        onClick ? "hover:scale-105 cursor-pointer" : ""
      } ${isSelected ? "ring-4 ring-blue-400 ring-opacity-75" : ""} ${className}`}
      onClick={onClick}
      style={{
        boxShadow: isSelected 
          ? "0 4px 10px rgba(59, 130, 246, 0.5), 0 0 4px rgba(255, 255, 255, 0.2) inset"
          : "0 4px 10px rgba(0, 0, 0, 0.3), 0 0 4px rgba(255, 255, 255, 0.2) inset",
      }}
    >
      {/* カード背景 - グラデーションを追加 */}
      <div
        className={`absolute inset-0`}
        style={{
          background:
            card.color === "blue"
              ? "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)"
              : card.color === "red"
                ? "linear-gradient(135deg, #b91c1c 0%, #ef4444 50%, #b91c1c 100%)"
                : card.color === "yellow"
                  ? "linear-gradient(135deg, #a16207 0%, #eab308 50%, #a16207 100%)"
                  : card.color === "green"
                    ? "linear-gradient(135deg, #166534 0%, #22c55e 50%, #166534 100%)"
                    : "linear-gradient(135deg, #6b21a8 0%, #a855f7 50%, #6b21a8 100%)",
        }}
      ></div>

      {/* カード背景のテクスチャ */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fillOpacity='1' fillRule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      ></div>

      {/* レイキ表示（左上の円） - 背景はカードの色、文字は白抜き、より洗練された見た目に */}
      <div
        className={`absolute top-1 left-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white`}
        style={{
          background:
            card.color === "blue"
              ? "radial-gradient(circle, #3b82f6 0%, #1e40af 100%)"
              : card.color === "red"
                ? "radial-gradient(circle, #ef4444 0%, #b91c1c 100%)"
                : card.color === "yellow"
                  ? "radial-gradient(circle, #eab308 0%, #a16207 100%)"
                  : card.color === "green"
                    ? "radial-gradient(circle, #22c55e 0%, #166534 100%)"
                    : "radial-gradient(circle, #a855f7 0%, #6b21a8 100%)",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3), 0 0 2px rgba(255, 255, 255, 0.5) inset",
        }}
      >
        <span className="text-xl font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" }}>
          {card.cost}
        </span>
      </div>

      {/* 指定色コスト表示 */}
      {card.colorCost && card.colorCost > 0 && (
        <div
          className="absolute top-1 left-10 font-bold text-base"
          style={{
            color: "#ffffff",
            textShadow: "0 1px 1px rgba(0, 0, 0, 0.7)",
          }}
        >
          {card.colorCost}
        </div>
      )}

      {/* 無色コスト表示 */}
      {card.colorlessCost && card.colorlessCost > 0 && (
        <div
          className="absolute font-bold text-xs"
          style={{
            top: "calc(20px + 1px)",
            left: "calc(2.5rem + 0.5px)",
            color: "#000000",
            textShadow: "0 1px 1px rgba(255, 255, 255, 0.5)",
          }}
        >
          {card.colorlessCost}
        </div>
      )}

      {/* BP値（右上） - 値が0や-の場合は表示しない */}
      {card.bp && card.bp !== "0" && card.bp !== "-" && (
        <div className="absolute top-1 right-1">
          <div
            className="px-2 py-0.5 text-sm font-bold rounded-sm"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
            }}
          >
            <span className={getCardTextColorClass()}>{card.bp}</span>
          </div>
        </div>
      )}

      {/* SP値（右上、BP値の下） - 値が0や-の場合は表示しない - サイズを小さく */}
      {card.sp && card.sp !== "0" && card.sp !== "-" && (
        <div className="absolute top-7 right-1">
          <div
            className="px-1 py-0 text-[0.6rem] font-bold rounded-sm"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            }}
          >
            <span className={getCardTextColorClass()}>+{card.sp}</span>
          </div>
        </div>
      )}

      {/* カード名（固定位置に2行で表示） - テキストに影を追加 */}
      <div className="absolute top-[43.5px] left-0 right-0 text-center px-1 h-10 flex flex-col justify-center">
        <div
          className="font-bold text-white text-[0.75rem] leading-tight"
          style={{
            textShadow: "0 1px 3px rgba(0, 0, 0, 0.8), 0 0 5px rgba(0, 0, 0, 0.5)",
          }}
        >
          {formatCardName()}
        </div>
      </div>

      {/* カード効果エリア（カード名の下からカード下部まで） - 効果がない場合は表示しない */}
      {card.ability && (
        <div
          className="absolute top-[4.9rem] left-1 right-1 bottom-0 p-1 overflow-hidden"
          style={{
            background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))",
            borderRadius: "4px",
            boxShadow: "0 -1px 4px rgba(0, 0, 0, 0.1) inset",
          }}
        >
          {card.effectType && card.effectType.length > 0 && (
            <div className="text-[0.6rem] font-bold mb-1 text-gray-700">{card.effectType.join("/")}</div>
          )}
          <div className="text-[0.6rem] leading-tight line-clamp-5">
            <span className="text-black font-bold">{card.ability}</span>
          </div>
        </div>
      )}

      {/* デッキ枚数表示（カード下部） - 「枚」の表示を削除 */}
      <div
        className="absolute bottom-0 left-0 right-0 py-1 px-2 text-center z-10"
        style={{
          background: "linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.5))",
        }}
      >
        <div className="text-sm font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)" }}>
          {deckCount > 0 ? `${deckCount}` : ""}
        </div>
      </div>

      {/* カード全体に微かな光沢効果を追加 */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)",
        }}
      ></div>

      {/* カードの枠線 */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.3) inset, 
                    0 0 0 1px rgba(0, 0, 0, 0.2) inset`,
        }}
      ></div>

      {/* 選択状態のチェックマーク */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  )
}
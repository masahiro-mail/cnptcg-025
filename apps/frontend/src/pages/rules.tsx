import Link from 'next/link';

export default function Rules() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cnp-dark to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">ゲームルール</h1>
            <Link href="/" className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
              ホームに戻る
            </Link>
          </div>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-2">ゲーム概要</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>プレイヤー: 2人対戦</li>
                <li>勝利条件:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>3拠点中2拠点の相手ゲージを0にする</li>
                    <li>相手デッキを0枚にする</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-2">カードタイプ</h2>
              <div className="space-y-2">
                <div>
                  <h3 className="font-semibold">1. ユニット</h3>
                  <p className="ml-4">BP（戦闘力）とSP（スピード）を持つ。フィールドに配置して戦う。</p>
                </div>
                <div>
                  <h3 className="font-semibold">2. イベント</h3>
                  <p className="ml-4">使い切りの効果。使用後トラッシュへ。</p>
                </div>
                <div>
                  <h3 className="font-semibold">3. サポーター</h3>
                  <p className="ml-4">永続効果。サポーターゾーンに配置。</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-2">カード属性（4色）</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cnp-blue rounded"></div>
                  <span>青 = ドロー/退場</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cnp-red rounded"></div>
                  <span>赤 = 高火力</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cnp-yellow rounded"></div>
                  <span>黄 = 手札操作/コスト減</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cnp-green rounded"></div>
                  <span>緑 = 移動/ゲージ操作</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-2">デッキ構築</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>50枚固定</li>
                <li>同カードは最大4枚まで</li>
                <li>推奨配分: ユニット30枚 / イベント15枚 / サポーター5枚</li>
                <li>レイキデッキ15枚（4色組合せ）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-2">ゲームフェーズ</h2>
              <ol className="list-decimal list-inside space-y-1">
                <li>ドローフェーズ - カードを1枚ドロー</li>
                <li>レイキフェーズ - レイキカードを使用可能</li>
                <li>メインフェーズ - カードのプレイ、ユニットの移動</li>
                <li>バトルフェーズ - ユニットで攻撃</li>
                <li>エンドフェーズ - ターン終了処理</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-2">バトルシステム</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>ユニット同士の戦闘: BPを比較し、低い方が破壊される</li>
                <li>直接攻撃: 相手の拠点にユニットがない場合、ゲージにダメージ</li>
                <li>オーバーキル: ユニット破壊時の余剰ダメージはゲージへ</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
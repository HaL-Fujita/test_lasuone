<template>
  <div class="game-container">
    <div class="game-header">
      <h1>バカラゲーム</h1>
      <p>ノーコミッション / バンカー6 / 7回勝負</p>
    </div>

    <div class="game-info">
      <div class="info-card">
        <h3>残高</h3>
        <p class="balance">${{ balance }}</p>
      </div>
      <div class="info-card">
        <h3>ラウンド</h3>
        <p class="rounds">{{ currentRound }} / 7</p>
      </div>
      <div class="info-card">
        <h3>イカサマ</h3>
        <p class="cheat-available">{{ cheatAvailable ? '使用可能' : '使用済み' }}</p>
      </div>
    </div>

    <!-- Game Over Screen -->
    <div v-if="gameOver" class="game-over">
      <h2>{{ balance === 0 ? 'ゲームオーバー' : 'ゲーム終了' }}</h2>
      <p>最終残高: ${{ balance }}</p>
      <p>獲得金額: ${{ balance - 100 }}</p>

      <div class="name-input">
        <input
          v-model="playerName"
          type="text"
          placeholder="名前を入力"
          maxlength="20"
        />
        <button @click="submitScore" class="submit-score-button">
          スコア送信
        </button>
      </div>

      <button @click="restartGame" class="restart-button">
        新しいゲームを開始
      </button>
    </div>

    <!-- Game Table -->
    <div v-else>
      <div class="game-table">
        <div class="table-section">
          <div class="hand">
            <h3>プレイヤー</h3>
            <div class="cards">
              <div v-for="(card, index) in gameResult?.playerCards" :key="'p' + index" class="card">
                {{ getCardDisplay(card) }}
              </div>
            </div>
            <div v-if="gameResult" class="total">
              合計: {{ gameResult.playerTotal }}
            </div>
          </div>

          <div class="hand">
            <h3>バンカー</h3>
            <div class="cards">
              <div v-for="(card, index) in gameResult?.bankerCards" :key="'b' + index" class="card">
                {{ getCardDisplay(card) }}
              </div>
            </div>
            <div v-if="gameResult" class="total">
              合計: {{ gameResult.bankerTotal }}
            </div>
          </div>
        </div>

        <div v-if="gameResult" class="result-message" :class="'winner-' + gameResult.winner">
          {{ getResultMessage() }}
        </div>
      </div>

      <!-- Betting Section -->
      <div v-if="!gameResult" class="betting-section">
        <h3>ベットを選択してください</h3>
        <div class="bet-options">
          <button
            @click="selectedBet = 'player'"
            :class="['bet-button', 'bet-player', { selected: selectedBet === 'player' }]"
            :disabled="roundInProgress"
          >
            プレイヤー<br>(1:1)
          </button>
          <button
            @click="selectedBet = 'banker'"
            :class="['bet-button', 'bet-banker', { selected: selectedBet === 'banker' }]"
            :disabled="roundInProgress"
          >
            バンカー<br>(1:1 / 6で0.5:1)
          </button>
          <button
            @click="selectedBet = 'tie'"
            :class="['bet-button', 'bet-tie', { selected: selectedBet === 'tie' }]"
            :disabled="roundInProgress"
          >
            タイ<br>(8:1)
          </button>
        </div>

        <div class="bet-amount">
          <label>ベット額: $</label>
          <input
            v-model.number="betAmount"
            type="number"
            min="1"
            :max="balance"
            :disabled="roundInProgress"
          />
        </div>

        <div class="action-buttons">
          <button
            @click="dealCards"
            :disabled="!selectedBet || betAmount <= 0 || betAmount > balance || roundInProgress"
            class="action-button deal-button"
          >
            ディール
          </button>
          <button
            v-if="cheatAvailable"
            @click="showCheatModal = true"
            :disabled="!selectedBet || betAmount <= 0 || betAmount > balance || roundInProgress"
            class="action-button cheat-button"
          >
            イカサマを使う
          </button>
        </div>
      </div>

      <!-- Next Round Button -->
      <div v-else class="action-buttons">
        <button @click="nextRound" class="action-button next-button">
          次のラウンド
        </button>
      </div>
    </div>

    <!-- Rankings -->
    <div class="ranking-section">
      <h2>ランキング</h2>
      <div class="ranking-table">
        <table>
          <thead>
            <tr>
              <th>順位</th>
              <th>プレイヤー名</th>
              <th>最終残高</th>
              <th>獲得金額</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rank, index) in rankings" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ rank.playerName }}</td>
              <td>${{ rank.finalBalance }}</td>
              <td>${{ rank.finalBalance - 100 }}</td>
            </tr>
            <tr v-if="rankings.length === 0">
              <td colspan="4">まだランキングがありません</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cheat Modal -->
    <div v-if="showCheatModal" class="cheat-modal" @click.self="showCheatModal = false">
      <div class="cheat-content">
        <h2>イカサマを使う</h2>
        <p>どの結果にしますか？（使えるのは1回だけです）</p>
        <div class="cheat-options">
          <button @click="useCheat('player')" class="cheat-option-button bet-player">
            プレイヤーの勝ち
          </button>
          <button @click="useCheat('banker')" class="cheat-option-button bet-banker">
            バンカーの勝ち
          </button>
          <button @click="useCheat('tie')" class="cheat-option-button bet-tie">
            タイ（引き分け）
          </button>
        </div>
        <button @click="showCheatModal = false" class="cancel-button">
          キャンセル
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'App',
  data() {
    return {
      balance: 100,
      currentRound: 1,
      cheatAvailable: true,
      selectedBet: null,
      betAmount: 10,
      gameResult: null,
      roundInProgress: false,
      gameOver: false,
      playerName: '',
      rankings: [],
      roundHistory: [],
      showCheatModal: false
    };
  },
  mounted() {
    this.loadRankings();
  },
  methods: {
    async dealCards() {
      if (!this.selectedBet || this.betAmount <= 0 || this.betAmount > this.balance) {
        return;
      }

      this.roundInProgress = true;

      try {
        const response = await axios.post('/api/play', {
          bet: {
            type: this.selectedBet,
            amount: this.betAmount
          }
        });

        this.gameResult = response.data.result;
        this.balance += response.data.netProfit;

        this.roundHistory.push({
          round: this.currentRound,
          bet: this.selectedBet,
          amount: this.betAmount,
          result: this.gameResult.winner,
          payout: response.data.payout,
          netProfit: response.data.netProfit
        });

        this.checkGameOver();
      } catch (error) {
        console.error('Error playing round:', error);
        alert('エラーが発生しました');
      }

      this.roundInProgress = false;
    },

    async useCheat(desiredWinner) {
      this.showCheatModal = false;

      if (!this.cheatAvailable) {
        alert('イカサマは既に使用済みです');
        return;
      }

      this.roundInProgress = true;

      try {
        // Get cheat result from server
        const cheatResponse = await axios.post('/api/cheat', {
          desiredWinner
        });

        // Play the round with the cheat result
        const response = await axios.post('/api/play', {
          bet: {
            type: this.selectedBet,
            amount: this.betAmount
          },
          cheatResult: cheatResponse.data
        });

        this.gameResult = response.data.result;
        this.balance += response.data.netProfit;
        this.cheatAvailable = false;

        this.roundHistory.push({
          round: this.currentRound,
          bet: this.selectedBet,
          amount: this.betAmount,
          result: this.gameResult.winner,
          payout: response.data.payout,
          netProfit: response.data.netProfit,
          cheated: true
        });

        this.checkGameOver();
      } catch (error) {
        console.error('Error using cheat:', error);
        alert('エラーが発生しました');
      }

      this.roundInProgress = false;
    },

    nextRound() {
      this.gameResult = null;
      this.selectedBet = null;
      this.currentRound++;

      if (this.currentRound > 7) {
        this.gameOver = true;
      }
    },

    checkGameOver() {
      if (this.balance <= 0) {
        this.balance = 0;
        this.gameOver = true;
      }
    },

    async submitScore() {
      if (!this.playerName.trim()) {
        alert('名前を入力してください');
        return;
      }

      try {
        await axios.post('/api/ranking', {
          playerName: this.playerName,
          finalBalance: this.balance,
          rounds: this.roundHistory
        });

        await this.loadRankings();
        alert('スコアを送信しました！');
      } catch (error) {
        console.error('Error submitting score:', error);
        alert('スコアの送信に失敗しました');
      }
    },

    async loadRankings() {
      try {
        const response = await axios.get('/api/ranking');
        this.rankings = response.data;
      } catch (error) {
        console.error('Error loading rankings:', error);
      }
    },

    restartGame() {
      this.balance = 100;
      this.currentRound = 1;
      this.cheatAvailable = true;
      this.selectedBet = null;
      this.betAmount = 10;
      this.gameResult = null;
      this.roundInProgress = false;
      this.gameOver = false;
      this.playerName = '';
      this.roundHistory = [];
    },

    getCardDisplay(cardValue) {
      const suits = ['♠', '♥', '♦', '♣'];
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

      const suit = suits[Math.floor((cardValue - 1) / 13)];
      const rank = ranks[(cardValue - 1) % 13];

      return rank + suit;
    },

    getResultMessage() {
      if (!this.gameResult) return '';

      const { winner, isBanker6 } = this.gameResult;

      if (winner === 'player') {
        return 'プレイヤーの勝ち！';
      } else if (winner === 'banker') {
        return isBanker6 ? 'バンカー6の勝ち！(0.5:1)' : 'バンカーの勝ち！';
      } else {
        return 'タイ！';
      }
    }
  }
};
</script>

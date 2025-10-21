const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage for rankings
let rankings = [];

// Card values for Baccarat (1-13 for A-K)
const getCardValue = (card) => {
  const value = card % 13 + 1;
  return value > 10 ? 0 : value === 1 ? 1 : value;
};

// Calculate hand total (modulo 10)
const calculateTotal = (cards) => {
  return cards.reduce((sum, card) => sum + getCardValue(card), 0) % 10;
};

// Determine if third card is needed
const needsThirdCard = (playerTotal, bankerTotal, playerCards, bankerCards) => {
  const result = { player: false, banker: false };

  // Player's third card rule
  if (playerTotal <= 5) {
    result.player = true;
  }

  // Banker's third card rule
  if (!result.player) {
    if (bankerTotal <= 5) {
      result.banker = true;
    }
  } else {
    // If player drew third card, banker follows complex rules
    if (bankerTotal <= 2) {
      result.banker = true;
    } else if (bankerTotal === 3) {
      result.banker = true; // Always draw on 3 (simplified)
    } else if (bankerTotal === 4) {
      result.banker = true; // Draw on 4 (simplified)
    } else if (bankerTotal === 5) {
      result.banker = true; // Draw on 5 (simplified)
    } else if (bankerTotal === 6) {
      result.banker = true; // Draw on 6 (simplified)
    }
  }

  return result;
};

// Generate random card (1-52)
const drawCard = () => Math.floor(Math.random() * 52) + 1;

// Play a round of Baccarat
const playRound = (cheatResult = null) => {
  if (cheatResult) {
    // Return the cheated result
    return cheatResult;
  }

  const playerCards = [drawCard(), drawCard()];
  const bankerCards = [drawCard(), drawCard()];

  let playerTotal = calculateTotal(playerCards);
  let bankerTotal = calculateTotal(bankerCards);

  // Natural win check (8 or 9)
  if (playerTotal >= 8 || bankerTotal >= 8) {
    return determineWinner(playerCards, bankerCards, playerTotal, bankerTotal);
  }

  // Third card rules
  const thirdCardNeeded = needsThirdCard(playerTotal, bankerTotal, playerCards, bankerCards);

  if (thirdCardNeeded.player) {
    playerCards.push(drawCard());
    playerTotal = calculateTotal(playerCards);
  }

  if (thirdCardNeeded.banker) {
    bankerCards.push(drawCard());
    bankerTotal = calculateTotal(bankerCards);
  }

  return determineWinner(playerCards, bankerCards, playerTotal, bankerTotal);
};

// Determine winner and return result
const determineWinner = (playerCards, bankerCards, playerTotal, bankerTotal) => {
  let winner;
  if (playerTotal > bankerTotal) {
    winner = 'player';
  } else if (bankerTotal > playerTotal) {
    winner = 'banker';
  } else {
    winner = 'tie';
  }

  const isBanker6 = winner === 'banker' && bankerTotal === 6;

  return {
    playerCards,
    bankerCards,
    playerTotal,
    bankerTotal,
    winner,
    isBanker6
  };
};

// Calculate payout based on bet and result
const calculatePayout = (bet, result) => {
  const { winner, isBanker6 } = result;

  let payout = 0;

  if (bet.type === 'player' && winner === 'player') {
    payout = bet.amount * 2; // 1:1 payout
  } else if (bet.type === 'banker' && winner === 'banker') {
    if (isBanker6) {
      payout = bet.amount * 1.5; // 0.5:1 payout for Banker 6
    } else {
      payout = bet.amount * 2; // 1:1 payout (no commission)
    }
  } else if (bet.type === 'tie' && winner === 'tie') {
    payout = bet.amount * 9; // 8:1 payout
  }

  return payout;
};

// API endpoint to play a round
app.post('/api/play', (req, res) => {
  const { bet, cheatResult } = req.body;

  if (!bet || !bet.type || !bet.amount) {
    return res.status(400).json({ error: 'Invalid bet' });
  }

  const result = playRound(cheatResult);
  const payout = calculatePayout(bet, result);
  const netProfit = payout - bet.amount;

  // Debug logging
  console.log('Game Result:', {
    playerCards: result.playerCards,
    bankerCards: result.bankerCards,
    playerTotal: result.playerTotal,
    bankerTotal: result.bankerTotal,
    winner: result.winner
  });

  res.json({
    result,
    payout,
    netProfit
  });
});

// API endpoint to submit score to ranking
app.post('/api/ranking', (req, res) => {
  const { playerName, finalBalance, rounds } = req.body;

  if (!playerName || finalBalance === undefined) {
    return res.status(400).json({ error: 'Invalid ranking data' });
  }

  const ranking = {
    playerName,
    finalBalance,
    rounds: rounds || [],
    timestamp: new Date().toISOString()
  };

  rankings.push(ranking);

  // Sort by final balance (descending)
  rankings.sort((a, b) => b.finalBalance - a.finalBalance);

  // Keep only top 10
  rankings = rankings.slice(0, 10);

  res.json({ success: true, ranking });
});

// API endpoint to get rankings
app.get('/api/ranking', (req, res) => {
  res.json(rankings);
});

// API endpoint to generate cheat result
app.post('/api/cheat', (req, res) => {
  const { desiredWinner } = req.body;

  if (!desiredWinner || !['player', 'banker', 'tie'].includes(desiredWinner)) {
    return res.status(400).json({ error: 'Invalid cheat parameter' });
  }

  // Helper function to generate cards that sum to a specific total
  const generateCardsForTotal = (targetTotal) => {
    // Map value to card number based on getCardValue logic
    // getCardValue: value = card % 13 + 1, then if > 10 return 0, if == 1 return 1, else return value
    // Card mapping: 1→2, 2→3, ..., 8→9, 9→10(0), 10→11(0), 11→12(0), 12→13(0), 13→1
    let firstCard;
    if (targetTotal === 0) {
      firstCard = 9; // Maps to value 10, which becomes 0
    } else if (targetTotal === 1) {
      firstCard = 13; // Maps to value 1 (Ace)
    } else {
      firstCard = targetTotal - 1; // For 2-9: card = value - 1
    }
    const secondCard = 9; // Maps to value 0 in baccarat
    return [firstCard, secondCard];
  };

  // Generate a result that guarantees the desired winner
  let playerTotal, bankerTotal;
  let playerCards, bankerCards;

  if (desiredWinner === 'player') {
    playerTotal = 9;
    bankerTotal = Math.floor(Math.random() * 9);
    playerCards = generateCardsForTotal(playerTotal);
    bankerCards = generateCardsForTotal(bankerTotal);
  } else if (desiredWinner === 'banker') {
    bankerTotal = 9;
    playerTotal = Math.floor(Math.random() * 9);
    playerCards = generateCardsForTotal(playerTotal);
    bankerCards = generateCardsForTotal(bankerTotal);
  } else {
    const total = Math.floor(Math.random() * 10);
    playerTotal = total;
    bankerTotal = total;
    playerCards = generateCardsForTotal(playerTotal);
    bankerCards = generateCardsForTotal(bankerTotal);
  }

  const result = {
    playerCards,
    bankerCards,
    playerTotal,
    bankerTotal,
    winner: desiredWinner,
    isBanker6: desiredWinner === 'banker' && bankerTotal === 6
  };

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Baccarat server running on http://localhost:${PORT}`);
});

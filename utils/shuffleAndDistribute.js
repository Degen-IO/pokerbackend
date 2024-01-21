const { Card } = require("../models");

// Define the createShuffledDeck function
module.exports = {
  createShuffledDeck: async function () {
    try {
      // Use the getShuffledDeck method from the Card model
      const deck = await Card.getShuffledDeck();
      return deck;
    } catch (error) {
      console.error("Error creating a shuffled deck:", error);
      throw error;
    }
  },

  //this should take in number of current players, as well as dealer position and seat #s that are occupied at the table and deal hole cards and then community cards before any actions take place.
  distributeCards: function (numPlayers, deck, dealerSeat, occupiedSeats) {
    // Ensure deck has enough cards for the hand
    if (!deck || deck.length < numPlayers * 2 + 5) {
      console.error(
        "Invalid deck or not enough cards in the deck for the hand:"
      );
      throw new Error("Not enough cards in the deck for the hand.");
    }

    // Determine the starting player index based on the dealer's seat
    const startingPlayerIndex = occupiedSeats.indexOf(dealerSeat);

    const handState = {
      players: Array.from({ length: numPlayers }, () => ({ holeCards: [] })),
      burn1: null,
      flop1: null,
      flop2: null,
      flop3: null,
      burn2: null,
      turn: null,
      burn3: null,
      river: null,
    };

    // Deal cards to players starting from the dealer's left, skipping empty seats
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < numPlayers; j++) {
        const relativePlayerIndex = (startingPlayerIndex + j) % numPlayers;
        handState.players[relativePlayerIndex].holeCards.push(deck.shift());
      }
    }

    handState.burn1 = deck.shift();

    for (let i = 0; i < 3; i++) {
      handState[`flop${i + 1}`] = deck.shift();
    }

    handState.burn2 = deck.shift();
    handState.turn = deck.shift();
    handState.burn3 = deck.shift();
    handState.river = deck.shift();

    return handState;
  },
};

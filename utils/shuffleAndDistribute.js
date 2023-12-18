//add a function that creates and shuffles a new deck to be used in the function below

//this should take in number of current players, as well as dealer position and seat #s that are occupied at the table and deal hole cards and then community cards before any actions take place.
function distributeCards(numPlayers, deck, dealerSeat, occupiedSeats) {
  // Ensure deck has enough cards for the hand
  if (deck.cards.length < numPlayers * 2 + 5) {
    throw new Error("Not enough cards in the deck for the hand.");
  }

  // Determine the starting player index based on the dealer's seat
  const startingPlayerIndex = occupiedSeats.indexOf(dealerSeat);

  const handState = {
    players: Array.from({ length: numPlayers }, () => ({ holeCards: [] })),
    burn: [],
    flop: [],
    turn: null,
    river: null,
  };
  console.log(handState.players);

  // Deal cards to players starting from the dealer's left, skipping empty seats
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < numPlayers; j++) {
      const relativePlayerIndex = (startingPlayerIndex + j) % numPlayers;
      const playerIndex = occupiedSeats[relativePlayerIndex];
      handState.players[relativePlayerIndex].holeCards.push(deck.cards.pop());
    }
  }

  handState.burn.push(deck.cards.pop());

  for (let i = 0; i < 3; i++) {
    handState.flop.push(deck.cards.pop());
  }

  handState.burn.push(deck.cards.pop());
  handState.turn = deck.cards.pop();
  handState.burn.push(deck.cards.pop());
  handState.river = deck.cards.pop();

  return handState;
}

// Example usage:
const numberOfPlayers = 5;
const deck = createShuffledDeck();
const dealerSeat = 1; // Change this to the current dealer's seat
const occupiedSeats = [1, 2, 4, 6, 7]; // Determine occupied seats elsewhere
const initialHandState = distributeCards(
  numberOfPlayers,
  deck,
  dealerSeat,
  occupiedSeats
);

console.log(initialHandState);

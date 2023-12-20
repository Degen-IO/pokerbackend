const { Deck } = require("../models");

// Define the createShuffledDeck function
async function createShuffledDeck() {
  try {
    // Use the getShuffledDeck method from the Deck model
    const deck = await Deck.getShuffledDeck();
    // console.log(deck);
    return deck;
  } catch (error) {
    console.error("Error creating a shuffled deck:", error);
    throw error;
  }
}

//this should take in number of current players, as well as dealer position and seat #s that are occupied at the table and deal hole cards and then community cards before any actions take place.
function distributeCards(numPlayers, deck, dealerSeat, occupiedSeats) {
  // Ensure deck has enough cards for the hand
  // console.log("Number of cards in the deck:", deck);
  if (!deck || deck.length < numPlayers * 2 + 5) {
    console.error("Invalid deck or not enough cards in the deck for the hand:");
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
  // console.log(handState.players);

  // Deal cards to players starting from the dealer's left, skipping empty seats
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < numPlayers; j++) {
      const relativePlayerIndex = (startingPlayerIndex + j) % numPlayers;
      // const playerIndex = occupiedSeats[relativePlayerIndex];
      handState.players[relativePlayerIndex].holeCards.push(deck.pop());
    }
  }

  handState.burn.push(deck.pop());

  for (let i = 0; i < 3; i++) {
    handState.flop.push(deck.pop());
  }

  handState.burn.push(deck.pop());
  handState.turn = deck.pop();
  handState.burn.push(deck.pop());
  handState.river = deck.pop();

  return handState;
}

// Example usage
async function run() {
  const numberOfPlayers = 5;
  const deck = await createShuffledDeck();
  const dealerSeat = 1;
  const occupiedSeats = [1, 2, 4, 6, 7];

  const initialHandState = distributeCards(
    numberOfPlayers,
    deck,
    dealerSeat,
    occupiedSeats
  );

  console.log(initialHandState);
}

// Call the async function
run();

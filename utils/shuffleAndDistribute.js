const { Card } = require("../models");

// Define the createShuffledDeck function
async function createShuffledDeck() {
  try {
    // Use the getShuffledDeck method from the Deck model
    const deck = await Card.getShuffledDeck();
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
    burn1: null,
    flop1: null,
    flop2: null,
    flop3: null,
    burn2: null,
    turn: null,
    burn3: null,
    river: null,
  };
  // console.log(handState.players);

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

  // Log each player's hole cards
  initialHandState.players.forEach((player, index) => {
    console.log(
      `Player ${occupiedSeats[index]} hole cards:`,
      player.holeCards.map(
        (card) =>
          `id:${card.dataValues.id}, rank:"${card.dataValues.rank}", suit: "${card.dataValues.suit}"`
      )
    );
  });

  // Log burn, flop, turn, and river cards
  console.log(
    `burn1: id:${initialHandState.burn1.dataValues.id}, rank:"${initialHandState.burn1.dataValues.rank}", suit: "${initialHandState.burn1.dataValues.suit}"`
  );
  console.log(
    `flop1: id:${initialHandState.flop1.dataValues.id}, rank:"${initialHandState.flop1.dataValues.rank}", suit: "${initialHandState.flop1.dataValues.suit}"`
  );
  console.log(
    `flop2: id:${initialHandState.flop2.dataValues.id}, rank:"${initialHandState.flop2.dataValues.rank}", suit: "${initialHandState.flop2.dataValues.suit}"`
  );
  console.log(
    `flop3: id:${initialHandState.flop3.dataValues.id}, rank:"${initialHandState.flop3.dataValues.rank}", suit: "${initialHandState.flop3.dataValues.suit}"`
  );
  console.log(
    `burn2: id:${initialHandState.burn2.dataValues.id}, rank:"${initialHandState.burn2.dataValues.rank}", suit: "${initialHandState.burn2.dataValues.suit}"`
  );
  console.log(
    `turn: id:${initialHandState.turn.dataValues.id}, rank:"${initialHandState.turn.dataValues.rank}", suit: "${initialHandState.turn.dataValues.suit}"`
  );
  console.log(
    `burn3: id:${initialHandState.burn3.dataValues.id}, rank:"${initialHandState.burn3.dataValues.rank}", suit: "${initialHandState.burn3.dataValues.suit}"`
  );
  console.log(
    `river: id:${initialHandState.river.dataValues.id}, rank:"${initialHandState.river.dataValues.rank}", suit: "${initialHandState.river.dataValues.suit}"`
  );
}

// Call the async function
run();

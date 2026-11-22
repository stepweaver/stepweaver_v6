import type { TerminalLine } from '$lib/terminal/types';

type Card = { rank: string; suit: string; value: number };

export type BlackjackState = {
	deck: Card[];
	player: Card[];
	dealer: Card[];
	over: boolean;
	wins: number;
	losses: number;
	ties: number;
};

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function line(content: string, variant: TerminalLine['variant'] = 'default'): TerminalLine {
	return { content, variant };
}

function createDeck(): Card[] {
	const deck: Card[] = [];
	for (const suit of SUITS) {
		for (const rank of RANKS) {
			deck.push({
				rank,
				suit,
				value: rank === 'A' ? 11 : rank === 'J' || rank === 'Q' || rank === 'K' ? 10 : Number(rank)
			});
		}
	}
	return deck;
}

function shuffle(deck: Card[], random: () => number): Card[] {
	const cards = [...deck];
	for (let index = cards.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(random() * (index + 1));
		const current = cards[index];
		cards[index] = cards[swap] as Card;
		cards[swap] = current as Card;
	}
	return cards;
}

function draw(deck: Card[], random: () => number): { card: Card; deck: Card[] } {
	const source = deck.length === 0 ? shuffle(createDeck(), random) : deck;
	const card = source[source.length - 1] as Card;
	return { card, deck: source.slice(0, -1) };
}

function handValue(hand: Card[]): number {
	let value = hand.reduce((sum, card) => sum + card.value, 0);
	let aces = hand.filter((card) => card.rank === 'A').length;
	while (value > 21 && aces > 0) {
		value -= 10;
		aces -= 1;
	}
	return value;
}

function blackjack(hand: Card[]): boolean {
	return hand.length === 2 && handValue(hand) === 21;
}

function show(card: Card): string {
	return `${card.rank}${card.suit}`;
}

export function freshTable(): BlackjackState {
	return { deck: [], player: [], dealer: [], over: false, wins: 0, losses: 0, ties: 0 };
}

function deal(state: BlackjackState, random: () => number): BlackjackState {
	let deck = state.deck.length < 15 ? shuffle(createDeck(), random) : state.deck;
	const player: Card[] = [];
	const dealer: Card[] = [];
	for (let index = 0; index < 2; index += 1) {
		const playerDraw = draw(deck, random);
		deck = playerDraw.deck;
		player.push(playerDraw.card);
		const dealerDraw = draw(deck, random);
		deck = dealerDraw.deck;
		dealer.push(dealerDraw.card);
	}
	return { ...state, deck, player, dealer, over: false };
}

function handLines(state: BlackjackState): TerminalLine[] {
	return [
		line(`Your hand: ${state.player.map(show).join(' ')}`, 'lambda'),
		line(`Your total: ${handValue(state.player)}`),
		line(`Dealer shows: ${show(state.dealer[0] as Card)} [hidden]`, 'dimmed'),
		line('')
	];
}

function resolve(state: BlackjackState, random: () => number): { state: BlackjackState; lines: TerminalLine[] } {
	let deck = state.deck;
	const dealer = [...state.dealer];
	const playerValue = handValue(state.player);
	const playerBlackjack = blackjack(state.player);
	const dealerBlackjack = blackjack(dealer);
	let result: 'win' | 'loss' | 'tie';
	if (playerBlackjack && dealerBlackjack) result = 'tie';
	else if (playerBlackjack) result = 'win';
	else if (dealerBlackjack) result = 'loss';
	else if (playerValue > 21) result = 'loss';
	else {
		while (handValue(dealer) < 17) {
			const next = draw(deck, random);
			deck = next.deck;
			dealer.push(next.card);
		}
		const dealerValue = handValue(dealer);
		if (dealerValue > 21) result = 'win';
		else if (dealerValue > playerValue) result = 'loss';
		else if (dealerValue < playerValue) result = 'win';
		else result = 'tie';
	}
	const next: BlackjackState = {
		...state,
		deck,
		dealer,
		over: true,
		wins: state.wins + (result === 'win' ? 1 : 0),
		losses: state.losses + (result === 'loss' ? 1 : 0),
		ties: state.ties + (result === 'tie' ? 1 : 0)
	};
	const lines = [
		line(`Dealer: ${dealer.map(show).join(' ')}`, 'dimmed'),
		line(`Dealer total: ${handValue(dealer)}`, 'dimmed'),
		line(''),
		result === 'win'
			? line('You win.', 'success')
			: result === 'loss'
				? line('You lose.', 'error')
				: line('Push (tie).', 'warning'),
		line(`Score: W:${next.wins} L:${next.losses} T:${next.ties}`, 'dimmed'),
		line('Type "deal" for a new hand or "exit" to leave.')
	];
	return { state: next, lines };
}

export function openBlackjack(
	previous: BlackjackState | null,
	random: () => number = Math.random
): { state: BlackjackState; lines: TerminalLine[] } {
	const dealt = deal(previous ?? freshTable(), random);
	const lines: TerminalLine[] = [
		line('Blackjack: dealer stands on 17.', 'success'),
		line(''),
		...handLines(dealt)
	];
	if (blackjack(dealt.player)) {
		lines.push(line('Blackjack!', 'success'));
		const settled = resolve(dealt, random);
		return { state: settled.state, lines: [...lines, ...settled.lines] };
	}
	lines.push(line('Commands: hit | stand | deal | exit | help', 'dimmed'));
	return { state: dealt, lines };
}

export function playBlackjack(
	state: BlackjackState,
	raw: string,
	random: () => number = Math.random
): { state: BlackjackState; lines: TerminalLine[]; exit?: boolean } {
	const command = raw.trim().toLowerCase();
	if (command === 'exit' || command === 'quit' || command === 'cancel') {
		return { state, lines: [line('Left blackjack.', 'dimmed')], exit: true };
	}
	if (command === 'help' || command === '?') {
		return {
			state,
			lines: [
				line('hit: draw a card'),
				line('stand: hold and resolve'),
				line('deal: new hand (after round ends)'),
				line('exit | cancel: leave game')
			]
		};
	}
	if (state.over) {
		if (command === 'deal' || command === 'new') {
			const dealt = deal(state, random);
			const lines: TerminalLine[] = [line('New hand.', 'success'), line(''), ...handLines(dealt)];
			if (blackjack(dealt.player)) {
				lines.push(line('Blackjack!', 'success'));
				const settled = resolve(dealt, random);
				return { state: settled.state, lines: [...lines, ...settled.lines] };
			}
			lines.push(line('Commands: hit | stand | deal | exit | help', 'dimmed'));
			return { state: dealt, lines };
		}
		return { state, lines: [line('Round over. Type "deal" or "exit".', 'warning')] };
	}
	if (command === 'hit' || command === 'h') {
		const drawn = draw(state.deck, random);
		const player = [...state.player, drawn.card];
		const next = { ...state, deck: drawn.deck, player };
		const value = handValue(player);
		const lines = [line(`You draw: ${show(drawn.card)}`, 'lambda'), line(`Your total: ${value}`)];
		if (value > 21) {
			lines.push(line('Bust!', 'error'));
			const settled = resolve(next, random);
			return { state: settled.state, lines: [...lines, ...settled.lines] };
		}
		return { state: next, lines };
	}
	if (command === 'stand' || command === 's') return resolve(state, random);
	return { state, lines: [line('Unknown command. Try hit, stand, deal, exit.', 'warning')] };
}

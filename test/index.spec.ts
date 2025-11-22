import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';
import { DEFAULT_TABLE, Table, generateTables, affectTables } from '../src/table';
import { readyPlayer, readyPlayerTwoTables, readyPlayerTarot } from '../src/user';

describe('Get frontend', () => {
	describe('request for /index.html', () => {
		it('responds with frontend title', async () => {
			const request = new Request('http://example.com/index.html');
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatch(`<title>Meltdown Belote</title>`);
		});
	});

	// describe('request for /random', () => {
	// 	it('/ responds with a random UUID (unit style)', async () => {
	// 		const request = new Request<unknown, IncomingRequestCfProperties>('http://example.com/random');
	// 		// Create an empty context to pass to `worker.fetch()`.
	// 		const ctx = createExecutionContext();
	// 		const response = await worker.fetch(request, env, ctx);
	// 		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
	// 		await waitOnExecutionContext(ctx);
	// 		expect(await response.text()).toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
	// 	});

	// 	it('responds with a random UUID (integration style)', async () => {
	// 		const request = new Request('http://example.com/random');
	// 		const response = await SELF.fetch(request);
	// 		expect(await response.text()).toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
	// 	});
	// });
});

const player1 = readyPlayer('player 1');
const player2 = readyPlayer('player 2');
const player3 = readyPlayer('player 3');
const player4 = readyPlayer('player 4');
const player5 = readyPlayer('player 5');
const player6 = readyPlayer('player 6');
const player7 = readyPlayer('player 7');
const player8 = readyPlayer('player 8');
const player9 = readyPlayer('player 9');
const player10 = readyPlayer('player 10');
const player11 = readyPlayer('player 11');
const player12 = readyPlayer('player 12');
const player13 = readyPlayer('player 13');
const player14 = readyPlayer('player 14');

const playerOnTwoTables = readyPlayerTwoTables('player on two tables (1)');

const tarotPlayer1 = readyPlayerTarot('tarot player (1)');
const tarotPlayer2 = readyPlayerTarot('tarot player (2)');
const tarotPlayer3 = readyPlayerTarot('tarot player (3)');
const tarotPlayer4 = readyPlayerTarot('tarot player (4)');
const tarotPlayer5 = readyPlayerTarot('tarot player (5)');
const tarotPlayer6 = readyPlayerTarot('tarot player (6)');
const tarotPlayer7 = readyPlayerTarot('tarot player (7)');
const tarotPlayer8 = readyPlayerTarot('tarot player (8)');
const tarotPlayer9 = readyPlayerTarot('tarot player (9)');
const tarotPlayer10 = readyPlayerTarot('tarot player (10)');
const tarotPlayer11 = readyPlayerTarot('tarot player (11)');

describe('Get backend', () => {
	describe('request for /backend.html', () => {
		it('responds with backend title', async () => {
			const request = new Request('http://example.com/backend.html');
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatch(`<title>Meltdown backend</title>`);
		});
	});
});


describe('Table generation', () => {
	it.each([
		// Format: { players, tarotPlayers, twoTablesPlayers, expectedDefaultTable, expectedTables }
		{ 
			desc: '0 player',
			players: 0, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: []
		},
		{ 
			desc: '1 players',
			players: 1, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 1,
			expectedTables: []
		},
		{ 
			desc: '2 players',
			players: 2, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 2,
			expectedTables: []
		},
		{ 
			desc: '3 players',
			players: 3, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 3,
			expectedTables: []
		},
		{ 
			desc: '4 players',
			players: 4, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: [{ name: 'Table 1', size: 4 }]
		},
		{ 
			desc: '4 players WITH 4 who knows Tarot',
			players: 4, 
			tarotPlayers: 4, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: [{ name: 'Table 1', size: 4 }]
		},
		{ 
			desc: '5 players',
			players: 5, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 1,
			expectedTables: [{ name: 'Table 1', size: 4 }]
		},
		{ 
			desc: '5 players WHO knows Tarot (1 regular)',
			players: 5, 
			tarotPlayers: 4, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 1,
			expectedTables: [{ name: 'Table 1', size: 4 }]
		},
		{ 
			desc: '5 players WHO knows Tarot (all)',
			players: 5, 
			tarotPlayers: 5, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: [{ name: 'Table 1', size: 5 }]
		},
		{ 
			desc: '6 players',
			players: 6, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: [{ name: 'Table 1', size: 6 }]
		},
		{ 
			desc: '7 players WITHOUT any player on 2 tables',
			players: 7, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 1,
			expectedTables: [{ name: 'Table 1', size: 6 }]
		},
		{ 
			desc: '7 players WITH 1 player who KNOWS how to play on 2 tables',
			players: 7, 
			tarotPlayers: 0, 
			twoTablesPlayers: 1,
			expectedDefaultTable: 0,
			expectedTables: [{ name: 'Table 1', size: 7 }]
		},
		{ 
			desc: '8 players',
			players: 8, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: [
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 4 }
			]
		},
		{ 
			desc: '9 players',
			players: 9, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 1,
			expectedTables: [
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 4 }
			]
		},
		{ 
			desc: '9 players WITH 5 who knows Tarot',
			players: 9, 
			tarotPlayers: 5, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: [
				{ name: 'Table 1', size: 5 },
				{ name: 'Table 2', size: 4 }
			]
		},
		{ 
			desc: '10 players',
			players: 10, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: [
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 6 }
			]
		},
		{ 
			desc: '11 players',
			players: 11, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 1,
			expectedTables: [
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 6 }
			]
		},
		{ 
			desc: '11 players WITH 1 player who KNOWS how to play on 2 tables',
			players: 11, 
			tarotPlayers: 0, 
			twoTablesPlayers: 1,
			expectedDefaultTable: 0,
			expectedTables: [
				{ name: 'Table 1', size: 7 },
				{ name: 'Table 2', size: 4 }
			]
		},
		{ 
			desc: '11 players WITH 1 player who KNOWS how to play on 2 tables + 5 who KNOWS Tarot',
			players: 11, 
			tarotPlayers: 5, 
			twoTablesPlayers: 1,
			expectedDefaultTable: 0,
			expectedTables: [
				{ name: 'Table 1', size: 7 },
				{ name: 'Table 2', size: 4 }
			]
		},
		{ 
			desc: '11 players WITH 5 who KNOWS Tarot',
			players: 11, 
			tarotPlayers: 5, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: [
				{ name: 'Table 1', size: 5 },
				{ name: 'Table 2', size: 6 }
			]
		},
		{ 
			desc: '12 players',
			players: 12, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: [
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 4 },
				{ name: 'Table 3', size: 4 }
			]
		},
		{ 
			desc: '13 players',
			players: 13, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 1,
			expectedTables: [
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 4 },
				{ name: 'Table 3', size: 4 }
			]
		},
		{ 
			desc: '13 players WITH 1 player who KNOWS how to play on 2 tables',
			players: 13, 
			tarotPlayers: 0, 
			twoTablesPlayers: 1,
			expectedDefaultTable: 0,
			expectedTables: [
				{ name: 'Table 1', size: 7 },
				{ name: 'Table 2', size: 6 }
			]
		},
		{ 
			desc: '14 players',
			players: 14, 
			tarotPlayers: 0, 
			twoTablesPlayers: 0,
			expectedDefaultTable: 0,
			expectedTables: [
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 4 },
				{ name: 'Table 3', size: 6 }
			]
		},
	])('$desc', async ({ 
		players, 
		tarotPlayers, 
		twoTablesPlayers, 
		expectedDefaultTable, 
		expectedTables 
	}) => {
		// Generate players dynamically
		const allPlayers = [];
		
		// Add players
		for (let i = 1; i <= tarotPlayers; i++) {
			allPlayers.push(readyPlayerTarot(`tarot player (${i})`));
		}
		
		for (let i = 1; i <= twoTablesPlayers; i++) {
			allPlayers.push(readyPlayerTwoTables(`player on two tables (${i})`));
		}
		
		const regularPlayers = players - tarotPlayers - twoTablesPlayers;
		for (let i = 1; i <= regularPlayers; i++) {
			allPlayers.push(readyPlayer(`player ${i}`));
		}
		
		// Generate the table
		const tables = new Map([[DEFAULT_TABLE, new Map(allPlayers.map(p => [p.name, p]))]]);
		generateTables(tables);

		if (expectedDefaultTable !== undefined) {
			expect(tables.get(DEFAULT_TABLE)).lengthOf(expectedDefaultTable);
		} else {
			expect(tables.has(DEFAULT_TABLE)).toBe(false);
		}
		
		expectedTables.forEach(table => {
			expect(tables.has(table.name)).toBe(true);
			expect(tables.get(table.name)).lengthOf(table.size);
		});
	});
});

describe('affectTables', () => {
	it.each([
		{
			desc: 'Empty users array',
			users: [],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 }
			]
		},
		{
			desc: '1 user',
			users: [player1],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 1 }
			]
		},
		{
			desc: '2 users',
			users: [player1, player2],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 2 }
			]
		},
		{
			desc: '3 users',
			users: [player1, player2, player3],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 3 }
			]
		},
		{
			desc: '4 users - perfect table',
			users: [player1, player2, player3, player4],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 4 }
			]
		},
		{
			desc: '5 users - 1 left in panama',
			users: [player1, player2, player3, player4, player5],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 1 },
				{ name: 'Table 1', size: 4 }
			]
		},
		{
			desc: '5 tarot players - perfect tarot table',
			users: [tarotPlayer1, tarotPlayer2, tarotPlayer3, tarotPlayer4, tarotPlayer5],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 5 }
			]
		},
		{
			desc: '6 users - perfect table of 6',
			users: [player1, player2, player3, player4, player5, player6],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 6 }
			]
		},
		{
			desc: '7 users without two-tables player - 1 in panama, 1 table of 6',
			users: [player1, player2, player3, player4, player5, player6, player7],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 1 },
				{ name: 'Table 1', size: 6 }
			]
		},
		{
			desc: '7 users with 1 two-tables player - perfect table of 7',
			users: [player1, player2, player3, playerOnTwoTables, player5, player6, player7],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 7 }
			]
		},
		{
			desc: '8 users - 2 tables of 4',
			users: [player1, player2, player3, player4, player5, player6, player7, player8],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 4 }
			]
		},
		{
			desc: '9 users - 1 in panama, 2 tables of 4',
			users: [player1, player2, player3, player4, player5, player6, player7, player8, player9],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 1 },
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 4 }
			]
		},
		{
			desc: '9 users with 5 tarot players - 1 tarot table of 5, 1 table of 4',
			users: [player1, tarotPlayer2, player3, tarotPlayer4, player5, tarotPlayer6, player7, tarotPlayer8, tarotPlayer9],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 5 },
				{ name: 'Table 2', size: 4 }
			]
		},
		{
			desc: '10 users - 1 table of 4, 1 table of 6',
			users: [player1, player2, player3, player4, player5, player6, player7, player8, player9, player10],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 6 }
			]
		},
		{
			desc: '11 users - 1 in panama, 1 table of 4, 1 table of 6',
			users: [player1, player2, player3, player4, player5, player6, player7, player8, player9, player10, player11],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 1 },
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 6 }
			]
		},
		{
			desc: '11 users with 1 two-tables player - 1 table of 7, 1 table of 4',
			users: [player1, player2, player3, player4, player5, playerOnTwoTables, player7, player8, player9, player10, player11],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 7 },
				{ name: 'Table 2', size: 4 }
			]
		},
		{
			desc: '11 users with 5 tarot players - 1 tarot table of 5, 1 table of 6',
			users: [player1, tarotPlayer2, player3, tarotPlayer4, player5, player6, tarotPlayer7, player8, tarotPlayer9, player10, tarotPlayer11],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 5 },
				{ name: 'Table 2', size: 6 }
			]
		},
		{
			desc: '12 users - 3 tables of 4',
			users: [player1, player2, player3, player4, player5, player6, player7, player8, player9, player10, player11, player12],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 4 },
				{ name: 'Table 3', size: 4 }
			]
		},
		{
			desc: '13 users - 1 in panama, 3 tables of 4',
			users: [player1, player2, player3, player4, player5, player6, player7, player8, player9, player10, player11, player12, player13],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 1 },
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 4 },
				{ name: 'Table 3', size: 4 }
			]
		},
		{
			desc: '13 users with 1 two-tables player - 1 table of 7, 1 table of 6',
			users: [player1, player2, player3, player4, player5, playerOnTwoTables, player7, player8, player9, player10, player11, player12, player13],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 7 },
				{ name: 'Table 2', size: 6 }
			]
		},
		{
			desc: '14 users - 1 table of 4, 1 table of 4, 1 table of 6',
			users: [player1, player2, player3, player4, player5, player6, player7, player8, player9, player10, player11, player12, player13, player14],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 4 },
				{ name: 'Table 3', size: 6 }
			]
		},
		{
			desc: '10 tarot players - Table of 6 and table of 4',
			users: [tarotPlayer1, tarotPlayer2, tarotPlayer3, tarotPlayer4, tarotPlayer5, tarotPlayer6, tarotPlayer7, tarotPlayer8, tarotPlayer9, tarotPlayer10],
			expectedTables: [
				{ name: DEFAULT_TABLE, size: 0 },
				{ name: 'Table 1', size: 4 },
				{ name: 'Table 2', size: 6 }
			]
		},
	])('$desc', ({ users, expectedTables }) => {
		const tables = new Map([[DEFAULT_TABLE, new Map()]]);
		
		affectTables(tables, users);
		
		// Check expected tables exist with correct sizes
		expectedTables.forEach(expectedTable => {
			expect(tables.has(expectedTable.name)).toBe(true);
			expect(tables.get(expectedTable.name)?.size).toBe(expectedTable.size);
		});

		// Verify total player count matches
		let totalPlayers = 0;
		tables.forEach(table => {
			totalPlayers += table.size;
		});
		expect(totalPlayers).toBe(users.length);
	});
});
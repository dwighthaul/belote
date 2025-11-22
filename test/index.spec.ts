import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';
import { DEFAULT_TABLE, Table, generateTables } from '../src/table';
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

describe('Get backend', () => {
	describe('request for /backend.html', () => {
		it('responds with backend title', async () => {
			const request = new Request('http://example.com/backend.html');
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatch(`<title>Meltdown backend</title>`);
		});
	});
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

describe('Table generation', () => {
	it('0 player(s) without panama table', async () => {
		const tables = new Map();
		generateTables(tables);

		const expected = new Map([]);
		expect(tables).toStrictEqual(expected);
	});

	it('0 player(s)', async () => {
		const tables = new Map([[DEFAULT_TABLE, new Map()]]);
		generateTables(tables);

		const expected = new Map([[DEFAULT_TABLE, new Map()]]);
		expect(tables).toStrictEqual(expected);
	});

	it('1 player(s)', async () => {
		const tables = new Map([[DEFAULT_TABLE, new Map([[player1.name, player1]])]]);
		generateTables(tables);

		const expected = new Map([[DEFAULT_TABLE, new Map([[player1.name, player1]])]]);
		expect(tables).toStrictEqual(expected);
	});

	it('2 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
				]),
			],
		]);

		generateTables(tables);

		const expected = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
				]),
			],
		]);
		expect(tables).toStrictEqual(expected);
	});

	it('3 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
				]),
			],
		]);

		generateTables(tables);

		const expected = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
				]),
			],
		]);
		expect(tables).toStrictEqual(expected);
	});

	it('4 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
				]),
			],
		]);

		generateTables(tables);

		const expected = new Map([
			[DEFAULT_TABLE, new Map()],
			[
				'Table 1',
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
				]),
			],
		]);
		expect(tables).toStrictEqual(expected);
	});

	it('4 player(s) WITH 4 who knows Tarot', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[tarotPlayer1.name, tarotPlayer1],
					[tarotPlayer2.name, tarotPlayer2],
					[tarotPlayer3.name, tarotPlayer3],
					[tarotPlayer4.name, tarotPlayer4],
				]),
			],
		]);

		generateTables(tables);

		const expected = new Map([
			[DEFAULT_TABLE, new Map()],
			[
				'Table 1',
				new Map([
					[tarotPlayer1.name, tarotPlayer1],
					[tarotPlayer2.name, tarotPlayer2],
					[tarotPlayer3.name, tarotPlayer3],
					[tarotPlayer4.name, tarotPlayer4],
				]),
			],
		]);
		expect(tables).toStrictEqual(expected);
	});

	it('5 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(1);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(4);
	});

	it('5 player(s) WHO knows Tarot', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[tarotPlayer2.name, tarotPlayer2],
					[tarotPlayer3.name, tarotPlayer3],
					[tarotPlayer4.name, tarotPlayer4],
					[tarotPlayer5.name, tarotPlayer5],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(1);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(4);
	});

	it('5 player(s) WHO knows Tarot', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[tarotPlayer1.name, tarotPlayer1],
					[tarotPlayer2.name, tarotPlayer2],
					[tarotPlayer3.name, tarotPlayer3],
					[tarotPlayer4.name, tarotPlayer4],
					[tarotPlayer5.name, tarotPlayer5],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(5);
	});

	it('6 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[player6.name, player6],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(6);
	});

	it('7 player(s) WIHTOUT any player on 2 tables', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[player6.name, player6],
					[player7.name, player7],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(1);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(6);
	});

	it('7 player(s) WITH 1 player who KNOWS how to play on 2 tables', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[playerOnTwoTables.name, playerOnTwoTables],
					[player5.name, player5],
					[player6.name, player6],
					[player7.name, player7],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(7);
	});

	it('8 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[player6.name, player6],
					[player7.name, player7],
					[player8.name, player8],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(4);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(4);
	});

	it('9 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[player6.name, player6],
					[player7.name, player7],
					[player8.name, player8],
					[player9.name, player9],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(1);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(4);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(4);
	});

	it('9 player(s) WITH 5 who knows Tarot', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[tarotPlayer2.name, tarotPlayer2],
					[player3.name, player3],
					[tarotPlayer4.name, tarotPlayer4],
					[player5.name, player5],
					[tarotPlayer6.name, tarotPlayer6],
					[player7.name, player7],
					[tarotPlayer8.name, tarotPlayer8],
					[tarotPlayer9.name, tarotPlayer9],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(5);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(4);
	});

	it('10 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[player6.name, player6],
					[player7.name, player7],
					[player8.name, player8],
					[player9.name, player9],
					[player10.name, player10],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(4);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(6);
	});

	it('11 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[player6.name, player6],
					[player7.name, player7],
					[player8.name, player8],
					[player9.name, player9],
					[player10.name, player10],
					[player11.name, player11],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(1);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(4);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(6);
	});

	it('11 player(s) WITH 1 player who KNOWS how to play on 2 tables', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[playerOnTwoTables.name, playerOnTwoTables],
					[player7.name, player7],
					[player8.name, player8],
					[player9.name, player9],
					[player10.name, player10],
					[player11.name, player11],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(7);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(4);
	});

	it('11 player(s) WITH 1 player who KNOWS how to play on 2 tables + 5 who KNOWS Tarot', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[tarotPlayer2.name, tarotPlayer2],
					[player3.name, player3],
					[tarotPlayer4.name, tarotPlayer4],
					[player5.name, player5],
					[playerOnTwoTables.name, playerOnTwoTables],
					[tarotPlayer7.name, tarotPlayer7],
					[player8.name, player8],
					[tarotPlayer9.name, tarotPlayer9],
					[player10.name, player10],
					[tarotPlayer11.name, tarotPlayer11],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(7);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(4);
	});

	it('11 player(s) WITH 5 who KNOWS Tarot', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[tarotPlayer2.name, tarotPlayer2],
					[player3.name, player3],
					[tarotPlayer4.name, tarotPlayer4],
					[player5.name, player5],
					[player6.name, player6],
					[tarotPlayer7.name, tarotPlayer7],
					[player8.name, player8],
					[tarotPlayer9.name, tarotPlayer9],
					[player10.name, player10],
					[tarotPlayer11.name, tarotPlayer11],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(5);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(6);
	});

	it('12 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[player6.name, player6],
					[player7.name, player7],
					[player8.name, player8],
					[player9.name, player9],
					[player10.name, player10],
					[player11.name, player11],
					[player12.name, player12],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(4);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(4);
		expect(tables.has('Table 3')).toBe(true);
		expect(tables.get('Table 3')).lengthOf(4);
	});

	it('13 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[player6.name, player6],
					[player7.name, player7],
					[player8.name, player8],
					[player9.name, player9],
					[player10.name, player10],
					[player11.name, player11],
					[player12.name, player12],
					[player13.name, player13],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(1);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(4);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(4);
		expect(tables.has('Table 3')).toBe(true);
		expect(tables.get('Table 3')).lengthOf(4);
	});

	it('13 player(s) WITH 1 player who KNOWS how to play on 2 tables', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[playerOnTwoTables.name, playerOnTwoTables],
					[player7.name, player7],
					[player8.name, player8],
					[player9.name, player9],
					[player10.name, player10],
					[player11.name, player11],
					[player12.name, player12],
					[player13.name, player13],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(7);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(6);
	});

	it('14 player(s)', async () => {
		const tables = new Map([
			[
				DEFAULT_TABLE,
				new Map([
					[player1.name, player1],
					[player2.name, player2],
					[player3.name, player3],
					[player4.name, player4],
					[player5.name, player5],
					[player6.name, player6],
					[player7.name, player7],
					[player8.name, player8],
					[player9.name, player9],
					[player10.name, player10],
					[player11.name, player11],
					[player12.name, player12],
					[player13.name, player13],
					[player14.name, player14],
				]),
			],
		]);

		generateTables(tables);

		expect(tables.get(DEFAULT_TABLE)).lengthOf(0);
		expect(tables.has('Table 1')).toBe(true);
		expect(tables.get('Table 1')).lengthOf(4);
		expect(tables.has('Table 2')).toBe(true);
		expect(tables.get('Table 2')).lengthOf(4);
		expect(tables.has('Table 3')).toBe(true);
		expect(tables.get('Table 3')).lengthOf(6);
	});
});

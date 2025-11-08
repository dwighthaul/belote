import { DurableObject } from 'cloudflare:workers';
import { Buffer } from 'node:buffer';
import { log } from 'node:console';

class User {
	name!: string;
	joinedAt!: number;
	lastActiveAt!: number;
	ip!: string;

	constructor(name: string, ip: string) {
		this.name = name;
		this.joinedAt = Date.now();
		this.lastActiveAt = this.joinedAt;
		this.ip = ip;
	}
}

export interface Env {
	USER: string;
	PASSWORD: string;
	MY_DURABLE_OBJECT: DurableObjectNamespace<MyDurableObject>;
}
const BASIC_USER = 'admin';
const BASIC_PASS = 'password';
const IP_HEADER = 'CF-Connecting-IP';
const DEFAULT_TABLE = 'panama';
type Tables = Map<string, Map<string, User>>;

class UserAndTable {
	user: User;
	table: string;

	constructor(table: string, user: User) {
		this.table = table;
		this.user = user;
	}
}

export class MyDurableObject extends DurableObject<Env> {
	tables!: Tables;
	sessions: Map<WebSocket, { [key: string]: string }>;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sessions = new Map();

		ctx.blockConcurrencyWhile(async () => {
			this.tables = (await ctx.storage.get('tables')) || new Map();
			let changed = false;
			this.tables.forEach((table, _) => {
				table.forEach((user, username) => {
					if (user.ip === 'unknown' || !user.ip) {
						table.delete(username);
						changed = true;
					}
				});
			});
			if (changed) {
				await ctx.storage.put('tables', this.tables);
			}
		});
	}
	async finish(username: string, ip?: string): Promise<number> {
		this.tables = (await this.ctx.storage.get('tables')) || new Map();
		let panamaTable = this.tables.get(DEFAULT_TABLE) || new Map();

		let foundUserTable: UserAndTable | undefined;
		this.tables.forEach((table, tableName) => {
			let user = table.get(username);
			if (user === undefined) {
				return;
			}
			if (ip !== undefined && ip != user.ip) {
				return;
			}
			console.log(`user ${user.name} found on table ${tableName}`);
			foundUserTable = new UserAndTable(tableName, user);

			if (tableName != DEFAULT_TABLE) {
				table.delete(username);
				panamaTable.set(username, user);
			}
		});

		if (!foundUserTable) {
			return 404;
		}
		if (foundUserTable.table == DEFAULT_TABLE) {
			return 304;
		}

		let oldTable = this.tables.get(foundUserTable.table);
		if (oldTable) {
			for (let user of oldTable.values()) {
				panamaTable.set(user.name, user);
			}
			this.tables.set(DEFAULT_TABLE, panamaTable);
			this.tables.delete(foundUserTable.table);
		}
		await this.ctx.storage.put('tables', this.tables);
		return 200;
	}
	async quit(username: string, ip?: string): Promise<boolean> {
		this.tables = (await this.ctx.storage.get('tables')) || new Map();
		let found = false;
		let oldTableName: string = '';
		this.tables.forEach((table, tableName) => {
			let user = table.get(username);
			if (user === undefined) {
				return;
			}
			if (ip !== undefined && ip != user.ip) {
				return;
			}

			found = true;
			if (tableName != DEFAULT_TABLE) {
				oldTableName = tableName;
			}
			table.delete(username);
		});

		if (!found) {
			return false;
		}

		if (oldTableName.length === 0) {
			await this.ctx.storage.put('tables', this.tables);
		} else {
			let oldTable = this.tables.get(oldTableName);
			if (oldTable === undefined) {
				await this.ctx.storage.put('tables', this.tables);
			} else {
				let panamaTable = this.tables.get(DEFAULT_TABLE) || new Map();
				for (let user of oldTable.values()) {
					panamaTable.set(user.name, user);
				}

				this.tables.set(DEFAULT_TABLE, panamaTable);
				this.tables.delete(oldTableName);
				await this.ctx.storage.put('tables', this.tables);
			}
		}
		return true;
	}
	async join(username: string, ip: string): Promise<boolean> {
		this.tables = (await this.ctx.storage.get('tables')) || new Map();

		let existed = false;
		this.tables.forEach((table, _) => {
			if (table.has(username)) {
				const user = table.get(username);
				if (user) {
					user.ip = ip;
					user.lastActiveAt = Date.now();
					existed = true;
				}
			}
		});

		if (!existed) {
			const user = new User(username, ip);
			let table = this.tables.get(DEFAULT_TABLE);
			if (table === undefined) {
				table = new Map<string, User>();
				this.tables.set(DEFAULT_TABLE, table);
			}
			table.set(username, user);
			console.log(`User ${username} joined with IP ${ip}`);
		} else {
			console.log(`User ${username} already exists, updated last active time and IP`);
		}
		await this.ctx.storage.put('tables', this.tables);
		return !existed;
	}
	private async assignTable(tableName: string, users: User[]): Promise<void> {
		this.tables = (await this.ctx.storage.get('tables')) || new Map();
		let table = this.tables.get(tableName);
		if (!table) {
			table = new Map<string, User>();
			this.tables.set(tableName, table);
		}

		for (let user of users) {
			table.set(user.name, user);
		}
		await this.ctx.storage.put('tables', this.tables);
	}
	async getTables(): Promise<string> {
		this.tables = (await this.ctx.storage.get('tables')) || new Map();
		console.log('Tables:', this.tables);
		let pretty = JSON.stringify(Object.fromEntries(this.tables), replacer, 2);
		console.log('Pretty Tables:', pretty);
		return pretty;
	}
	async deleteTables(): Promise<boolean> {
		this.tables = (await this.ctx.storage.get('tables')) || new Map();
		if (this.tables.size == 0) {
			return false;
		}
		await this.ctx.storage.delete('tables');
		this.tables = new Map();
		return true;
	}
	async generateTables(): Promise<boolean> {
		this.tables = (await this.ctx.storage.get('tables')) || new Map();
		if (this.tables.size == 0) {
			return false;
		}

		let users: User[] = [];
		this.tables.forEach((table, _) => {
			table.forEach((user, _) => {
				users.push(user);
			});
		});

		users = shuffleArray(users);
		this.tables = new Map();
		await this.ctx.storage.put('tables', this.tables);

		let tableIndex = 1;
		while (users.length > 0) {
			if (users.length == 7) {
				let tableDe7 = users.splice(0, 7);
				await this.assignTable('table-de-7', tableDe7);
				break;
			} else if (users.length == 6) {
				let tableDe6 = users.splice(0, 6);
				await this.assignTable('table-de-6', tableDe6);
				break;
			} else if (users.length == 5) {
				let tableDe5 = users.splice(0, 5);
				await this.assignTable('table-de-5', tableDe5);
				break;
			} else if (users.length == 3) {
				let tableDe3 = users.splice(0, 3);
				await this.assignTable(DEFAULT_TABLE, tableDe3);
				break;
			} else if (users.length == 2) {
				let tableDe2 = users.splice(0, 2);
				await this.assignTable(DEFAULT_TABLE, tableDe2);
				break;
			} else if (users.length == 1) {
				let tableDe1 = users.splice(0, 1);
				await this.assignTable(DEFAULT_TABLE, tableDe1);
				break;
			}
			let tableDe4 = users.splice(0, 4);
			await this.assignTable(`table-${tableIndex}`, tableDe4);
			tableIndex++;
		}
		return true;
	}
	async clearDo(): Promise<void> {
		await this.ctx.storage.deleteAlarm();
		await this.ctx.storage.deleteAll();
		this.tables = new Map();
	}
	async notifyAll(reason: string) {
		this.sessions.forEach((_, session) => {
			session.send(`you must refresh tables because: ${reason}`);
		});
	}
	async fetch(request: Request): Promise<Response> {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);
		this.ctx.acceptWebSocket(server);
		const id = crypto.randomUUID();
		this.sessions.set(server, { id });
		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}
}

export default {
	async fetch(request: Request, env: Env, _ctx): Promise<Response> {
		const url = new URL(request.url);
		const success = {
			status: 200,
			headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
		};
		const internalError = new Response(`internal error`, { status: 500 });
		const stub = env.MY_DURABLE_OBJECT.getByName('belote');
		if (!stub) {
			return new Response('Durable Object not found', { status: 500 });
		}
		switch (url.pathname) {
			// global and unauthenticated
			case '/public/tables': {
				const tables = await stub.getTables();
				return new Response(tables, success);
			}

			// for users
			case '/me/join':
				const username = url.searchParams.get('username');
				if (!username) {
					return new Response('Missing username', { status: 400 });
				}
				const ip = request.headers.get(IP_HEADER) || 'unknown';
				await stub.join(username, ip);
				await stub.notifyAll(`user ${username} joined the Meltdown`);
				return new Response('🎉 User joined!', success);
			case '/me/meltdown': {
				const username = url.searchParams.get('username');
				if (!username) {
					return new Response('Missing username', { status: 400 });
				}
				const response = stub.fetch(request);
				console.log(`user ${username} connected to Meltdown room`);
				return response;
			}
			case '/me/quit': {
				const username = url.searchParams.get('username');
				if (!username) {
					return new Response('Missing username', { status: 400 });
				}
				const ip = request.headers.get(IP_HEADER) || 'unknown';
				const quit = await stub.quit(username, ip);
				if (quit) {
					await stub.notifyAll(`user ${username} quit the Meltdown`);
					return new Response(`🎉 User ${username} left!`, success);
				} else {
					return new Response(`User ${username} not found or not authorized`, { status: 404 });
				}
			}
			case '/me/finish': {
				const username = url.searchParams.get('username');
				if (!username) {
					return new Response('Missing username', { status: 400 });
				}
				const ip = request.headers.get(IP_HEADER) || 'unknown';
				const code = await stub.finish(username, ip);
				switch (code) {
					case 404:
						return new Response(`User ${username} not found or not authorized`, { status: 404 });
					case 304:
						return new Response(null, { status: 304 });
					case 200:
						await stub.notifyAll(`user ${username} and its friends at the same table finished their game`);
						return new Response(`🎉 User ${username} moved!`, success);
					default:
						return internalError;
				}
			}

			// NEEDS AUTH
			case '/admin/notify': {
				return authenticate(request, env, async () => {
					await stub.notifyAll('force notify all');
					return new Response(`🎉 Users notified!`, success);
				});
			}
			case '/admin/users/delete': {
				return authenticate(request, env, async () => {
					const username = url.searchParams.get('username');
					if (!username) {
						return new Response('Missing username', { status: 400 });
					}
					const deleted = await stub.quit(username, undefined);
					if (deleted) {
						await stub.notifyAll(`user ${username} deleted from Meltdown`);
						return new Response(`🎉 User ${username} deleted!`, success);
					} else {
						return new Response(`User ${username} not found`, { status: 404 });
					}
				});
			}
			case '/admin/users/finish': {
				return authenticate(request, env, async () => {
					const username = url.searchParams.get('username');
					if (!username) {
						return new Response('Missing username', { status: 400 });
					}
					const code = await stub.finish(username, undefined);
					switch (code) {
						case 404:
							return new Response(`User ${username} not found`, { status: 404 });
						case 304:
							return new Response(null, { status: 304 });
						case 200:
							await stub.notifyAll(`user ${username} finished its game`);
							return new Response(`🎉 User ${username} finished its game!`, success);
						default:
							return internalError;
					}
				});
			}
			case '/admin/users/fixtures': {
				return authenticate(request, env, async () => {
					const ip = request.headers.get(IP_HEADER) || 'unknown';
					const fixtureUsers = ['alice', 'bob', 'carol', 'dave', 'eve', 'frank', 'grace', 'heidi', 'ivan', 'judy', 'seb'];
					for (let username of fixtureUsers) {
						await stub.join(username, ip);
					}
					await stub.notifyAll('fixtures loaded');
					return new Response('🎉 Fixture users loaded!', success);
				});
			}
			case '/admin/tables/clear': {
				return authenticate(request, env, async () => {
					if (await stub.deleteTables()) {
						await stub.notifyAll(`tables cleared`);
					}
					return new Response('🎉 Tables cleared', success);
				});
			}
			case '/admin/tables/generate': {
				return authenticate(request, env, async () => {
					if (await stub.generateTables()) {
						await stub.notifyAll(`tables generated`);
					}
					return new Response('🎉 New tables generated', success);
				});
			}
			case '/admin/meltdown': {
				return authenticate(request, env, async () => {
					const response = stub.fetch(request);
					console.log('admin user connected to room');
					return response;
				});
			}
			case '/admin/storage/delete': {
				return authenticate(request, env, async () => {
					await stub.clearDo();
					await stub.notifyAll('users deleted');
					return new Response('🎉 All users cleared!', success);
				});
			}
			default:
				return new Response('not Found', { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;

async function authenticate(request: Request, env: Env, operation: () => Promise<Response>): Promise<Response> {
	const mustLoginResponse = new Response('you need to login', {
		status: 401,
		headers: { 'WWW-Authenticate': 'Basic realm="my scope", charset="UTF-8"' },
	});

	const realUser = env.USER ?? BASIC_USER;
	const realPassword = env.PASSWORD ?? BASIC_PASS;
	const authorization = request.headers.get('Authorization');
	if (!authorization) {
		return mustLoginResponse;
	}
	const [scheme, encoded] = authorization.split(' ');

	if (!encoded || scheme !== 'Basic') {
		return new Response('malformed authorization header', {
			status: 400,
		});
	}

	const credentials = Buffer.from(encoded, 'base64').toString();
	const index = credentials.indexOf(':');
	const user = credentials.substring(0, index);
	const pass = credentials.substring(index + 1);
	if (realUser != user || realPassword != pass) {
		return mustLoginResponse;
	}

	return await operation();
}

function shuffleArray<T>(array: T[]): T[] {
	const newArray = [...array]; // Create a shallow copy to avoid modifying the original array
	let currentIndex = newArray.length;
	let randomIndex: number;

	// While there remain elements to shuffle.
	while (currentIndex !== 0) {
		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
	}

	return newArray;
}

function replacer(key: string, value: any): any {
	if (value instanceof Map) {
		return Array.from(value.values());
	}
	return value;
}

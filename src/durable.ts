import { DurableObject } from 'cloudflare:workers';
import { replacer, shuffleArray } from './helpers';
import { User, UserAndTable, setReadyOrNot, setIp, setActivity, setNotReady } from './user';

type Sessions = Map<WebSocket, { [key: string]: string }>;
const DEFAULT_TABLE = 'panama';
type Table = Map<string, User>;
type Tables = Map<string, Table>;

export class MyDurableObject extends DurableObject<Env> {
	sessions: Sessions;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sessions = new Map<WebSocket, { [key: string]: string }>();
	}
	async finish(username: string, ip?: string): Promise<number> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return 304;
		}

		let panamaTable = tables.get(DEFAULT_TABLE) || new Map<string, User>();
		let foundUserTable: UserAndTable | undefined;

		outerLoop: for (const [tableName, users] of tables) {
			innerLoop: for (const [_, user] of users) {
				if (user.name != username) {
					continue innerLoop;
				}
				if (ip !== undefined && ip != user.ip) {
					return 401;
				}

				console.log(`user ${user.name} found on table ${tableName}`);
				foundUserTable = new UserAndTable(tableName, user);

				if (tableName != DEFAULT_TABLE) {
					setNotReady(user);
					users.delete(username);
					panamaTable.set(username, user);
				}
				break outerLoop;
			}
		}

		if (!foundUserTable) {
			return 404;
		}

		// don't move panama players
		if (foundUserTable.table == DEFAULT_TABLE) {
			await this.ctx.storage.put('tables', tables);
			return 200;
		}

		let oldTable = tables.get(foundUserTable.table);
		if (oldTable) {
			for (let user of oldTable.values()) {
				setNotReady(user);
				panamaTable.set(user.name, user);
			}
			tables.set(DEFAULT_TABLE, panamaTable);
			tables.delete(foundUserTable.table);
		}
		await this.ctx.storage.put('tables', tables);
		return 200;
	}
	async quit(username: string, ip?: string): Promise<number> {
		let code = await this.finish(username, ip);
		if (code != 200) {
			return code;
		}

		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		let panamaTable = tables.get(DEFAULT_TABLE) || new Map<string, User>();
		panamaTable.delete(username);
		await this.ctx.storage.put('tables', tables);
		return 200;
	}
	async setUserReadyOrNot(username: string, ready: boolean, ip?: string): Promise<boolean> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		let found = false;
		for (const [tableName, users] of tables) {
			let user = users.get(username);
			if (!user) {
				continue;
			}
			if (ip !== undefined && ip != user.ip) {
				continue;
			}
			console.log(`user ${user.name} found on table ${tableName}`);
			found = true;
			setReadyOrNot(user, ready);
			if (ip !== undefined) {
				setActivity(user);
			}
			break;
		}
		if (found) {
			await this.ctx.storage.put('tables', tables);
		}
		return found;
	}
	async join(username: string, ip: string | undefined): Promise<boolean> {
		const tables = ((await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>()) as Tables;

		let existed = false;
		for (const [username, users] of tables) {
			const user = users.get(username);
			if (user) {
				setIp(user, ip);
				existed = true;
				break;
			}
		}

		if (!existed) {
			const user = new User(username, ip);
			let table = tables.get(DEFAULT_TABLE);
			if (!table) {
				table = new Map<string, User>();
				tables.set(DEFAULT_TABLE, table);
			}
			table.set(username, user);
			console.log(`User ${username} joined with IP ${ip}`);
		} else {
			console.log(`User ${username} already exists, updated last active time and IP`);
		}
		await this.ctx.storage.put('tables', tables);
		return !existed;
	}
	async tableReady(tableName: string): Promise<boolean> {
		const tables: Tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		const table = tables.get(tableName) || new Map<string, User>();
		if (table.size == 0) {
			console.log(`table ${tableName} not found`);
			return false;
		}
		let ready = false;
		for (const [username, user] of table) {
			console.log(user);
			console.log(`setting table ${tableName} ready for user ${username}`);
			if (!user.ready) {
				setReadyOrNot(user, true);
				ready = true;
			}
		}
		if (ready) {
			await this.ctx.storage.put('tables', tables);
		}
		return ready;
	}
	async deleteTables(): Promise<boolean> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}
		await this.ctx.storage.delete('tables');
		return true;
	}
	async generateTables(): Promise<boolean> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		let panamaTable = tables.get(DEFAULT_TABLE);
		if (!panamaTable) {
			panamaTable = new Map();
		}

		let readyUsers: User[] = [];
		for (const [username, user] of panamaTable) {
			if (user.ready) {
				readyUsers.push(user);
				panamaTable.delete(username);
			}
		}

		readyUsers = shuffleArray(readyUsers);
		let tableIndex = 1;

		const assignTable = function (tableName: string, users: User[]) {
			let table = tables.get(tableName);
			if (!table) {
				table = new Map<string, User>();
				tables.set(tableName, table);
			}
			for (let user of users) {
				table.set(user.name, user);
			}
		};

		while (readyUsers.length > 0) {
			if (readyUsers.length == 7) {
				let tableDe7 = readyUsers.splice(0, 7);
				assignTable('Table de 7', tableDe7);
				break;
			} else if (readyUsers.length == 6) {
				let tableDe6 = readyUsers.splice(0, 6);
				assignTable('Table de 6', tableDe6);
				break;
			} else if (readyUsers.length == 5) {
				let tableDe5 = readyUsers.splice(0, 5);
				assignTable('Table de 5', tableDe5);
				break;
			} else if (readyUsers.length == 3) {
				let tableDe3 = readyUsers.splice(0, 3);
				assignTable(DEFAULT_TABLE, tableDe3);
				break;
			} else if (readyUsers.length == 2) {
				let tableDe2 = readyUsers.splice(0, 2);
				assignTable(DEFAULT_TABLE, tableDe2);
				break;
			} else if (readyUsers.length == 1) {
				let tableDe1 = readyUsers.splice(0, 1);
				assignTable(DEFAULT_TABLE, tableDe1);
				break;
			} else {
				const tableName = `Table ${tableIndex}`;
				if (!tables.has(tableName)) {
					let tableDe4 = readyUsers.splice(0, 4);
					assignTable(tableName, tableDe4);
				}
			}
			tableIndex++;
		}
		await this.ctx.storage.put('tables', tables);
		return true;
	}
	async clearDo(): Promise<void> {
		await this.ctx.storage.deleteAlarm();
		await this.ctx.storage.deleteAll();
	}

	// no modifying
	async getTables(): Promise<string> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		let pretty = JSON.stringify(Object.fromEntries(tables), replacer, 2);
		return pretty;
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

import { DurableObject } from 'cloudflare:workers';
import { replacer, shuffleArray } from './helpers';
import {
	User,
	UserAndTable,
	setReadyOrNot,
	setIp,
	setActivity,
	setNotReady,
	toggleCanPlayTarot,
	toggleCanPlayTwoTables,
	setInactive,
} from './user';

type Sessions = Map<WebSocket, { [key: string]: string }>;
const DEFAULT_TABLE = 'panama';
type Table = Map<string, User>;
type Tables = Map<string, Table>;
const colors = ["red", "black", "orange", "blue"]

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
	findUserAndTable(tables: Tables, searchedUsername: string, ip?: string): [Table, User] | undefined {
		outerLoop: for (const [tableName, users] of tables) {
			innerLoop: for (const [username, user] of users) {
				if (username != searchedUsername) {
					continue innerLoop;
				}
				if (ip !== undefined && ip != user.ip) {
					continue innerLoop;
				}
				console.log(`user ${user.name} found on table ${tableName}`);
				return [tables.get(tableName)!, user];
			}
		}
		return undefined;
	}
	async toggleCanPlayTarot(searchedUsername: string, ip?: string): Promise<boolean> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		let foundResult = this.findUserAndTable(tables, searchedUsername, ip);

		let found = !!foundResult;
		if (foundResult) {
			toggleCanPlayTarot(foundResult[1]);
			if (ip !== undefined) {
				setActivity(foundResult[1]);
			}
			await this.ctx.storage.put('tables', tables);
		}
		return found;
	}
	async toggleCanPlayTwoTables(searchedUsername: string, ip?: string): Promise<boolean> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		let foundResult = this.findUserAndTable(tables, searchedUsername, ip);

		let found = !!foundResult;
		if (foundResult) {
			toggleCanPlayTwoTables(foundResult[1]);
			if (ip !== undefined) {
				setActivity(foundResult[1]);
			}
			await this.ctx.storage.put('tables', tables);
		}
		return found;
	}
	async setUserReadyOrNot(searchedUsername: string, ready: boolean, ip?: string): Promise<boolean> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		let foundResult = this.findUserAndTable(tables, searchedUsername, ip);

		let found = !!foundResult;
		if (foundResult) {
			setReadyOrNot(foundResult[1], ready);
			if (ip !== undefined) {
				setActivity(foundResult[1]);
			}
			await this.ctx.storage.put('tables', tables);
		}
		return found;
	}
	async join(newUsername: string, ip: string | undefined): Promise<boolean> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();

		let existed = false;
		outerLoop: for (const [tableName, users] of tables) {
			innerLoop: for (const [username, user] of users) {
				if (username != newUsername) {
					continue innerLoop;
				}
				if (ip) {
					setIp(user, ip);
				}
				existed = true;
				break outerLoop;
			}
		}

		if (!existed) {
			const user = new User(newUsername, ip);
			let table = tables.get(DEFAULT_TABLE);
			if (!table) {
				table = new Map<string, User>();
				tables.set(DEFAULT_TABLE, table);
			}
			table.set(newUsername, user);
			console.log(`User ${newUsername} joined with IP ${ip}`);
		} else {
			console.log(`User ${newUsername} already exists, updated last active time and maybe IP`);
		}
		await this.ctx.storage.put('tables', tables);
		return !existed;
	}

	// for admin exclusively
	async adminSetUserInactive(searchedUsername: string): Promise<boolean> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		let foundResult = this.findUserAndTable(tables, searchedUsername, undefined);

		let found = !!foundResult;
		if (foundResult) {
			const user = foundResult[1];
			if (user.lastActiveAt === undefined && !user.ready) {
				// already inactive
				return false;
			}
			setInactive(user);
			await this.ctx.storage.put('tables', tables);
		}
		return found;
	}
	async adminTableReady(tableName: string): Promise<boolean> {
		const tables: Tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		const table = tables.get(tableName);
		if (!table) {
			console.log(`table ${tableName} not found`);
			return false;
		}

		let ready = false;
		for (const [username, user] of table) {
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
	async adminTableNotReady(tableName: string): Promise<boolean> {
		const tables: Tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		const table = tables.get(tableName);
		if (!table) {
			console.log(`table ${tableName} not found`);
			return false;
		}

		let notReady = false;
		for (const [username, user] of table) {
			console.log(`setting table ${tableName} not ready for user ${username}`);
			if (user.ready) {
				setReadyOrNot(user, false);
				notReady = true;
			}
		}
		if (notReady) {
			await this.ctx.storage.put('tables', tables);
		}
		return notReady;
	}

	async adminGenerateTables(): Promise<boolean> {
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

		let users = shuffleArray(readyUsers);
		users.forEach((user) => {
			user.teams = [];
		});
		this.affectTables(tables, users);
		await this.ctx.storage.put('tables', tables);
		return true;
	}

	affectTables(tables: Tables, users: User[]): void {
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
		// Index 0 for 4,Index 1 for 5,Index 2 for 6,Index 3 for 7,
		let maxAllocationPossible = [
			Math.floor(users.length/4),
			//Maximum de nombre de tables qui peuvent jouer au tarot
			Math.floor(users.filter((user) => user.canPlayTarot).length/5),
			Math.floor(users.length/6),
			//Maximum de nombre de tables ayant un joueur qui peut jouer sur deux tables
			users.filter((user) => user.canPlayTwoTables).length];
		let candidates = [];
		for (let t4 = 0; t4 <= maxAllocationPossible[0]; t4++) {
			for (let t5 = 0; t5 <= maxAllocationPossible[1]; t5++) {
				for (let t6 = 0; t6 <= maxAllocationPossible[2]; t6++) {
					for (let t7 = 0; t7 <= maxAllocationPossible[3]; t7++) {
						const usedPlayers = 4 * t4 + 5 * t5 + 6 * t6 + 7 * t7;
						if (usedPlayers <= users.length) {
							candidates.push([t4, t5, t6, t7]);
						}
					}
				}
			}
		}
		if (candidates.length===0) {
			assignTable(DEFAULT_TABLE, users);
		}

		const usedPlayers = (p: number[]): number  =>{
			return p[0] * 4 + p[1] * 5 + p[2] * 6 + p[3] * 7;
		}

		const combinationsWithNumberMatchingTotalParticipants = candidates.filter(combination => usedPlayers(combination) === users.length);
		let bestCombinationPossible: number[] = [];
		let currentPlayers = users;
		if (combinationsWithNumberMatchingTotalParticipants.length != 0) {
			//We find the one that max the number of tables of 4
			const maxT4 = Math.max(...combinationsWithNumberMatchingTotalParticipants.map(combination => combination[0]));
			bestCombinationPossible = combinationsWithNumberMatchingTotalParticipants.filter(combination => combination[0] === maxT4)[0];
		} else {
			//We try to find the combinations that maxes the number of participants 
			let secondBestCombinationParticipantNumber = users.length;
			let secondBestCombinations = [];
			do {
				secondBestCombinationParticipantNumber--;
				secondBestCombinations = candidates.filter(combination => usedPlayers(combination) === secondBestCombinationParticipantNumber);
			} while(secondBestCombinations.length == 0)
			//Maximize number of tables of 4
			const maxT4 = Math.max(...secondBestCombinations.map(combination => combination[0]));
			bestCombinationPossible = secondBestCombinations.filter(combination => combination[0] === maxT4)[0];

			//Now we assign the players that would be left to Panama...
			let currentPlayersThatDontTarotOrSeven = currentPlayers.filter((user) => !user.canPlayTarot && !user.canPlayTwoTables);
			let numberOfPlayersToGoToPanama = currentPlayers.length - secondBestCombinationParticipantNumber;
			let playersSelected = [];
			if (currentPlayersThatDontTarotOrSeven.length >= numberOfPlayersToGoToPanama) {
				playersSelected = currentPlayersThatDontTarotOrSeven.slice(0,numberOfPlayersToGoToPanama);
			} else {
				playersSelected = currentPlayers.filter((user) => (!user.canPlayTarot || bestCombinationPossible[1] == 0) && (!user.canPlayTwoTables || bestCombinationPossible[3] == 0)).slice(0,numberOfPlayersToGoToPanama);
			}
			assignTable(DEFAULT_TABLE, playersSelected);
			currentPlayers = currentPlayers.filter((user) => !playersSelected.find((userSelected) => userSelected.name === user.name));
		}

		//Tarot is priority
		while(currentPlayers.length!=0) {
			var nextTableAvailable = 1;
			while (tables.get(`Table ${nextTableAvailable}`)) {
				nextTableAvailable ++;
			}
			let playersSelected: User[] = [];
			// 5 priority for tarot
			if (bestCombinationPossible[1]!=0) {
				playersSelected = currentPlayers.filter((user) => user.canPlayTarot).splice(0, 5);
				bestCombinationPossible[1]--;
			} else {
				// 7 priority for users playing two tables
				if (bestCombinationPossible[3]!=0) {
					let usersThanCanPlayTwoTables = currentPlayers.filter((user) => user.canPlayTwoTables);
					playersSelected = [
						usersThanCanPlayTwoTables[0],
						...currentPlayers.filter((user) => user.name !== usersThanCanPlayTwoTables[0].name).slice(0, 6),
					];
					bestCombinationPossible[3]--;
				} else {
					if (bestCombinationPossible[0] !=0) {
						playersSelected = currentPlayers.splice(0, 4);
						bestCombinationPossible[0]--;
					} else {
						playersSelected = currentPlayers.splice(0, 6);
						bestCombinationPossible[2]--;
					}
				}
			}
			var nextTableAvailable = 1;
			while (tables.get(`Table ${nextTableAvailable}`)) {
				nextTableAvailable ++;
			}
			if (playersSelected.length != 5) {
				let colorsNeeded = Math.ceil(playersSelected.length /2);
				for (let index = 0; index < playersSelected.length; index++) {
					playersSelected[index].teams.push(colors[index%colorsNeeded]);
				}
				if (playersSelected.length === 7) {
					playersSelected[0].teams.push(colors[3]);
				}
			}
			
			assignTable(`Table ${nextTableAvailable}`, playersSelected);
			currentPlayers = currentPlayers.filter((user) => !playersSelected.find((userSelected) => userSelected.name === user.name))
		}
	}

	async adminShuffleTables(): Promise<boolean> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		let panamaTable = tables.get(DEFAULT_TABLE) || new Map<string, User>();

		// move all ready to panama
		for (const [tableName, table] of tables) {
			if (tableName == DEFAULT_TABLE) {
				continue;
			}
			for (const [username, user] of table) {
				table.delete(username);
				panamaTable.set(username, user);
			}
			tables.delete(tableName);
		}

		await this.ctx.storage.put('tables', tables);

		// regenerate
		return await this.adminGenerateTables();
	}
	async adminDeleteAllTables(): Promise<boolean> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}
		await this.ctx.storage.delete('tables');
		return true;
	}
	async adminDeleteTable(tableName: string): Promise<boolean> {
		if (tableName == DEFAULT_TABLE) {
			return false;
		}
		const tables: Tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		if (tables.size == 0) {
			return false;
		}

		const table = tables.get(tableName);
		if (!table) {
			return false;
		}

		const panamaTable = tables.get(DEFAULT_TABLE) || new Map<string, User>();
		for (const [username, user] of table) {
			panamaTable.set(username, user);
		}

		tables.delete(tableName);
		await this.ctx.storage.put('tables', tables);
		return true;
	}

	// no modifying
	async getTables(): Promise<string> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		let entries = Object.fromEntries(tables);
		entries = Object.keys(entries).sort((table1,table2) => {
			if (table1===DEFAULT_TABLE) {
				return -1;
			}
			if (table2===DEFAULT_TABLE) {
				return 1;
			}
			return table1.localeCompare(table2);
		}).reduce(
			(obj, key) => {
				obj[key] = entries[key]; 
				return obj;
			}, {} as Record<string, typeof entries[keyof typeof entries]>
		);
		const pretty = JSON.stringify(entries, replacer, 2);
		return pretty;
	}
	async getUsers(): Promise<string> {
		const tables = (await this.ctx.storage.get<Tables>('tables')) || new Map<string, Table>();
		const allUsers: User[] = [];
		for (const [_, users] of tables) {
			allUsers.push(...users.values());
		}
		let pretty = JSON.stringify(allUsers, replacer, 2);
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
	 async clearDo(): Promise<void> {
	 	await this.ctx.storage.deleteAlarm();
	 	await this.ctx.storage.deleteAll();
	 }
}

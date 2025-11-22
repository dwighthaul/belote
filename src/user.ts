export function setIp(user: User, ip: string | undefined) {
	user.ip = ip;
	user.lastActiveAt = Date.now();
}

export function setNoTeam(user: User) {
	user.teams = [];
}

export function setNotReady(user: User) {
	user.ready = false;
	user.lastActiveAt = Date.now();
}

export function setActivity(user: User) {
	user.lastActiveAt = Date.now();
}

export function setInactive(user: User) {
	user.lastActiveAt = undefined;
	user.ready = false;
}

export function setReadyOrNot(user: User, ready: boolean): boolean {
	user.ready = ready;
	return user.ready;
}
export function toggleCanPlayTarot(user: User): boolean {
	user.canPlayTarot = !user.canPlayTarot;
	return user.canPlayTarot;
}

export function toggleCanPlayTwoTables(user: User): boolean {
	user.canPlayTwoTables = !user.canPlayTwoTables;
	return user.canPlayTwoTables;
}

export function readyPlayer(name: string): User {
	const user = new User(name, undefined);
	user.ready = true;
	return user;
}

export function readyPlayerTarot(name: string): User {
	const user = new User(name, undefined);
	user.ready = true;
	user.canPlayTarot = true;
	return user;
}

export function readyPlayerTwoTables(name: string): User {
	const user = new User(name, undefined);
	user.ready = true;
	user.canPlayTwoTables = true;
	return user;
}

export function readyPlayerTarotAndTwoTables(name: string): User {
	const user = new User(name, undefined);
	user.ready = true;
	user.canPlayTarot = true;
	user.canPlayTwoTables = true;
	return user;
}

export class User {
	name: string;
	ready: boolean;
	canPlayTarot: boolean;
	canPlayTwoTables: boolean;
	lastActiveAt: number | undefined;
	ip: string | undefined;
	teams: string[];

	constructor(name: string, ip: string | undefined) {
		this.name = name;
		if (this.ip) {
			this.lastActiveAt = Date.now();
		}
		this.ip = ip;
		this.ready = false;
		this.canPlayTarot = false;
		this.canPlayTwoTables = false;
		this.teams = [];
	}
}

export class UserAndTable {
	user: User;
	table: string;

	constructor(table: string, user: User) {
		this.table = table;
		this.user = user;
	}
}

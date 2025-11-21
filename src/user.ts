export function setIp(user: User, ip: string | undefined) {
	user.ip = ip;
	user.lastActiveAt = Date.now();
}

// function setReady(user: User) {
// 	user.ready = true;
// 	user.lastActiveAt = Date.now();
// }

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

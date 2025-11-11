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

export function setReadyOrNot(user: User, ready: boolean) {
	user.ready = ready;
}

export class User {
	name: string;
	ready: boolean;
	joinedAt: number;
	lastActiveAt: number | undefined;
	ip: string | undefined;

	constructor(name: string, ip: string | undefined) {
		this.name = name;
		this.joinedAt = Date.now();
		if (ip !== undefined) {
			this.lastActiveAt = this.joinedAt;
		}
		this.ip = ip;
		this.ready = false;
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

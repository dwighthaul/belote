import { DurableObject } from 'cloudflare:workers';
import { Buffer } from 'node:buffer';

class User {
	name!: string;
	joinedAt!: number;
	table!: string;

	constructor(name: string) {
		this.name = name;
		this.joinedAt = Date.now();
		this.table = 'panama';
	}
}

export interface Env {
	USER: string;
	PASSWORD: string;
	MY_DURABLE_OBJECT: DurableObjectNamespace<MyDurableObject>;
}
const BASIC_USER = 'admin';
const BASIC_PASS = 'password';

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

export class MyDurableObject extends DurableObject<Env> {
	users!: Map<string, User>;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		ctx.blockConcurrencyWhile(async () => {
			this.users = (await ctx.storage.get('users')) || new Map<string, User>();

			// cleanup
			if (this.users.delete(undefined as unknown as string) || this.users.delete('')) {
				await ctx.storage.put('users', this.users);
			}
		});
	}
	async getUsers(): Promise<string> {
		const users: Map<string, User> = (await this.ctx.storage.get('users')) || new Map<string, User>();
		let pretty = JSON.stringify(Array.from(users.values()), null, 2);
		console.log('Pretty Users:', pretty);
		return pretty;
		// if (users) {
		// 	return users;
		// }
		// return new Map<string, User>();
		// return (await this.ctx.storage.get('users')) || new Map<string, User>();
	}
	async join(username: string): Promise<string> {
		let user: User | undefined = this.users.get(username);
		if (!user) {
			user = new User(username);
			this.users.set(username, user);
			await this.ctx.storage.put('users', this.users);
		}
		let pretty = JSON.stringify(user, null, 2);
		return pretty;
	}
	private async assignTable(users: User[], table: string): Promise<void> {
		for (let user of users) {
			user.table = table;
			this.users.set(user.name, user);
		}
		await this.ctx.storage.put('users', this.users);
	}
	async tables(): Promise<string> {
		const tables: Map<string, User[]> = (await this.ctx.storage.get('tables')) || new Map<string, User[]>();
		let pretty = JSON.stringify(Object.fromEntries(tables), null, 2);
		console.log('Pretty Tables:', pretty);
		return pretty;
	}
	async generateTables() {
		let users = shuffleArray(Array.from(this.users.values()));
		let tables: Map<string, User[]> = new Map<string, User[]>();
		let tableIndex = 1;

		while (users.length > 0) {
			if (users.length == 7) {
				let tableDe7 = users.splice(0, 7);
				await this.assignTable(tableDe7, 'table-de-7');
				tables.set('table-de-7', tableDe7);
				break;
			} else if (users.length == 6) {
				let tableDe6 = users.splice(0, 6);
				await this.assignTable(tableDe6, 'table-de-6');
				tables.set('table-de-6', tableDe6);
				break;
			} else if (users.length == 5) {
				let tableDe5 = users.splice(0, 5);
				await this.assignTable(tableDe5, 'table-de-5');
				tables.set('table-de-5', tableDe5);
				break;
			} else if (users.length == 3) {
				let tableDe3 = users.splice(0, 3);
				await this.assignTable(tableDe3, 'panama');
				tables.set('panama', tableDe3);
				break;
			} else if (users.length == 2) {
				let tableDe2 = users.splice(0, 2);
				await this.assignTable(tableDe2, 'bataille_ou_echecs');
				tables.set('bataille_ou_echecs', tableDe2);
				break;
			} else if (users.length == 1) {
				let tableDe1 = users.splice(0, 1);
				await this.assignTable(tableDe1, 'solitaire');
				tables.set('solitaire', tableDe1);
				break;
			}
			let tableDe4 = users.splice(0, 4);
			await this.assignTable(tableDe4, 'belote');
			tables.set(`table-${tableIndex}`, tableDe4);
			tableIndex++;
		}

		await this.ctx.storage.put('tables', tables);
	}
	async clearDo(): Promise<void> {
		await this.ctx.storage.deleteAlarm();
		await this.ctx.storage.deleteAll();
		this.users = new Map<string, User>();
	}
}

export default {
	async fetch(request: Request, env: Env, _ctx): Promise<Response> {
		const url = new URL(request.url);
		const stub = env.MY_DURABLE_OBJECT.getByName('belote');
		if (!stub) {
			return new Response('Durable Object not found', { status: 500 });
		}
		switch (url.pathname) {
			case '/join':
				// const username = await request.formData().then((data) => data.get('username') as string);
				const body = (await request.json()) as { username?: string };
				const username = body?.username;
				if (!username) {
					return new Response('Missing username', { status: 400 });
				}

				const user = await stub.join(username);
				return new Response(user, {
					status: 200,
					headers: {
						'Content-Type': 'application/json;charset=utf-8',
					},
				});
			case '/users': {
				const users = await stub.getUsers();
				return new Response(users, {
					status: 200,
					headers: {
						'Content-Type': 'application/json;charset=utf-8',
					},
				});
			}
			case '/tables': {
				const tables = await stub.tables();
				return new Response(tables, {
					status: 200,
					headers: {
						'Content-Type': 'application/json;charset=utf-8',
					},
				});
			}
			case '/generate_tables': {
				return authenticate(request, env, async () => {
					await stub.generateTables();

					return new Response('🎉 New tables generated', {
						status: 200,
						headers: {
							'Cache-Control': 'no-store',
						},
					});
				});
			}
			case '/users/clear': {
				return authenticate(request, env, async () => {
					await stub.clearDo();

					return new Response('🎉 All users cleared!', {
						status: 200,
						headers: {
							'Cache-Control': 'no-store',
						},
					});
				});
			}
			default:
				return new Response('not Found', { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;

async function authenticate(request: Request, env: Env, operation: () => Promise<Response>): Promise<Response> {
	const mustLoginResponse = new Response('you need to login.', {
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
		return new Response('malformed authorization header.', {
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

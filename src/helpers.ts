import { Env } from './index';

export async function authenticate(request: Request, env: Env, operation: () => Promise<Response>): Promise<Response> {
	if (env.AUTHENTICATION == 'false') {
		return await operation();
	}
	const mustLoginResponse = new Response('you need to login', {
		status: 401,
		headers: { 'WWW-Authenticate': 'Basic realm="my scope", charset="UTF-8"' },
	});

	const realUser = env.ADMIN_USER;
	const realPassword = env.ADMIN_PASSWORD;
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

export function shuffleArray<T>(array: T[]): T[] {
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

export function replacer(key: string, value: any): any {
	if (value instanceof Map) {
		return Array.from(value.values());
	}
	return value;
}

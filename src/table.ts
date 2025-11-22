import { shuffleArray } from './helpers';
import { User } from './user';
export const DEFAULT_TABLE = 'panama';
export type Table = Map<string, User>;
export type Tables = Map<string, Table>;

const COLORS = ['red', 'black', 'orange', 'blue'];

export function generateTables(tables: Tables) {
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
	affectTables(tables, users);
}

export function affectTables(tables: Tables, users: User[]): void {
	const assignTable = function (tableName: string, users: User[]) {
		let table: Table | undefined = tables.get(tableName);
		if (!table) {
			table = new Map();
			tables.set(tableName, table);
		}
		for (let user of users) {
			table.set(user.name, user);
		}
	};
	// Index 0 for 4,Index 1 for 5,Index 2 for 6,Index 3 for 7,
	let maxAllocationPossible = [
		Math.floor(users.length / 4),
		//Maximum de nombre de tables qui peuvent jouer au tarot
		Math.floor(users.filter((user) => user.canPlayTarot).length / 5),
		Math.floor(users.length / 6),
		//Maximum de nombre de tables ayant un joueur qui peut jouer sur deux tables
		users.filter((user) => user.canPlayTwoTables).length,
	];
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
	if (candidates.length === 0) {
		assignTable(DEFAULT_TABLE, users);
	}

	const usedPlayers = (p: number[]): number => {
		return p[0] * 4 + p[1] * 5 + p[2] * 6 + p[3] * 7;
	};

	const combinationsWithNumberMatchingTotalParticipants = candidates.filter((combination) => usedPlayers(combination) === users.length);
	let bestCombinationPossible: number[] = [];
	let currentPlayers = [...users];
	if (combinationsWithNumberMatchingTotalParticipants.length != 0) {
		//We find the one that max the number of tables of 4
		const maxT4 = Math.max(...combinationsWithNumberMatchingTotalParticipants.map((combination) => combination[0]));
		bestCombinationPossible = combinationsWithNumberMatchingTotalParticipants.filter((combination) => combination[0] === maxT4)[0];
	} else {
		//We try to find the combinations that maxes the number of participants
		let secondBestCombinationParticipantNumber = users.length;
		let secondBestCombinations = [];
		do {
			secondBestCombinationParticipantNumber--;
			secondBestCombinations = candidates.filter((combination) => usedPlayers(combination) === secondBestCombinationParticipantNumber);
		} while (secondBestCombinations.length == 0);
		//Maximize number of tables of 4
		const maxT4 = Math.max(...secondBestCombinations.map((combination) => combination[0]));
		bestCombinationPossible = secondBestCombinations.filter((combination) => combination[0] === maxT4)[0];

		//Now we assign the players that would be left to Panama...
		let currentPlayersThatDontTarotOrSeven = currentPlayers.filter((user) => !user.canPlayTarot && !user.canPlayTwoTables);
		let numberOfPlayersToGoToPanama = currentPlayers.length - secondBestCombinationParticipantNumber;
		let playersSelected = [];
		if (currentPlayersThatDontTarotOrSeven.length >= numberOfPlayersToGoToPanama) {
			playersSelected = currentPlayersThatDontTarotOrSeven.slice(0, numberOfPlayersToGoToPanama);
		} else {
			playersSelected = currentPlayers
				.filter(
					(user) => (!user.canPlayTarot || bestCombinationPossible[1] == 0) && (!user.canPlayTwoTables || bestCombinationPossible[3] == 0)
				)
				.slice(0, numberOfPlayersToGoToPanama);
		}
		assignTable(DEFAULT_TABLE, playersSelected);
		currentPlayers = currentPlayers.filter((user) => !playersSelected.find((userSelected) => userSelected.name === user.name));
	}

	//Tarot is priority
	while (currentPlayers.length != 0) {
		var nextTableAvailable = 1;
		while (tables.get(`Table ${nextTableAvailable}`)) {
			nextTableAvailable++;
		}
		let playersSelected: User[] = [];
		// 5 priority for tarot
		if (bestCombinationPossible[1] != 0) {
			playersSelected = currentPlayers.filter((user) => user.canPlayTarot).splice(0, 5);
			bestCombinationPossible[1]--;
		} else {
			// 7 priority for users playing two tables
			if (bestCombinationPossible[3] != 0) {
				let usersThanCanPlayTwoTables = currentPlayers.filter((user) => user.canPlayTwoTables);
				playersSelected = [
					usersThanCanPlayTwoTables[0],
					...currentPlayers.filter((user) => user.name !== usersThanCanPlayTwoTables[0].name).slice(0, 6),
				];
				bestCombinationPossible[3]--;
			} else {
				if (bestCombinationPossible[0] != 0) {
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
			nextTableAvailable++;
		}
		if (playersSelected.length != 5) {
			let colorsNeeded = Math.ceil(playersSelected.length / 2);
			for (let index = 0; index < playersSelected.length; index++) {
				playersSelected[index].teams.push(COLORS[index % colorsNeeded]);
			}
			if (playersSelected.length === 7) {
				playersSelected[0].teams.push(COLORS[3]);
			}
		}

		assignTable(`Table ${nextTableAvailable}`, playersSelected);
		currentPlayers = currentPlayers.filter((user) => !playersSelected.find((userSelected) => userSelected.name === user.name));
	}
}

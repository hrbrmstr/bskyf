import wordwrap from 'wordwrapjs';
import boxen from 'boxen';
import chalk from 'chalk';

import { Subscription } from '@atproto/xrpc-server';
import { cborToLexRecord, readCar } from '@atproto/repo';

const SERVICE = 'bsky.social';
const COLLECTION = 'app.bsky.feed.post';
const CREATE_ACTION = 'create';
const WRAP_WIDTH = 60;

const subscription = new Subscription({
  service: `wss://${SERVICE}`,
  method: 'com.atproto.sync.subscribeRepos',
  getState: () => ({}),
  validate: (value) => value,
});

for await (const event of subscription) {
	
	try { 
		const car = await readCar(event.blocks);

		for (const op of event.ops) {
			if (op.action !== CREATE_ACTION) continue;

			const recBytes = car.blocks.get(op.cid)
			if (!recBytes) continue;

			const rec = cborToLexRecord(recBytes);

			const coll = op.path.split('/')[ 0 ];
			if (coll !== COLLECTION) continue;

			console.log(
				boxen(
					`${chalk.blue(event.repo)} @ ${chalk.gray(rec.createdAt)}\n\n${chalk.cyan(wordwrap.wrap(rec.text, { width: WRAP_WIDTH }))}`,
					{ padding: 1 }
				)
			);
		}
	} catch {
	}
	
}

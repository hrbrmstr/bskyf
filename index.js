import wordwrap from 'wordwrapjs';
import boxen from 'boxen';
import chalk from 'chalk';

import { Subscription } from '@atproto/xrpc-server';
import { cborToLexRecord, readCar } from '@atproto/repo';

const SERVICE = 'bsky.social';
const METHOD = 'com.atproto.sync.subscribeRepos';
const COLLECTION = 'app.bsky.feed.post';
const CREATE_ACTION = 'create';
const WRAP_WIDTH = 60;

const args = process.argv.slice(2);

const searchString = (args.length === 0) ? "" : args[ 0 ].toLowerCase();

const subscription = new Subscription({
  service: `wss://${SERVICE}`,
  method: METHOD,
  getState: () => ({}),
  validate: (value) => value,
});

/**
 * Handles an event asynchronously.
 * 
 * @param {object} event - The event object to handle.
 * @returns {Promise}
 */
async function handleEvent(event) {
  try {
    const car = await readCar(event.blocks);

    for (const op of event.ops) {
      if (op.action !== CREATE_ACTION) continue;

      const recBytes = car.blocks.get(op.cid);
      if (!recBytes) continue;

      const rec = cborToLexRecord(recBytes);

      const coll = op.path.split('/')[ 0 ];
      if (coll !== COLLECTION) continue;

      if ((args.length === 0) || (rec.text.toLowerCase().includes(searchString))) {

        // console.debug(event);
        // console.debug(rec);

        console.log(
          boxen(
            `${chalk.blue(event.repo)} @ ${chalk.gray(rec.createdAt)}\n\n${chalk.cyan(wordwrap.wrap(rec.text, { width: WRAP_WIDTH }))}`,
            { padding: 1 }
          )
        );
      }
    }
  } catch {
    // Add error handling here
  }
}

for await (const event of subscription) {
  handleEvent(event);
}

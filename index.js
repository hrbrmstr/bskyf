import wordwrap from 'wordwrapjs';
import boxen from 'boxen';
import chalk from 'chalk';

import * as level from 'level';
const { Level } = level

const handles = new Level('handles')

process.on('SIGINT', () => {
  console.log('Ctrl+C pressed, exiting...');
  handles.close()
  process.exit();
});

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

async function getHandle(did) {

  var who = null;
  try {
    who = await handles.get(did)
  } catch (err) {
    const res = await fetch(`https://plc.directory/${did}`)
    const rec = await res.json()
    who = rec.alsoKnownAs[ 0 ].replace(/^[^:]+:\/\//, "")
    await handles.put(did, who)
  } finally {
    return who
  }
  
}

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
        
        const handle = await getHandle(event.repo)
        
        console.log(
          boxen(
            `${chalk.blue(handle)} @ ${chalk.gray(rec.createdAt)}\n\n${chalk.cyan(wordwrap.wrap(rec.text, { width: WRAP_WIDTH }))}`,
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
    
import fs from 'fs';
import readline from 'readline';

async function findNewMsgs() {
  const fileStream = fs.createReadStream('C:\\Users\\tejsu\\.gemini\\antigravity-ide\\brain\\06602132-3815-4cee-aa9c-0fb7e7c77be2\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('newmsgs.css') && line.includes('love-counter')) {
      const parsed = JSON.parse(line);
      console.log("FOUND STEP:", parsed.step_index);
      fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\found_step.json', line);
      return;
    }
  }
  console.log("Not found in transcript.jsonl, trying transcript_full.jsonl...");
  const fileStreamFull = fs.createReadStream('C:\\Users\\tejsu\\.gemini\\antigravity-ide\\brain\\06602132-3815-4cee-aa9c-0fb7e7c77be2\\.system_generated\\logs\\transcript_full.jsonl');
  const rlFull = readline.createInterface({ input: fileStreamFull, crlfDelay: Infinity });
  for await (const line of rlFull) {
    if (line.includes('newmsgs.css') && line.includes('love-counter')) {
      const parsed = JSON.parse(line);
      console.log("FOUND STEP FULL:", parsed.step_index);
      fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\found_step.json', line);
      return;
    }
  }
}
findNewMsgs();

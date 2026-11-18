import fs from 'fs';
import readline from 'readline';

async function findOldestNewmsgs() {
  const fileStream = fs.createReadStream('C:\\Users\\tejsu\\.gemini\\antigravity-ide\\brain\\06602132-3815-4cee-aa9c-0fb7e7c77be2\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('newmsgs.css') && (line.includes('.home-hero-title') || line.includes('.love-counter') || line.includes('.hp-house'))) {
      const parsed = JSON.parse(line);
      console.log("MATCH on step:", parsed.step_index, "content len:", parsed.content?.length);
      fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\step_' + parsed.step_index + '.txt', parsed.content || JSON.stringify(parsed));
    }
  }
}
findOldestNewmsgs();

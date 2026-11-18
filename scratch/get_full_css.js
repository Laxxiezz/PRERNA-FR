import fs from 'fs';
import readline from 'readline';

async function getFullContent() {
  const fileStream = fs.createReadStream('C:\\Users\\tejsu\\.gemini\\antigravity-ide\\brain\\06602132-3815-4cee-aa9c-0fb7e7c77be2\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('Total Lines: 385') && line.includes('newmsgs.css')) {
      const parsed = JSON.parse(line);
      console.log("FOUND FULL FILE VIEW!");
      fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\full_old_newmsgs.txt', parsed.content);
      return;
    }
  }
}
getFullContent();

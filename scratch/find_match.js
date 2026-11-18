import fs from 'fs';
import readline from 'readline';

async function findCommit() {
  const fileStream = fs.createReadStream('C:\\Users\\tejsu\\.gemini\\antigravity-ide\\brain\\06602132-3815-4cee-aa9c-0fb7e7c77be2\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('.home-inner-container') || line.includes('.home-hero-title') || line.includes('.love-counter-grid')) {
      console.log("MATCH FOUND!");
      fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\matched_line.json', line);
      return;
    }
  }
  console.log("No match found in transcript.jsonl");
}
findCommit();

import fs from 'fs';
import readline from 'readline';

async function findPreStep300() {
  const fileStream = fs.createReadStream('C:\\Users\\tejsu\\.gemini\\antigravity-ide\\brain\\06602132-3815-4cee-aa9c-0fb7e7c77be2\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('newmsgs.css') && (line.includes('.home-inner-container') || line.includes('.love-counter'))) {
      const parsed = JSON.parse(line);
      if (parsed.step_index < 320) {
        console.log("STEP < 320:", parsed.step_index);
        const text = parsed.content || JSON.stringify(parsed);
        fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\step_' + parsed.step_index + '.txt', text);
      }
    }
  }
}
findPreStep300();

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const brainDir = 'C:\\Users\\tejsu\\.gemini\\antigravity-ide\\brain';
const convDirs = fs.readdirSync(brainDir);

async function searchAll() {
  for (const dir of convDirs) {
    const fullPath = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(fullPath)) continue;
    console.log("Checking:", dir);

    const fileStream = fs.createReadStream(fullPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (line.includes('.home-inner-container') || line.includes('.love-counter-grid')) {
        const parsed = JSON.parse(line);
        if (parsed.tool_calls) {
          for (const tc of parsed.tool_calls) {
            const content = tc.args?.CodeContent || tc.args?.ReplacementContent;
            if (content && (content.includes('.home-inner-container') || content.includes('.love-counter-grid'))) {
              console.log("!!! FOUND EXACT CSS SOURCE IN CONV:", dir, "step:", parsed.step_index);
              fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\original_home_recovered.css', content);
              return;
            }
          }
        }
      }
    }
  }
  console.log("Done searching all conversations.");
}
searchAll();

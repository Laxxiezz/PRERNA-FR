import fs from 'fs';
import path from 'path';
import readline from 'readline';

const brainDir = 'C:\\Users\\tejsu\\.gemini\\antigravity-ide\\brain';
const convDirs = fs.readdirSync(brainDir);

async function searchAll() {
  for (const dir of convDirs) {
    const fullPath = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(fullPath)) continue;

    const fileStream = fs.createReadStream(fullPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (line.includes('newmsgs.css') && (line.includes('.love-counter {') || line.includes('.home-hero-title {') || line.includes('.love-counter-head {'))) {
        const parsed = JSON.parse(line);
        console.log("MATCH on step:", parsed.step_index, "in conv:", dir);
        for (const tc of parsed.tool_calls || []) {
          const content = tc.args?.CodeContent || tc.args?.ReplacementContent;
          if (content && content.includes('.love-counter')) {
            console.log("FOUND EXACT CSS FILE!");
            fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\exact_original_newmsgs.css', content);
            return;
          }
        }
      }
    }
  }
}
searchAll();

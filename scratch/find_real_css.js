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
      if (line.includes('"TargetFile":"c:\\\\Users\\\\tejsu\\\\Music\\\\for-perru-lotus-message-photo\\\\src\\\\styles\\\\newmsgs.css"') ||
          line.includes('"TargetFile":"C:\\\\Users\\\\tejsu\\\\Music\\\\for-perru-lotus-message-photo\\\\src\\\\styles\\\\newmsgs.css"')) {
        const parsed = JSON.parse(line);
        console.log("MATCH ON WRITE TARGET:", parsed.step_index);
        for (const tc of parsed.tool_calls || []) {
          if (tc.args?.TargetFile?.toLowerCase().includes('newmsgs.css')) {
            const content = tc.args.CodeContent || tc.args.ReplacementContent;
            if (content && !content.includes('import fs from') && !content.includes('VINTAGE LIVING ROOM')) {
              console.log("FOUND AUTHENTIC newmsgs.css at step:", parsed.step_index, "length:", content.length);
              fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\real_original_newmsgs.css', content);
              return;
            }
          }
        }
      }
    }
  }
}
searchAll();

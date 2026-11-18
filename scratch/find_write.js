import fs from 'fs';
import readline from 'readline';

async function scan() {
  const fileStream = fs.createReadStream('C:\\Users\\tejsu\\.gemini\\antigravity-ide\\brain\\06602132-3815-4cee-aa9c-0fb7e7c77be2\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('TargetFile') && line.includes('newmsgs.css') && line.includes('.love-counter')) {
      const parsed = JSON.parse(line);
      for (const tc of parsed.tool_calls || []) {
        if (tc.args && tc.args.TargetFile && tc.args.TargetFile.includes('newmsgs.css')) {
          console.log("FOUND WRITE TO newmsgs.css at step", parsed.step_index);
          const content = tc.args.CodeContent || tc.args.ReplacementContent;
          fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\original_newmsgs.css', content);
          return;
        }
      }
    }
  }
}
scan();

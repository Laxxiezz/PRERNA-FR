import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\found_step.json', 'utf8'));

// Look inside tool_calls or arguments
if (data.tool_calls) {
  for (const tc of data.tool_calls) {
    if (tc.args && (tc.args.CodeContent || tc.args.ReplacementContent)) {
      const content = tc.args.CodeContent || tc.args.ReplacementContent;
      console.log("Found tool call content length:", content.length);
      fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\recovered_css.css', content);
      break;
    }
  }
}

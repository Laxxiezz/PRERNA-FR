import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\matched_line.json', 'utf8'));

if (data.tool_calls) {
  for (const tc of data.tool_calls) {
    console.log("TOOL:", tc.name, tc.args?.TargetFile);
    if (tc.args?.CodeContent) {
      fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\original_home_styles.css', tc.args.CodeContent);
      console.log("SAVED CodeContent, len:", tc.args.CodeContent.length);
    }
  }
}

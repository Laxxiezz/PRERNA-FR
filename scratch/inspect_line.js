import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\matched_line.json', 'utf8'));

console.log("Keys:", Object.keys(data));
console.log("Type:", data.type);
console.log("Status:", data.status);
if (data.content) {
  console.log("Content preview:", data.content.slice(0, 300));
}
if (data.tool_calls) {
  console.log("tool_calls len:", data.tool_calls.length);
}

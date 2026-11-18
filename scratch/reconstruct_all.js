import fs from 'fs';
import readline from 'readline';

async function getAllChunks() {
  const fileStream = fs.createReadStream('C:\\Users\\tejsu\\.gemini\\antigravity-ide\\brain\\06602132-3815-4cee-aa9c-0fb7e7c77be2\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let allLines = {};

  for await (const line of rl) {
    if (line.includes('File Path: `file:///c:/Users/tejsu/Music/for-perru-lotus-message-photo/src/styles/newmsgs.css`')) {
      const parsed = JSON.parse(line);
      const text = parsed.content || (parsed.tool_calls?.[0]?.content) || "";
      if (typeof text === 'string') {
        const lines = text.split('\n');
        for (const l of lines) {
          const match = l.match(/^(\d+):\s?(.*)$/);
          if (match) {
            const lineNum = parseInt(match[1], 10);
            allLines[lineNum] = match[2];
          }
        }
      }
    }
  }

  const sortedNums = Object.keys(allLines).map(n => parseInt(n, 10)).sort((a,b) => a - b);
  console.log("Found line count:", sortedNums.length, "Min:", sortedNums[0], "Max:", sortedNums[sortedNums.length - 1]);
  
  if (sortedNums.length > 0) {
    let cssResult = [];
    for (let i = 1; i <= sortedNums[sortedNums.length - 1]; i++) {
      cssResult.push(allLines[i] !== undefined ? allLines[i] : `/* line ${i} missing */`);
    }
    fs.writeFileSync('C:\\Users\\tejsu\\Music\\for-perru-lotus-message-photo\\scratch\\reconstructed_original_newmsgs.css', cssResult.join('\n'));
    console.log("WROTE reconstructed_original_newmsgs.css successfully!");
  }
}
getAllChunks();

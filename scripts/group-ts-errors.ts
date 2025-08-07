import fs from "node:fs";
import path from "node:path";

const file = process.argv[2] ?? "ts-errors.log";
const text = fs.readFileSync(path.resolve(file), "utf8");

// tsc --pretty false lines look like: path.ts(12,34): error TS1234: Message
const re = /error\s+(TS\d+):/g;
const counts = new Map<string, number>();
const examples = new Map<string, string>();

for (const line of text.split("\n")) {
  const m = /error\s+(TS\d+):/.exec(line);
  if (!m) continue;
  const code = m[1];
  counts.set(code, (counts.get(code) ?? 0) + 1);
  if (!examples.has(code)) examples.set(code, line.trim());
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

console.log("TypeScript Error Summary:\n");
for (const [code, count] of sorted) {
  console.log(`${code}: ${count}`);
  const ex = examples.get(code);
  if (ex) console.log(`  eg: ${ex}\n`);
}
console.log(`Total distinct TS codes: ${sorted.length}`);
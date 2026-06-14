const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '飞车最新所有代码.txt');
const outputFile = path.join(__dirname, '飞车最新所有代码.json');

function parseLine(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
        return null;
    }

    let normalizedLine = trimmedLine;
    if (normalizedLine.includes('→')) {
        normalizedLine = normalizedLine.split('→')[1];
    }

    const parts = normalizedLine.split('---');
    if (parts.length < 2) {
        return null;
    }

    const type = parts[parts.length - 1].trim();
    const firstPart = parts.slice(0, -1).join('---');
    const codeNameParts = firstPart.split('--');
    if (codeNameParts.length < 2) {
        return null;
    }

    const code = codeNameParts[0].trim();
    const name = codeNameParts.slice(1).join('--').trim();
    if (!code || !name || !type) {
        return null;
    }

    return { code, name, type };
}

const text = fs.readFileSync(inputFile, 'utf8');
const items = [];

for (const line of text.split(/\r?\n/)) {
    const item = parseLine(line);
    if (item) {
        items.push(item);
    }
}

fs.writeFileSync(outputFile, `${JSON.stringify(items)}\n`, 'utf8');
console.log(`Converted ${items.length} items to ${path.basename(outputFile)}`);

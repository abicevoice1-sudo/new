#!/usr/bin/env node
// One-off repair: strip the UTF-8 BOM and un-mangle the double-encoded globe
// emoji in php-api/db/schema.sql (a PowerShell Get/Set-Content round trip
// corrupted it). Idempotent — safe to run repeatedly.
import fs from 'fs';

const file = new URL('../db/schema.sql', import.meta.url);
let bytes = fs.readFileSync(file);
let s = bytes.toString('utf8');

// 1. Drop a leading BOM (would otherwise be sent to the DB as part of SQL).
if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
s = s.replace(/\uFEFF/g, '');

// 2. Repair the mojibake: original UTF-8 F0 9F 8C 8D (🌍) was read as Latin-1
//    and re-encoded, yielding "ðŸŒ" + a stray byte. Normalise any such artefact
//    inside the icon DEFAULT to the real emoji.
s = s.replace(/DEFAULT 'ðŸŒ[^']*'/g, "DEFAULT '\u{1F30D}'");

fs.writeFileSync(file, s, 'utf8'); // Node writes UTF-8 with no BOM

const check = fs.readFileSync(file);
const first = [...check.slice(0, 3)];
const iconLine = s.slice(s.indexOf('icon'), s.indexOf('icon') + 60);
console.log('bom:', first[0] === 0xef && first[1] === 0xbb && first[2] === 0xbf);
console.log('firstBytes:', first.map(b => b.toString(16)).join(' '));
console.log('iconLine:', JSON.stringify(iconLine));
console.log('tables:', [...s.matchAll(/CREATE TABLE IF NOT EXISTS ([a-z_]+)/g)].length);

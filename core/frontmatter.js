/**
 * apex-discovery: Shared YAML Frontmatter Parser
 *
 * Parses Markdown files with YAML frontmatter delimited by `---` blocks.
 * Shared by skill-engine.js and agent-engine.js.
 */

/**
 * @typedef {Object} Skill
 * @property {string} name
 * @property {string} id
 * @property {string} category
 * @property {string} description
 * @property {string[]} phase
 * @property {string[]} triggers
 * @property {string[]} compatibility
 * @property {string} content
 */

/**
 * @typedef {Object} AgentInfo
 * @property {string} name
 * @property {string} description
 * @property {string[]} tools
 * @property {string} model
 * @property {string[]} phase
 * @property {string} category
 * @property {string|null} color
 * @property {string} content
 */

/**
 * Parse a YAML flow-style array like `[foo, "bar baz", 'x y', claude-code]`.
 * Handles quoted entries containing spaces, escapes, and mixed quoting.
 * Returns [] on malformed input.
 */
function yamlArrayToJSON(str) {
  if (!str || typeof str !== 'string') return [];
  const m = str.trim().match(/^\[([\s\S]*)\]$/);
  if (!m) return [];
  const body = m[1];
  const items = [];
  let i = 0;
  const len = body.length;
  while (i < len) {
    // Skip whitespace and separators
    while (i < len && (body[i] === ' ' || body[i] === '\t' || body[i] === ',' || body[i] === '\n')) i++;
    if (i >= len) break;
    const ch = body[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let buf = '';
      i++;
      while (i < len && body[i] !== quote) {
        if (quote === '"' && body[i] === '\\' && i + 1 < len) {
          buf += body[i + 1];
          i += 2;
          continue;
        }
        buf += body[i];
        i++;
      }
      i++; // skip closing quote
      items.push(buf);
    } else {
      let buf = '';
      while (i < len && body[i] !== ',') {
        buf += body[i];
        i++;
      }
      items.push(buf.trim());
    }
  }
  return items.filter(v => v !== '');
}

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0]?.trim() !== '---') return {};
  const end = lines.indexOf('---', 1);
  if (end === -1) return {};
  const fm = {};
  for (let i = 1; i < end; i++) {
    const trimmed = lines[i].trim();
    const kvMatch = trimmed.match(/^([a-z-]+):\s*(.*)/);
    if (!kvMatch) continue;
    const key = kvMatch[1];
    let val = kvMatch[2].trim();
    if (val === '' && i + 1 < end && lines[i + 1] !== lines[i + 1].trim()) {
      // Nested sub-object: consume the indented block, then skip past it.
      const subKeys = {};
      let j = i + 1;
      for (; j < end; j++) {
        const subLine = lines[j];
        const subTrimmed = subLine.trim();
        if (!subTrimmed || subLine === subTrimmed || subLine.startsWith('---')) break;
        const subMatch = subTrimmed.match(/^([a-z-]+):\s*(.*)/);
        if (subMatch) {
          let subVal = subMatch[2].trim();
          if (subVal.startsWith('[')) {
            let arrStr = subVal;
            for (let k = j + 1; k < end && !arrStr.includes(']'); k++) arrStr += lines[k].trim();
            subKeys[subMatch[1]] = yamlArrayToJSON(arrStr);
          } else {
            subKeys[subMatch[1]] = subVal.replace(/^["']|["']$/g, '');
          }
        }
      }
      if (Object.keys(subKeys).length > 0) fm[key] = subKeys;
      i = j - 1; // next iteration lands on the first top-level line
      continue;
    }
    if (val.startsWith('[')) {
      let arrStr = val;
      for (let j = i + 1; j < end && !arrStr.includes(']'); j++) arrStr += lines[j].trim();
      fm[key] = yamlArrayToJSON(arrStr);
    } else {
      fm[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return fm;
}

export { parseFrontmatter, yamlArrayToJSON };

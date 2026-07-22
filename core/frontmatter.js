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

function yamlArrayToJSON(str) {
  const quoted = str.replace(/([a-zA-Z0-9_-]+)/g, '"$1"').replace(/""/g, '"');
  try { return JSON.parse(quoted); } catch { return []; }
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
    if (val === '' && i + 1 < end) {
      const subKeys = {};
      for (let j = i + 1; j < end; j++) {
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

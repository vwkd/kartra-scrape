import "$std/dotenv/load.ts";

import { join } from "$std/path/join.ts";
import { makeRequestSameOrigin } from "./api.ts";
import { parsePage, parseSitemap, parseTitle } from "./parse.ts";
import { isSection, Sitemap } from "./types.ts";

const INDEX_PATH = "index";
const SITEMAP_PATH = "0";

// todo: deduplicate with `api.ts`
const OUTPUT_DIRECTORY = "out";
const MARKDOWN_FILENAME = "text.md";

/**
 * Get index page
 *
 * @returns markdown of title and index page
 */
async function getIndex(): Promise<string> {
  console.debug(`Get index...`);

  const index = await makeRequestSameOrigin(INDEX_PATH);

  const title = parseTitle(index);

  const md = await parsePage(index);

  return `# ${title}\n\n${md}`;
}

/**
 * Get sitemap
 *
 * @returns sitemap object
 */
async function getSitemap(): Promise<Sitemap> {
  console.debug(`Get sitemap...`);

  const sitemap_html = await makeRequestSameOrigin(SITEMAP_PATH);

  const sitemap = parseSitemap(sitemap_html);

  return sitemap;
}

/**
 * Get page
 *
 * @param path path string
 * @returns markdown of page
 */
async function getPage(path: string): Promise<string> {
  console.debug(`Get page...`);

  const index = await makeRequestSameOrigin(path);

  const md = await parsePage(index);

  return md;
}

/**
 * Get pages
 *
 * @param sitemap sitemap
 * @returns markdown of pages
 */
async function getPages(sitemap: Sitemap) {
  console.debug(`Get pages...`);

  const result = { text: "" };

  await getPagesTree(sitemap, result);

  return result.text;
}

/**
 * Get tree of pages
 *
 * traverses sitemap tree and builds up markdown
 *
 * - note: recursive
 * - note: relies on depth-first tree traversal
 * - note: mutates result object
 *
 * @param nodes nodes of a level
 * @param result result object
 * @param level header level, 2-6
 */
async function getPagesTree(
  nodes: Sitemap,
  result: { text: string },
  level = 2,
) {
  if (level > 6) {
    throw new Error(`Level shouldn't exceed 6!`);
  }

  for (const node of nodes) {
    if (isSection(node)) {
      result.text += `\n\n${"#".repeat(level)} ${node.name}`;
      await getPagesTree(node.children, result, level + 1);
    } else {
      const md = await getPage(node.url);
      result.text += `\n\n${"#".repeat(level)} ${node.name}\n\n${md}`;
    }
  }
}

if (import.meta.main) {
  const filepath = join(OUTPUT_DIRECTORY, MARKDOWN_FILENAME);

  const md1 = await getIndex();

  const sitemap = await getSitemap();

  const mdRest = await getPages(sitemap);

  const md = `${md1}\n\n${mdRest}`;

  await Deno.writeTextFile(filepath, md);
}

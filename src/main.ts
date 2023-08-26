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
  const index = await makeRequestSameOrigin(path);

  const md = await parsePage(index);

  return md;
}

/**
 * Get pages
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
async function getPages(nodes: Sitemap, result: { text: string }, level = 2) {
  if (level > 6) {
    throw new Error(`Level shouldn't exceed 6!`);
  }

  for (const node of nodes) {
    if (isSection(node)) {
      result.text += `\n\n${"#".repeat(level)} ${node.name}`;
      await getPages(node.children, result, level + 1);
    } else {
      const md = await getPage(node.url);
      result.text += `\n\n${"#".repeat(level)} ${node.name}\n\n${md}`;
    }
  }
}

if (import.meta.main) {
  const md1 = await getIndex();

  const sitemap = await getSitemap();

  const result = { text: md1 };

  await getPages(sitemap, result);

  const filepath = join(OUTPUT_DIRECTORY, MARKDOWN_FILENAME);

  await Deno.writeTextFile(filepath, result.text);
}

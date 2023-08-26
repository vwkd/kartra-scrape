import { DOMParser, Element } from "deno_dom";

import { unified } from "npm:unified";
import rehypeParse from "npm:rehype-parse";
import rehypeRemark from "npm:rehype-remark";
import remarkStringify from "npm:remark-stringify";

import { downloadVideo, makeRequest } from "./api.ts";
import { stringPropertiesRegex, stringPropertyRegex } from "./utils.ts";
import { Sitemap } from "./types.ts";

const TITLE_SELECTOR = "head title";
const PAGE_SELECTOR = "div.panel.panel-kartra";
const SITEMAP_SELECTOR = "div.panel.panel-kartra.panel-sitemap";
const IFRAME_SELECTOR = "iframe.video_iframe";

const SECTION1_SELECTOR = "div.navigation_category_divs";
const SECTION1_NAME_SELECTOR = "h2.navigation_category_name";

const SECTION2_SELECTOR = "ul.navigation_first_child_ul > li.index_subcategory";
const SECTION2_NAME_SELECTOR =
  "div.navigation_subcategory_name div:nth-child(1) > div:nth-child(1)";

const SECTION3_SELECTOR = "ul.navigation_second_child_ul > li";
const SECTION3_NAME_SELECTOR = "span.navigation_second_child_name";
const SECTION3_URL_SELECTOR = "a.js_open_post";

const html2md = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeRemark)
  .use(remarkStringify, {
    bullet: "-",
    emphasis: "_",
    fences: true,
    listItemIndent: "one",
    resourceLink: true,
    rule: "-",
  });

/**
 * Parse title
 *
 * @param html html string of page
 * @returns title of page
 */
export function parseTitle(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html")!;

  const title = doc.querySelector(TITLE_SELECTOR);

  return title.textContent;
}

/**
 * Parse page
 *
 * @param html html string of page
 * @returns markdown of page
 */
export async function parsePage(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html")!;

  const iframes = doc.querySelectorAll(IFRAME_SELECTOR);

  for (const iframe of iframes) {
    // todo: remove type cast once https://github.com/b-fuze/deno-dom/issues/141 is fixed
    const iframe_url = (iframe as Element).getAttribute("src");
    const video = await makeRequest(iframe_url);

    const { name, url } = await parseVideo(video);

    const filepath = await downloadVideo(url);

    const img = doc.createElement("img");
    img.setAttribute("src", filepath);
    img.setAttribute("alt", name);

    iframe.parentNode.replaceChild(img, iframe);
  }

  const div = doc.querySelector(PAGE_SELECTOR);

  const md = await html2md
    .process(div.outerHTML);

  return md.toString();
}

/**
 * Parse sitemap
 *
 * @param html html string of sitemap
 * @returns sitemap object
 */
// todo: generalize to more sections
export function parseSitemap(html: string): Sitemap {
  const doc = new DOMParser().parseFromString(html, "text/html")!;

  const div = doc.querySelector(SITEMAP_SELECTOR)!;

  const sitemap = [];

  const section1s = div.querySelectorAll(SECTION1_SELECTOR);

  for (const section1 of section1s) {
    // todo: remove type cast once https://github.com/b-fuze/deno-dom/issues/141 is fixed

    const children1 = [];

    const section1_name = (section1 as Element).querySelector(
      SECTION1_NAME_SELECTOR,
    )!.textContent.trim();

    const section2s = (section1 as Element).querySelectorAll(SECTION2_SELECTOR);

    for (const section2 of section2s) {
      // todo: remove type cast once https://github.com/b-fuze/deno-dom/issues/141 is fixed

      const children2 = [];

      const section2_name = (section2 as Element).querySelector(
        SECTION2_NAME_SELECTOR,
      )!.textContent.trim();

      const section3s = (section2 as Element).querySelectorAll(
        SECTION3_SELECTOR,
      );

      for (const section3 of section3s) {
        // todo: remove type cast once https://github.com/b-fuze/deno-dom/issues/141 is fixed

        const section3_name = (section3 as Element).querySelector(
          SECTION3_NAME_SELECTOR,
        )!.textContent.trim();
        const section3_url = (section3 as Element).querySelector(
          SECTION3_URL_SELECTOR,
        )!.getAttribute("href")!;

        children2.push({
          name: section3_name,
          url: section3_url,
        });
      }

      children1.push({
        name: section2_name,
        children: children2,
      });
    }

    sitemap.push({
      name: section1_name,
      children: children1,
    });
  }

  return sitemap;
}

/**
 * Parse video
 *
 * - beware: brittle string parsing and insecure evaluation using `eval`!
 *
 * @param html html string of video
 * @returns name and url of video
 */
export function parseVideo(html: string): { name: string; url: string } {
  // note: can't use `deno_dom` because doesn't support running embedded scripts

  const re_name = stringPropertyRegex("name");
  const re_source = stringPropertiesRegex("src", "type");
  // const re_download_url = stringPropertyRegex("video_download_url");
  // const re_transcript_download_url = stringPropertyRegex("transcript_download_url");

  const name = eval(html.match(re_name)?.at(1));
  const url = eval(html.match(re_source)?.at(1));
  // const type = eval(html.match(re_source)?.at(2));
  // const download_url = eval(html.match(re_download_url)?.at(1));

  return {
    name,
    url,
    // type,
    // download_url,
  };
}

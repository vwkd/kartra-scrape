import { DOMParser, Element } from "deno_dom";

import { unified } from "npm:unified";
import rehypeParse from "npm:rehype-parse";
import rehypeRemark from "npm:rehype-remark";
import remarkStringify from "npm:remark-stringify";

import { downloadVideo, makeRequestCrossOrigin } from "./api.ts";
import { stringPropertiesRegex, stringPropertyRegex } from "./utils.ts";
import { Sitemap } from "./types.ts";

const PAGE_SELECTOR = "div.panel.panel-kartra";
const SITEMAP_SELECTOR = "div.panel.panel-kartra.panel-sitemap";
const IFRAME_SELECTOR = "iframe.video_iframe";

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
    const video = await makeRequestCrossOrigin(iframe_url);

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
export function parseSitemap(html: string): Sitemap {
  const doc = new DOMParser().parseFromString(html, "text/html")!;

  const div = doc.querySelector(SITEMAP_SELECTOR);

  // todo: tmp
  return [
    {
      name: "First Section",
      children: [
        {
          name: "First Subsection",
          children: [
            {
              name: "First Page",
              url: "https://foo.bar.com/post/42",
            },
            // ...
          ],
        },
        // ...
      ],
    },
    // ...
  ];
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

import "$std/dotenv/load.ts";
import { join } from "$std/path/join.ts";
import { dirname } from "$std/path/dirname.ts";
import { basename } from "$std/path/basename.ts";
import { exists } from "$std/fs/exists.ts";

const ACCESS_TOKEN_NAME = "lead_logged_in";

const OUTPUT_DIRECTORY = "out";
const VIDEO_SUBFOLDER = "video";
const IMAGE_SUBFOLDER = "image";
const TMP_DIRECTORY = "tmp";

const ACCESS_TOKEN = Deno.env.get("ACCESS_TOKEN");
const USER_AGENT = Deno.env.get("USER_AGENT");

if (!ACCESS_TOKEN || !USER_AGENT) {
  throw new Error(`Missing env variables.`);
}

const headers = new Headers({
  "User-Agent": USER_AGENT,
  "Cookie": `${ACCESS_TOKEN_NAME}=${ACCESS_TOKEN}`,
});

/**
 * Fetch HTML page and save
 *
 * - skips if already exists
 * - beware: doesn't check if existing file is valid, e.g. incomplete!
 *
 * @param urlString url string
 * @returns html string
 */
export async function makeRequest(urlString: string): Promise<string> {
  console.debug(`Fetching url '${urlString}' ...`);

  const url = new URL(urlString);

  const filepath = join(TMP_DIRECTORY, url.pathname + ".html");

  // noop if directory already exists, doesn't throw due to `recursive: true`
  await Deno.mkdir(dirname(filepath), { recursive: true });

  let html;
  if (
    await exists(filepath, {
      isReadable: true,
      isFile: true,
    })
  ) {
    console.debug(`Skip path already exists`);
    html = await Deno.readTextFile(filepath);
  } else {
    const res = await fetch(urlString, {
      headers,
    });

    if (res.ok) {
      html = await res.text();
      await Deno.writeTextFile(filepath, html);
    } else {
      throw new Error(`Received error ${res.status} ${res.statusText}`);
    }
  }

  return html;
}

/**
 * Download file and save
 *
 * - skips if already exists
 * - beware: doesn't check if existing file is valid, e.g. incomplete!
 *
 * @param urlString
 * @returns filepath of downloaded file
 */
export async function downloadFile(
  urlString: string,
  filetype: "video" | "image",
): Promise<string> {
  console.debug(`Downloading ${filetype} '${urlString}' ...`);

  const url = new URL(urlString);

  let subfolder: string;
  if (filetype == "video") {
    subfolder = VIDEO_SUBFOLDER;
  } else if (filetype == "image") {
    subfolder = IMAGE_SUBFOLDER;
  } else {
    throw new Error(`Unsupported filetype '${filetype}'`);
  }

  const filename = basename(url.pathname);
  const filepath = join(OUTPUT_DIRECTORY, subfolder, filename);

  // noop if directory already exists, doesn't throw due to `recursive: true`
  await Deno.mkdir(dirname(filepath), { recursive: true });

  if (
    await exists(filepath, {
      isReadable: true,
      isFile: true,
    })
  ) {
    console.debug(`Skip download already exists`);
    return filepath;
  }

  const res = await fetch(url, {
    headers,
  });

  if (res.ok) {
    await Deno.writeFile(filepath, res.body!);

    return filepath;
  } else {
    throw new Error(`Received error ${res.status} ${res.statusText}`);
  }
}

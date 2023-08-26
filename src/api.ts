import "$std/dotenv/load.ts";
import { join } from "$std/path/join.ts";
import { dirname } from "$std/path/dirname.ts";
import { basename } from "$std/path/basename.ts";
import { exists } from "$std/fs/exists.ts";

const ACCESS_TOKEN_NAME = "lead_logged_in";

const OUTPUT_DIRECTORY = "out";
const VIDEO_SUBFOLDER = "video";
const TMP_DIRECTORY = "tmp";

const COURSE_URL = Deno.env.get("COURSE_URL");
const ACCESS_TOKEN = Deno.env.get("ACCESS_TOKEN");
const USER_AGENT = Deno.env.get("USER_AGENT");

if (!COURSE_URL || !ACCESS_TOKEN || !USER_AGENT) {
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
 * @param path relative path with respect to `COURSE_URL`
 * @returns html string
 */
export async function makeRequestSameOrigin(path: string): Promise<string> {
  console.debug(`Fetching same origin path '${path}' ...`);

  const url = new URL(path, COURSE_URL);

  const filepath = join(TMP_DIRECTORY, path + ".html");

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
    const res = await fetch(url, {
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
 * Fetch HTML page and save
 *
 * - skips if already exists
 * - beware: doesn't check if existing file is valid, e.g. incomplete!
 *
 * @param urlString absolute url
 * @returns html string
 */
export async function makeRequestCrossOrigin(
  urlString: string,
): Promise<string> {
  console.debug(`Fetching cross origin url '${urlString}' ...`);

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
    const res = await fetch(url, {
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
 * Download video and save
 *
 * - skips if already exists
 * - beware: doesn't check if existing file is valid, e.g. incomplete!
 *
 * @param urlString
 * @returns filepath of downloaded file
 */
export async function downloadVideo(urlString: string): string {
  console.debug(`Downloading video url '${urlString}' ...`);

  const url = new URL(urlString);

  const filename = basename(url.pathname);
  const filepath = join(OUTPUT_DIRECTORY, VIDEO_SUBFOLDER, filename);

  // noop if directory already exists, doesn't throw due to `recursive: true`
  await Deno.mkdir(dirname(filepath), { recursive: true });

  if (
    await exists(filepath, {
      isReadable: true,
      isFile: true,
    })
  ) {
    console.debug(`Skip download already exists`);
    return;
  }

  const res = await fetch(url, {
    headers,
  });

  if (res.ok) {
    await Deno.writeFile(filepath, res.body);

    return filepath;
  } else {
    throw new Error(`Received error ${res.status} ${res.statusText}`);
  }
}

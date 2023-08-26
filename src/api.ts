import "$std/dotenv/load.ts";
import { join } from "$std/path/join.ts";
import { exists } from "$std/fs/exists.ts";

const ACCESS_TOKEN_NAME = "lead_logged_in";

const TMP_DIRECTORY = "tmp";

// noop if directory already exists, doesn't throw due to `recursive: true`
await Deno.mkdir(TMP_DIRECTORY, { recursive: true });

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
 * @param path path url
 * @returns html string
 */
export async function makeRequest(path: string | URL): Promise<string> {
  console.debug(`Fetching path '${path}' ...`);

  const url = new URL(path, COURSE_URL);

  const filepath = join(TMP_DIRECTORY, path + ".html");

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
 */
export async function downloadVideo(url: string | URL, filepath: string) {
  console.debug(`Downloading video '${filepath}' ...`);

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
    return Deno.writeFile(filepath, res.body);
  } else {
    throw new Error(`Received error ${res.status} ${res.statusText}`);
  }
}

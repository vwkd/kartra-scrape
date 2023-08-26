# README

Script to scrape kartra courses



## Features

- download all pages of course
- download all embedded images and videos
- cache automatically, e.g. pause and resume later, "never scrape twice", etc.
- extract text to single markdown file with nested headers
- note: doesn't include comments

Note: The resulting markdown may have imperfections like bold text instead of headers, etc. These originate from kartra's HTML, likely due to incorrect HTML generation by a WYSIWYG editor provided to the course author.



## Requirements

- kartra course subscription
- kartra course url `https://kartra.com/payer/s/foobar/courses/bazbuz?course_session_id=1234567&lesson_id=7654321`
- kartra access token, e.g. from cookie `lead_logged_in`
- Deno



## Usage

### Configure

- set environmental variables or create `.env` file

```
COURSE_URL="https://portal.example.com/mycourse/"
ACCESS_TOKEN="xxx"
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
```

### Run

```sh
deno task run
```

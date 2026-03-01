# my-website

A minimal personal portfolio website.

## Run locally (Flask)

```bash
uv run --with flask python server.py
```

Then open <http://127.0.0.1:4173>.

## Spotify integration (now playing / last played)

Set these environment variables before starting the server:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

Example:

```bash
SPOTIFY_CLIENT_ID=... \
SPOTIFY_CLIENT_SECRET=... \
SPOTIFY_REFRESH_TOKEN=... \
uv run --with flask python server.py
```

If Spotify credentials are missing, the page still works and shows a fallback message.

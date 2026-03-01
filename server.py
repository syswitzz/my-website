#!/usr/bin/env python3
"""Tiny portfolio server with Spotify now-playing endpoint.

Run:
  SPOTIFY_CLIENT_ID=... \
  SPOTIFY_CLIENT_SECRET=... \
  SPOTIFY_REFRESH_TOKEN=... \
  python3 server.py
"""

from __future__ import annotations

import base64
import json
import os
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_CURRENT_TRACK_URL = "https://api.spotify.com/v1/me/player/currently-playing"
SPOTIFY_RECENT_TRACK_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=1"

CACHE_SECONDS = 20


class SpotifyClient:
    def __init__(self) -> None:
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")
        self.refresh_token = os.getenv("SPOTIFY_REFRESH_TOKEN", "")

        self._access_token = ""
        self._access_token_expires_at = 0.0
        self._last_payload: dict[str, object] = {
            "status": "disconnected",
            "message": "Spotify is not configured on this server.",
        }
        self._last_fetch_at = 0.0

    @property
    def configured(self) -> bool:
        return bool(self.client_id and self.client_secret and self.refresh_token)

    def _refresh_access_token(self) -> None:
        if not self.configured:
            return

        auth = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode("utf-8")).decode("utf-8")
        body = f"grant_type=refresh_token&refresh_token={self.refresh_token}".encode("utf-8")

        req = Request(
            SPOTIFY_ACCOUNTS_URL,
            data=body,
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method="POST",
        )

        with urlopen(req, timeout=8) as response:
            token_payload = json.load(response)

        self._access_token = token_payload.get("access_token", "")
        expires_in = int(token_payload.get("expires_in", 3600))
        self._access_token_expires_at = time.time() + expires_in - 30

    def _ensure_access_token(self) -> bool:
        if not self.configured:
            return False
        if self._access_token and time.time() < self._access_token_expires_at:
            return True
        self._refresh_access_token()
        return bool(self._access_token)

    def _spotify_get(self, url: str) -> tuple[int, dict[str, object]]:
        if not self._ensure_access_token():
            return 503, {"status": "disconnected", "message": "Spotify credentials are missing."}

        req = Request(url, headers={"Authorization": f"Bearer {self._access_token}"})
        try:
            with urlopen(req, timeout=8) as response:
                status = getattr(response, "status", 200)
                return status, json.load(response)
        except HTTPError as exc:
            if exc.code == 204:
                return 204, {}
            if exc.code == 401:
                self._access_token = ""
                return self._spotify_get(url)
            return exc.code, {"error": "spotify_error", "message": exc.reason}
        except URLError:
            return 502, {"error": "spotify_unreachable", "message": "Could not reach Spotify."}

    @staticmethod
    def _track_payload(track: dict[str, object], status: str, is_playing: bool) -> dict[str, object]:
        album = track.get("album", {}) if isinstance(track.get("album"), dict) else {}
        artists = track.get("artists", []) if isinstance(track.get("artists"), list) else []
        artist_names = [artist.get("name", "") for artist in artists if isinstance(artist, dict)]
        images = album.get("images", []) if isinstance(album.get("images"), list) else []

        image_url = ""
        if images and isinstance(images[0], dict):
            image_url = images[0].get("url", "")

        return {
            "status": status,
            "is_playing": is_playing,
            "track": track.get("name", "Unknown Track"),
            "artist": ", ".join([name for name in artist_names if name]) or "Unknown Artist",
            "album": album.get("name", "Unknown Album"),
            "url": track.get("external_urls", {}).get("spotify", "") if isinstance(track.get("external_urls"), dict) else "",
            "image": image_url,
            "fetched_at": int(time.time()),
        }

    def get_now_playing(self) -> dict[str, object]:
        if time.time() - self._last_fetch_at < CACHE_SECONDS:
            return self._last_payload

        if not self.configured:
            self._last_payload = {
                "status": "disconnected",
                "message": "Spotify is not configured on this server.",
            }
            self._last_fetch_at = time.time()
            return self._last_payload

        status, payload = self._spotify_get(SPOTIFY_CURRENT_TRACK_URL)

        if status == 200 and isinstance(payload.get("item"), dict):
            self._last_payload = self._track_payload(
                payload["item"],
                status="playing" if bool(payload.get("is_playing")) else "paused",
                is_playing=bool(payload.get("is_playing")),
            )
        elif status == 204:
            recent_status, recent_payload = self._spotify_get(SPOTIFY_RECENT_TRACK_URL)
            items = recent_payload.get("items", []) if isinstance(recent_payload, dict) else []
            if recent_status == 200 and items and isinstance(items[0], dict) and isinstance(items[0].get("track"), dict):
                self._last_payload = self._track_payload(items[0]["track"], status="recent", is_playing=False)
            else:
                self._last_payload = {
                    "status": "idle",
                    "message": "No active or recent playback found.",
                }
        else:
            self._last_payload = {
                "status": "error",
                "message": "Failed to fetch Spotify playback.",
            }

        self._last_fetch_at = time.time()
        return self._last_payload


spotify = SpotifyClient()


class PortfolioHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/api/spotify-now-playing":
            payload = spotify.get_now_playing()
            body = json.dumps(payload).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", f"public, max-age={CACHE_SECONDS}")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path in {"/", "/index.html"} and not Path("index.html").exists():
            self.send_error(404, "index.html not found")
            return

        super().do_GET()


def main() -> None:
    port = int(os.getenv("PORT", "4173"))
    with ThreadingHTTPServer(("0.0.0.0", port), PortfolioHandler) as server:
        print(f"Serving portfolio on http://0.0.0.0:{port}")
        server.serve_forever()


if __name__ == "__main__":
    main()

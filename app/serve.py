#!/usr/bin/env python3
"""
Local preview server that never serves you a stale file.

    python3 serve.py            # then open http://localhost:8000/practitioner.html

Use this instead of `python3 -m http.server`.

Why it exists: the plain server sends Last-Modified and nothing else, so the
browser is free to guess how long a file stays fresh. It guesses badly for ES
modules, and a hard reload does not reliably re-fetch a module that was pulled
in by an import rather than by a script tag. The result is a page running new
HTML against old JavaScript, which looks exactly like a bug in the code: panels
that do not populate, counts that disagree with the data, changes that "did not
apply". That cost several rounds of debugging on 27 August before anyone
realised the browser, not the code, was wrong.

This sends `Cache-Control: no-store` on everything, so every reload is honest.
Slower, and completely irrelevant for a local preview.

The deployed map is a different matter and should be cached: it sits behind
Cloudflare and only the app shell is cached there, never the group data, which
is fetched from the Google Sheet on a different origin.
"""

import http.server
import socketserver
import sys
import webbrowser
from functools import partial
from pathlib import Path

HERE = Path(__file__).resolve().parent
PAGE = "practitioner.html"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # One line per request is noise; only report what failed.
        if args and str(args[1]).startswith(("4", "5")):
            sys.stderr.write(f"  {args[0]} -> {args[1]}\n")


def current_build():
    """The build stamp in the files on disk, so it can be compared with the
    one the browser reports. If they differ, the browser is holding old files."""
    try:
        import re
        html = (HERE / PAGE).read_text(encoding="utf-8")
        m = re.search(r'data-build="([^"]+)"', html)
        return m.group(1) if m else "unknown"
    except Exception:
        return "unknown"


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = partial(NoCacheHandler, directory=str(HERE))

    # Deliberately does NOT wander to the next free port. An earlier version
    # did, and the effect was worse than failing: an old caching server stayed
    # on 8000 while this one quietly opened on 8001, so the browser kept being
    # served stale files from the server nobody remembered was running.
    try:
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
                url = f"http://localhost:{port}/{PAGE}"
                print(f"Practitioner map: {url}")
                print()
                print(f"  all networks      {url}")
                print(f"  practice groups   {url}?layer=practice_groups")
                print(f"  Ukraine only      {url}?country=ua")
                print(f"  German            {url}?lang=de")
                print()
                print(f"Build on disk: {current_build()}")
                print("The page prints its own build to the browser console.")
                print("If the two differ, the browser is showing you cached files.")
                print("Safari holds ES modules hard: Develop menu, Empty Caches,")
                print("or just use a private window.")
                print()
                print("Nothing here is cached, so a normal reload is enough.")
                print("Ctrl-C to stop.")
                webbrowser.open(url)
                httpd.serve_forever()
    except OSError:
        print(f"Port {port} is already in use, and this is almost certainly an")
        print("older server that caches. Stop it first:")
        print()
        print(f"    lsof -ti:{port} | xargs kill")
        print()
        print("then run this again. Refusing to open on a different port, because")
        print("that leaves you looking at the stale one without realising.")
        return 1
    except KeyboardInterrupt:
        print("\nStopped.")
        return 0


if __name__ == "__main__":
    sys.exit(main())

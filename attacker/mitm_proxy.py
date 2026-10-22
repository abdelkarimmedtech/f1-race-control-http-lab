#!/usr/bin/env python3
"""Standard-library HTTP relay for the isolated CS411 lab."""

import http.client
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


BACKEND_HOST = "192.168.100.101"
BACKEND_PORT = 5000
MODIFY = os.environ.get("MITM_MODIFY") == "1"
HOP_HEADERS = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailer", "transfer-encoding", "upgrade", "proxy-connection",
}


def connection_headers(headers):
    return HOP_HEADERS | {
        token.strip().lower()
        for value in headers.get_all("Connection", [])
        for token in value.split(",")
    }


class RelayHandler(BaseHTTPRequestHandler):
    def send_result(self, status, reason, headers, body):
        self.send_response(status, reason)
        for name, value in headers:
            self.send_header(name, value)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-role")
        self.send_header("Access-Control-Expose-Headers", "Allow, WWW-Authenticate, Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def relay(self):
        # Ignore any supplied absolute-form authority: the destination is fixed.
        target = urlsplit(self.path)
        path = target.path or "/"
        if target.query:
            path += "?" + target.query
        print("\n[INTERCEPTED] {} {} from {}".format(
            self.command, path, self.client_address[0]), flush=True)
        print(str(self.headers).rstrip(), flush=True)
        if self.headers.get("Transfer-Encoding"):
            self.send_result(400, "Bad Request", [("Content-Type", "application/json")],
                             b'{"error":"Use Content-Length instead of Transfer-Encoding"}')
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 0:
                raise ValueError
        except ValueError:
            self.send_result(400, "Bad Request", [("Content-Type", "application/json")],
                             b'{"error":"Invalid Content-Length"}')
            return
        self.connection.settimeout(15)
        try:
            body = self.rfile.read(length)
            if len(body) != length:
                raise OSError("Incomplete request body")
        except OSError:
            self.send_result(400, "Bad Request", [("Content-Type", "application/json")],
                             b'{"error":"Incomplete or timed out request body"}')
            return
        if body:
            print("Body: " + body.decode("utf-8", errors="replace"), flush=True)
        excluded = connection_headers(self.headers) | {"host", "content-length", "accept-encoding"}
        headers = {key: value for key, value in self.headers.items() if key.lower() not in excluded}
        headers["Accept-Encoding"] = "identity"
        upstream = http.client.HTTPConnection(BACKEND_HOST, BACKEND_PORT, timeout=15)
        try:
            upstream.request(self.command, path, body=body, headers=headers)
            response = upstream.getresponse()
            result = response.read()
            excluded = connection_headers(response.headers) | {"content-length", "server", "date"}
            response_headers = [(key, value) for key, value in response.getheaders()
                                if key.lower() not in excluded
                                and not key.lower().startswith("access-control-")]
            modified = False
            if (MODIFY and self.command == "GET" and target.path == "/api/race"
                    and 200 <= response.status < 300
                    and "application/json" in response.getheader("Content-Type", "").lower()
                    and response.getheader("Content-Encoding", "identity").lower() == "identity"):
                try:
                    data = json.loads(result)
                    if isinstance(data, dict):
                        race = data.get("race")
                        if isinstance(race, dict):
                            race["flag"] = "YELLOW"
                        else:
                            data["flag"] = "YELLOW"
                        data["message"] = "Response intercepted in the controlled MITM lab."
                        data["mitm_notice"] = "This response was modified in the controlled MITM lab."
                        result = json.dumps(data).encode("utf-8")
                        modified = True
                except (ValueError, UnicodeError):
                    pass  # Non-JSON responses are relayed unchanged.
            if modified:
                response_headers = [(key, value) for key, value in response_headers
                                    if key.lower() not in {"etag", "content-md5", "digest", "content-type"}]
                response_headers.append(("Content-Type", "application/json; charset=utf-8"))
                print("*** RESPONSE MODIFIED FOR MITM DEMO ***", flush=True)
            print("[BACKEND] {} {}".format(response.status, response.reason), flush=True)
            status, reason = response.status, response.reason
        except (OSError, http.client.HTTPException) as exc:
            print("[BACKEND CONNECTION ERROR] {}".format(exc), flush=True)
            status, reason = 502, "Bad Gateway"
            response_headers = [("Content-Type", "application/json")]
            result = b'{"status":502,"error":"Bad Gateway","message":"Backend unavailable"}'
        finally:
            upstream.close()
        self.send_result(status, reason, response_headers, result)

    do_GET = relay
    do_POST = relay
    do_DELETE = relay
    do_OPTIONS = relay


if __name__ == "__main__":
    print("CS411 relay listening on 0.0.0.0:8081 -> http://192.168.100.101:5000", flush=True)
    print("Response modification: " + ("ENABLED" if MODIFY else "disabled"), flush=True)
    server = ThreadingHTTPServer(("0.0.0.0", 8081), RelayHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping relay.", flush=True)
    finally:
        server.server_close()

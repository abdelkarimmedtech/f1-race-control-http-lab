# CS411 controlled MITM demonstration

This standard-library Python 3 proxy is for a controlled university MITM
demonstration in an isolated lab. It logs intercepted methods, paths, client
addresses, headers (including demonstration credentials), request bodies, and
backend status codes to the attacker terminal. Use fictional lab data only.

## Architecture

```text
Client
  ↓
Host PC :8081
  ↓ VirtualBox port forwarding
Attacker VM :8081
  ↓ Internal Network
Server VM 192.168.100.101:5000
```

| Machine | Private interface |
| --- | --- |
| Server VM | 192.168.100.101 |
| Attacker VM | 192.168.100.102 |

Connect both private interfaces to the same VirtualBox Internal Network. Give
the attacker a NAT adapter as well, with a TCP port-forwarding rule from host
port 8081 to guest port 8081. Bind the host rule to 127.0.0.1 when the client
browser runs on the host. The proxy listens on `0.0.0.0:8081`; allow that port
through the attacker firewall and port 5000 through the server firewall.

## Run on the attacker VM

From the project root, with Python 3 installed (no pip packages required):

Relay-only mode:

```sh
python3 attacker/mitm_proxy.py
```

Stop with Ctrl+C before starting the modification demo:

```sh
MITM_MODIFY=1 python3 attacker/mitm_proxy.py
```

The environment-variable syntax above is for the Linux VM shell.
Normal mode forwards response bodies unchanged. Modification mode changes only
successful JSON object responses to `GET /api/race` (including query strings):
it sets `flag` to `YELLOW`, adds an interception message and adds
`"mitm_notice": "This response was modified in the controlled MITM lab."`.
Each modification prints:

```text
*** RESPONSE MODIFIED FOR MITM DEMO ***
```

This demonstrates HTTP/Web spoofing of the client-visible response. It does
not change backend state. Ordinary forwarded POST/DELETE requests still have
their normal backend effects. This explicit relay does not perform ARP spoofing
or transparently redirect traffic; the client must select the proxy endpoint.

## Connect the existing frontend

For a browser on the Host PC, set the existing frontend's `VITE_API_URL` to
`http://localhost:8081` in `frontend/.env`, then restart Vite (or rebuild the
production frontend). For a client on the Internal Network, use
`http://192.168.100.102:8081`. The proxy always forwards to
`http://192.168.100.101:5000`, preserving the API path and query string.
No backend route changes are needed.

GET, POST, DELETE and OPTIONS are forwarded, including CORS preflight requests.
CORS allows Content-Type, Authorization and x-role, and exposes Allow and
WWW-Authenticate to the frontend. Backend error statuses such as 400, 401,
403, 404 and 405 retain their bodies and useful headers. Connection failures
produce a JSON `502 Bad Gateway` response. Requests should use Content-Length;
chunked request bodies are not supported by this simple lab relay.

## Verify

```sh
python3 -m py_compile attacker/mitm_proxy.py
curl -i http://localhost:8081/api/race
curl -i http://localhost:8081/api/drivers/abc
curl -i http://localhost:8081/api/race-control/private
curl -i -X DELETE http://localhost:8081/api/drivers/1/pit
```

In modification mode, compare `GET /api/race` through the proxy with a direct
request to `http://192.168.100.101:5000/api/race` from a VM on the Internal
Network. Only the proxied response should contain the MITM notice; other
endpoints and error responses remain unchanged.

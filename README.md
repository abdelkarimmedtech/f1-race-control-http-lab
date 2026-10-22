# F1 Race Control HTTP Server

A simple Computer Networks lab demonstrating real HTTP client-server communication. A React dashboard sends requests to an Express REST API and displays the status, JSON response body, response headers and elapsed time. All race data is fictional and held in memory; restarting the server resets it. No database, external API, fonts or image services are required at runtime.

## Structure and architecture

```text
f1-race-control-http-server/
  backend/
    data/race.js
    middleware/http.js
    routes/api.js
    server.js
    server.test.js
    package.json
  frontend/
    src/
      services/api.js
      App.jsx
      main.jsx
      style.css
    .env.example
    package.json
  .gitignore
  README.md
```

Client VM browser → React frontend → HTTP REST requests → Node.js / Express server.

## Run locally or on Ubuntu

Requires Node.js 22+ and npm. Install dependencies while internet access is available. After installation, the app runs offline on the internal network.

In one terminal:

```sh
cd backend
npm install
npm start
```

The API listens on `0.0.0.0:5000`. `npm run dev` restarts it when source files change.

In another terminal:

```sh
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`. On Windows PowerShell with restricted script execution, use `npm.cmd` in place of `npm`.

## VirtualBox network

Connect all VMs to the same VirtualBox Internal Network name. Example static addresses on a `/24` network:

| VM | Address |
| --- | --- |
| Server | 192.168.100.101 |
| Client 1 | 192.168.100.102 |
| Client 2 | 192.168.100.103 |

Clients open `http://192.168.100.101:5173`; API requests go to `http://192.168.100.101:5000`. If Ubuntu's firewall is enabled, allow TCP ports 5000 and 5173 (`sudo ufw allow 5000/tcp` and `sudo ufw allow 5173/tcp`).

The frontend defaults to the page's hostname on port 5000. Optionally copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL=http://192.168.100.101:5000`. Restart Vite after editing it. The variable is embedded at build time. The real `.env` is ignored by Git.

## Presentation scenarios

Click a status card. The inspector displays the actual HTTP result, including JSON for errors. Use its Headers tab to inspect `Allow: POST` for 405. Use the authorized control under 401 or 403 to demonstrate the successful case. The steward control issues a red flag and refreshes race data.

| Scenario | Method | Endpoint | Expected response |
| --- | --- | --- | --- |
| Successful race request | GET | /api/race | 200 OK |
| Invalid driver ID | GET | /api/drivers/abc | 400 Bad Request |
| No authentication | GET | /api/race-control/private | 401 Unauthorized |
| Wrong permissions | POST | /api/stewards/red-flag | 403 Forbidden |
| Unsupported method | DELETE | /api/drivers/1/pit | 405 Method Not Allowed |

200 means the request succeeded. 400 means the input is invalid. 401 means authentication is missing or invalid. 403 means the caller is authenticated but lacks permission. 405 means the resource exists but does not support the requested method.

Authentication uses `Authorization: Bearer race-control-token`. Steward actions also require `x-role: steward`; the 403 demo deliberately sends `x-role: viewer`. These publicly documented values are demonstration credentials, suitable for this isolated lab rather than real access control.

## API endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /api/race | Race status |
| GET | /api/drivers | Driver standings |
| GET | /api/drivers/:id | Positive numeric ID; 400 invalid, 404 unknown |
| GET | /api/laps | Current and total laps |
| GET | /api/weather | Track and weather information |
| GET | /api/race-control/messages | Race messages |
| GET | /api/race-control/private | Requires bearer token |
| POST | /api/stewards/red-flag | Requires token and steward role; issues red flag |
| POST | /api/race/flag | Requires token, steward role and JSON `{"flag":"GREEN"}`; also accepts YELLOW or RED |
| POST | /api/drivers/:id/pit | Places driver in pit; other methods return 405 with Allow: POST |

Every request logs its method, path and final status in the backend terminal. CORS allows VM clients, including preflight requests. Network failures and timeouts appear in the inspector independently from HTTP error responses.

## Verify and build

```sh
cd backend
npm test
cd ../frontend
npm run build
```

The API test uses a real temporary HTTP server to verify all five scenarios, positive authentication and steward paths, dashboard endpoints, CORS, input validation and the Allow header. Frontend production files are created in `frontend/dist`. To serve the build locally, run `npm run preview`; the API must still run separately on port 5000.

Quick Linux terminal demonstrations:

```sh
curl -i http://192.168.100.101:5000/api/race
curl -i http://192.168.100.101:5000/api/drivers/abc
curl -i http://192.168.100.101:5000/api/race-control/private
curl -i -X POST -H 'Authorization: Bearer race-control-token' -H 'x-role: viewer' http://192.168.100.101:5000/api/stewards/red-flag
curl -i -X DELETE http://192.168.100.101:5000/api/drivers/1/pit
```

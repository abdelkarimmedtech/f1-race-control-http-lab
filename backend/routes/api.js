import { Router } from 'express';
import { race, drivers, messages } from '../data/race.js';
import { authenticate, steward } from '../middleware/http.js';
const api = Router();
api.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) return res.status(400).json({ status: 400, error: 'Bad Request', message: 'Driver ID must be a valid positive number' });
  req.driver = drivers.find(driver => driver.id === Number(id));
  if (!req.driver) return res.status(404).json({ status: 404, error: 'Not Found', message: 'Driver not found' });
  next();
});
api.get('/race', (req, res) => res.json({ status: 200, message: 'Race data retrieved successfully', race }));
api.get('/drivers', (req, res) => res.json({ status: 200, drivers }));
api.get('/drivers/:id', (req, res) => res.json({ status: 200, driver: req.driver }));
api.get('/laps', (req, res) => res.json({ status: 200, lap: race.lap, totalLaps: race.totalLaps }));
api.get('/weather', (req, res) => res.json({ status: 200, condition: race.weather, air: 24, track: 36, humidity: 48, wind: 12 }));
api.get('/race-control/messages', (req, res) => res.json({ status: 200, messages }));
api.get('/race-control/private', authenticate, (req, res) => res.json({ status: 200, message: 'Authenticated. Welcome to Race Control.' }));
function flag(req, res) {
  const value = req.path === '/stewards/red-flag' ? 'RED' : req.body?.flag;
  if (!['GREEN', 'YELLOW', 'RED'].includes(value)) return res.status(400).json({ status: 400, error: 'Bad Request', message: 'Flag must be GREEN, YELLOW, or RED' });
  race.flag = value;
  messages.unshift({ lap: race.lap, text: `${value} flag issued by race stewards.`, type: value.toLowerCase() });
  res.json({ status: 200, message: `${value} flag issued`, race });
}
api.post('/stewards/red-flag', authenticate, steward, flag);
api.post('/race/flag', authenticate, steward, flag);
api.route('/drivers/:id/pit').post((req, res) => {
  req.driver.status = 'Pit';
  res.json({ status: 200, message: `Car ${req.driver.number} entered pit lane`, driver: req.driver });
}).all((req, res) => res.status(405).set('Allow', 'POST').json({ status: 405, error: 'Method Not Allowed', message: `${req.method} is not allowed for this resource. Use POST.` }));
export default api;

export const race = { name: 'Coastal Grand Prix', circuit: 'Marina International Circuit', lap: 27, totalLaps: 58, flag: 'GREEN', weather: 'DRY', status: 'LIVE' };
export const drivers = [
  { id: 1, number: 7, name: 'Driver 1', team: 'Apex Racing', lap: 27, status: 'Racing', gap: 'LEADER', color: '#f25151' },
  { id: 2, number: 22, name: 'Driver 2', team: 'Velocity GP', lap: 27, status: 'Racing', gap: '+2.481', color: '#52d7c2' },
  { id: 3, number: 31, name: 'Driver 3', team: 'Titan Motorsport', lap: 27, status: 'Pit', gap: '+8.720', color: '#a994ff' },
  { id: 4, number: 44, name: 'Driver 4', team: 'Falcon Racing', lap: 26, status: 'Racing', gap: '+1 LAP', color: '#f6be63' }
];
export const messages = [ { lap: 27, text: 'Track clear. Green flag in all sectors.', type: 'green' }, { lap: 26, text: 'Car 31 entered the pit lane.', type: 'pit' }, { lap: 24, text: 'Yellow flag in sector 2.', type: 'yellow' }, { lap: 1, text: 'Race started. All cars away.', type: 'green' } ];

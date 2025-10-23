import http from 'http';

const data = JSON.stringify({
  section: 'math',
  score: 0,
  maxScore: 800,
  answers: {},
  timeSpent: 0
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/ai/sat/practice-sessions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

// Using http for local testing only - production uses HTTPS
// nosemgrep: javascript.lang.security.audit.unsafe-http-request
const req = http.request(options, res => {
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your_strong_random_secret_here';

// Create a test token for demo user
const testToken = jwt.sign({ id: 'demo_user_123', email: 'demo@learnozi.com' }, JWT_SECRET, { expiresIn: '1d' });
const headers = { Authorization: `Bearer ${testToken}` };

async function testFocusAPI() {
  console.log('Testing GET /api/focus with demo user token...');
  try {
    const getRes = await axios.get(`${BASE_URL}/api/focus`, { headers });
    console.log('GET /api/focus Status:', getRes.status);
    console.log('Stats returned:', {
      todayMinutes: getRes.data.todayMinutes,
      weekMinutes: getRes.data.weekMinutes,
      totalSessions: getRes.data.totalSessions,
      streakDays: getRes.data.streakDays,
      sessionsCount: getRes.data.sessions ? getRes.data.sessions.length : 0
    });

    console.log('\nTesting POST /api/focus with 25m session for "Quantum Mechanics"...');
    const postRes = await axios.post(`${BASE_URL}/api/focus`, {
      subject: 'Quantum Mechanics',
      durationMin: 25,
      completed: true
    }, { headers });
    console.log('POST /api/focus Status:', postRes.status);
    console.log('Created Session:', postRes.data.session);
    console.log('Updated Stats:', {
      todayMinutes: postRes.data.todayMinutes,
      weekMinutes: postRes.data.weekMinutes,
      totalSessions: postRes.data.totalSessions,
      streakDays: postRes.data.streakDays
    });

    if (postRes.data.session && postRes.data.session.subject === 'Quantum Mechanics') {
      console.log('\n✅ PASS: Focus API is working seamlessly with resilient storage!');
    } else {
      console.error('\n❌ FAIL: Focus session not returned as expected.');
    }
  } catch (err) {
    console.error('API Test Error:', err.response ? err.response.data : err.message);
  }
}

testFocusAPI();

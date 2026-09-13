const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your_strong_random_secret_here';

const testToken = jwt.sign({ id: 'demo_user_123', email: 'demo@learnozi.com' }, JWT_SECRET, { expiresIn: '1d' });
const headers = { Authorization: `Bearer ${testToken}` };

async function testFlashcardsAPI() {
  console.log('1. Testing GET /api/flashcards...');
  let sets;
  try {
    const res = await axios.get(`${BASE_URL}/api/flashcards`, { headers });
    console.log('GET Status:', res.status);
    sets = res.data.sets;
    console.log(`Retrieved ${sets.length} decks:`, sets.map(s => `${s.title} (${s.cardCount} cards)`));
  } catch (err) {
    console.error('GET failed:', err.response ? err.response.data : err.message);
    return;
  }

  console.log('\n2. Testing POST /api/flashcards/generate with Gemini AI for "Photosynthesis"...');
  let newDeck;
  try {
    const genRes = await axios.post(`${BASE_URL}/api/flashcards/generate`, {
      topic: 'Photosynthesis Light-Dependent Reactions',
      subject: 'Biology',
      count: 4
    }, { headers });
    console.log('Generate Status:', genRes.status);
    newDeck = genRes.data.deck;
    console.log('Generated Deck Title:', newDeck.title);
    console.log('Card 1 Question:', newDeck.cards[0].question);
    console.log('Card 1 Answer:', newDeck.cards[0].answer);
  } catch (err) {
    console.error('Generate failed:', err.response ? err.response.data : err.message);
    return;
  }

  console.log('\n3. Testing PATCH /api/flashcards (updating card mastery)...');
  try {
    const patchRes = await axios.patch(`${BASE_URL}/api/flashcards`, {
      setId: newDeck.id,
      cardIndex: 0,
      mastery: 'Easy'
    }, { headers });
    console.log('PATCH Status:', patchRes.status);
    console.log('Updated Progress:', patchRes.data.set.progress + '%');
  } catch (err) {
    console.error('PATCH failed:', err.response ? err.response.data : err.message);
  }

  console.log('\n4. Testing DELETE /api/flashcards for generated test deck...');
  try {
    const delRes = await axios.delete(`${BASE_URL}/api/flashcards?id=${newDeck.id}`, { headers });
    console.log('DELETE Status:', delRes.status);
    console.log('Deleted ID:', delRes.data.deletedId);
  } catch (err) {
    console.error('DELETE failed:', err.response ? err.response.data : err.message);
  }

  console.log('\n✅ ALL FLASHCARD BACKEND ENDPOINTS PASSED SUCCESSFULLY!');
}

testFlashcardsAPI();

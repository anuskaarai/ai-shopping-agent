require('dotenv').config();
const axios = require('axios');

async function testGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  try {
    const res = await axios.get(url);
    const models = res.data.models.map(m => m.name);
    console.log("SUCCESS:", models.filter(m => m.includes('flash')));
  } catch (err) {
    console.log("ERROR:", err.response?.status, err.response?.data || err.message);
  }
}
testGemini();

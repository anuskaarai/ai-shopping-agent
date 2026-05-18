const axios = require('axios');

async function test() {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/chat',
      { message: 'tops for summers under 5000', history: [] },
      { headers: { Origin: 'https://ai-shopping-agent-alpha.vercel.app' } }
    );
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.error('ERROR:', error.message);
    if (error.response) {
      console.error('DATA:', error.response.data);
      console.error('STATUS:', error.response.status);
    }
  }
}

test();

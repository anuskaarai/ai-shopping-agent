const fs = require('fs');
const path = require('path');

const dbDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'users.json');

// Initialize if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

function readUsers() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(dbPath, JSON.stringify(users, null, 2));
}

module.exports = {
  get: (email) => {
    const users = readUsers();
    return users.find(u => u.email === email) || null;
  },
  insert: (user) => {
    const users = readUsers();
    const newUser = { id: Date.now(), ...user };
    users.push(newUser);
    writeUsers(users);
    return newUser;
  }
};

// createAdmin.js
// Run this ONCE to create an admin account in MongoDB.
// Usage: node createAdmin.js
// Then log in with username: admin  password: admin123

const mongoose = require('mongoose');
const Player   = require('./models/Player');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rps_game';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Delete existing admin if any, then recreate
  await Player.deleteOne({ username: 'admin' });

  const admin = await Player.create({
    username: 'admin',
    password: 'admin123',
    isAdmin:  true,
  });

  console.log('✅ Admin account created!');
  console.log('   Username:', admin.username);
  console.log('   Password: admin123');
  console.log('   isAdmin: ', admin.isAdmin);
  console.log('\nYou can now log in at http://localhost:5500/login.html');

  await mongoose.disconnect();
}

main().catch((err) => { console.error('❌ Error:', err.message); process.exit(1); });

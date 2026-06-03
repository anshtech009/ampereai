const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hash = await bcrypt.hash('anshuman123', 10);
  await mongoose.connection.collection('users').updateOne(
    { email: 'anshumanrath009@gmail.com' },
    { $set: { password: hash } }
  );
  console.log('Password reset to: anshuman123');
  process.exit();
});
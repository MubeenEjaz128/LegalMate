
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/database');

(async () => {
  try {

    // Use correct environment variable for MongoDB URI
    console.log('Mongo URI:', process.env.MONGODB_URI);
    await connectDB();
    console.log('✅ Connected to database:', mongoose.connection.readyState === 1);

    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      console.log('→ Admin already in DB, exiting.');
      return process.exit(0);
    }
    console.log('→ No admin found, creating one now.');

    // Do not hash password here; let the User model pre-save hook handle it
    const plainPassword = '123456';


    // Build availability to match schema: Map of arrays with { startTime, endTime, isAvailable }
    const availability = {
      monday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
      tuesday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
      wednesday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
      thursday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
      friday: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }]
    };

    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: plainPassword,
      role: 'admin',
      isActive: true,
      isVerified: true,
      phone: '+1234567890',
      address: 'Admin Address',
      specialization: 'System Administration',
      experience: 10,
      hourlyRate: 0,
      bio: 'System Administrator for LegalMate platform',
      education: 'Computer Science',
      certifications: ['System Administration'],
      languages: ['English'],
      availability
    });

    await adminUser.save();
    console.log('✅ Default admin user created successfully');
    console.log('Email: admin@gmail.com');
    console.log('Password: 123456');
    console.log('Role: admin');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
})();

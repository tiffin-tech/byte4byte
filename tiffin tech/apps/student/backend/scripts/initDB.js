import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://omjsuryawanshi7_db_user:Tiffintech@cluster0.oouvmys.mongodb.net/tiffintech?retryWrites=true&w=majority&appName=Cluster0';

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: String,
    userType: String
});

const User = mongoose.model('User', userSchema);

async function initDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Create demo user
        const hashedPassword = await bcrypt.hash('password', 10);
        
        const demoUser = new User({
            name: 'Rahul Sharma',
            email: 'rahul@example.com',
            password: hashedPassword,
            phone: '+91 9876543210',
            userType: 'student'
        });
        
        await demoUser.save();
        console.log('Demo user created successfully');
        
        // List all users
        const users = await User.find();
        console.log('Current users:', users);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

initDatabase();
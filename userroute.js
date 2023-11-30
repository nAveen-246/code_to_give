// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Create an Express app
const app = express();

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://vicky:vicky@cluster0.n4udqv3.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


// // Set up MongoDB connection (assuming you have MongoDB configured and running)
// // ...
// const uri = "mongodb+srv://vicky:vicky@cluster0.n4udqv3.mongodb.net/?retryWrites=true&w=majority"
// mongoose.connect(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log('MongoDB connected'))
//   .catch(error => console.error('MongoDB connection error:', error));


// Define a User model schema
const userSchema = {
 name: String,
 phone: String,
 college: String,
 isAddicted: Boolean,
 isAdmin: Boolean,
};

// Create a collection for users in MongoDB
const User = mongoose.model('User', userSchema);

// Questionnaire route
app.post('/questionnaire', async (req, res) => {
 try {
   // Process the questionnaire answers and determine addiction status
   const isAddicted = processQuestionnaire(req.body);

   if (isAddicted) {
     // If the user is addicted, redirect to the user registration page
     res.redirect('/register');
   } else {
     // If the user is not addicted, show a message or redirect to a different page
     res.status(200).json({ message: 'You are not addicted' });
   }
 } catch (error) {
   console.error(error);
   res.status(500).json({ message: 'Internal server error' });
 }
});

// User registration route
app.post('/register', async (req, res) => {
 try {
   const { name, phone, college } = req.body;

   // Create a new user
   const newUser = new User({
     name: name,
     phone: phone,
     college: college,
     isAddicted: true, // Set as true because they are redirected here if addicted
     isAdmin: false, // Set as false by default for regular users
   });

   // Save the user to the database
   await newUser.save();

   res.status(201).json({ message: 'User registered successfully' });
 } catch (error) {
   console.error(error);
   res.status(500).json({ message: 'Internal server error' });
 }
});

// Admin login route
app.post('/admin/login', async (req, res) => {
 try {
   const { username, password } = req.body;

   // Check if the admin exists in the database
   const admin = await User.findOne({ username: username, isAdmin: true });
   if (!admin) {
     return res.status(401).json({ message: 'Invalid credentials' });
   }

   // Compare the provided password with the stored hashed password
   const isPasswordValid = await bcrypt.compare(password, admin.password);
   if (!isPasswordValid) {
     return res.status(401).json({ message: 'Invalid credentials' });
   }

   // Generate a JWT token
   const token = jwt.sign({ userId: admin._id }, 'secret');

   res.status(200).json({ token });
 } catch (error) {
   console.error(error);
   res.status(500).json({ message: 'Internal server error' });
 }
});

// Admin dashboard route
app.get('/admin/dashboard', async (req, res) => {
 try {
   // Retrieve addiction statistics for each college
   const addictionStats = await User.aggregate([
     { $group: { _id: '$college', count: { $sum: 1 } } },
   ]);

   res.status(200).json({ addictionStats });
 } catch (error) {
   console.error(error);
   res.status(500).json({ message: 'Internal server error' });
 }
});

// Start the server
app.listen(3000, () => {
 console.log('Server started on port 3000');
});

// Function to process the questionnaire answers and determine addiction status
function processQuestionnaire(answers) {
 // Add your logic here to analyze the answers and determine addiction status
 // ...

 // For this example, let's assume if any answer is 'yes', the user is considered addicted
 return Object.values(answers).some(answer => answer.toLowerCase() === 'yes');
}

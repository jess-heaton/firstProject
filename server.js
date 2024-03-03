const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose'); // Import mongoose
const User = require('./models/User');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));


// Connect to MongoDB
mongoose.connect('mongodb+srv://new-user:Emma96681851@cluster0.xatpghu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { 
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));
  
const users = [];

// BodyParser Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Express Session Middleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// EJS View Engine Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Express Static Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Home Route
app.get('/', (req, res) => {
  res.render('index');
});

// Login Route
app.get('/login', (req, res) => {
  res.render('login');
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Find the user by username
      const user = await User.findOne({ username: username });
      
      if (user && user.password === password) { // You should hash passwords in a real app
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/profiles');
      } else {
        res.send('Incorrect Username and/or Password!');
      }
    } catch (error) {
      console.log(error);
      res.send('Login failed.');
    }
});

// Register Route
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
    try {
      const { username, password, bio, age, gender, course } = req.body;
      
      // Create a new user instance and save it to the database
      const newUser = new User({ username, password, bio, age, gender, course });
      await newUser.save();
      
      res.redirect('/login');
    } catch (error) {
      console.log(error);
      res.send('Failed to register user.');
    }
});

// Profile Route
app.get('/profile', (req, res) => {
  if (req.session.loggedin) {
    res.render('profile', { username: req.session.username });
  } else {
    res.redirect('/login');
  }
});

app.get('/profiles', async (req, res) => {
    if (req.session.loggedin) {
      const query = {};
      const { course, minAge, maxAge } = req.query;
  
      if (course) {
        query.course = course;
      }
      if (minAge) {
        query.age = { $gte: minAge };
      }
      if (maxAge) {
        if (query.age) {
          query.age.$lte = maxAge;
        } else {
          query.age = { $lte: maxAge };
        }
      }
  
      try {
        const profiles = await User.find(query); // Use the query to filter profiles
        res.render('profiles', { profiles });
      } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
      }
    } else {
      res.redirect('/login');
    }
});

app.get('/profile/:id', async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (user) {
        res.render('individual-profile', { user }); // Render a view called 'individual-profile.ejs'
      } else {
        res.status(404).send('Profile not found');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
});
  
// Logout Handler
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});




// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
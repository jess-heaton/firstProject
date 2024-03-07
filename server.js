const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose'); // Import mongoose
const User = require('./models/User');


const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


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
function calculateAge(birthdate) {
  const birthday = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Find the user by username
      const user = await User.findOne({ username: username });
      
      if (user && user.password === password) { // You should hash passwords in a real app
        req.session.loggedin = true;
        req.session.username = username;
        req.session.userId = user._id;
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
  const { username, password } = req.body;
  
  try {
    const newUser = new User({ username, password });
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
      const { minAge, maxAge, monthlyBudget, gender, lookingFor, moveInTimeframe } = req.query;
  
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

      if (monthlyBudget) {
        query.monthlyBudget = { $lte: monthlyBudget };
      }

      if (gender) {
          query.gender = gender;
      }

      if (lookingFor) {
          query.lookingFor = lookingFor; // Assuming this is an array of values
      }
      
      if (moveInTimeframe) {
        query.moveInTimeframe = moveInTimeframe; // Assuming this is an array of values
    }
      
      if (req.query.tags) {
        query.tags = req.query.tags;
      }
  
      try {
        console.log(query); // Add this to debug the query
        const profiles = await User.find(query); // Use the query to filter profiles
        // Fetch the current user to get their saved profiles
        const currentUser = await User.findById(req.session.userId);
        // Make sure to handle the case where currentUser might be null
        const savedProfiles = currentUser ? currentUser.savedProfiles.map(profile => profile.toString()) : [];

        profiles.forEach(profile => {
          profile.age = calculateAge(profile.birthdate);
        });


        // Check if the request is an AJAX call
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
          // Send JSON response for AJAX request
          res.json(profiles);
        } else {
          // Render page for normal request
          res.render('profiles', { profiles, savedProfiles, query: req.query });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
      }
    } else {
      res.redirect('/login');
    }
});


app.get('/edit-profile', (req, res) => {
  if (req.session.loggedin) {
    res.render('edit-profile', { username: req.session.username });
  } else {
    res.redirect('/login');
  }
});

app.post('/edit-profile', async (req, res) => {
  if (!req.session.loggedin) {
    return res.redirect('/login');
  }

  const {
    firstName,
    lastName,
    birthdate,
    gender,
    tags, 
    lookingFor,
    moveInTimeframe,
    customMoveInDate,
    monthlyBudget,
    budgetIncludesBills,
    about,
  } = req.body;

  const userId = req.session.userId;

  try {
    await User.findByIdAndUpdate(userId, {
      firstName,
      lastName,
      birthdate,
      gender,
      tags,
      lookingFor,
      moveInTimeframe,
      customMoveInDate,
      monthlyBudget,
      budgetIncludesBills: budgetIncludesBills === 'yes',
      about,
    });
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.send('Failed to update profile.');
  }
});

// This is the corrected part of your route handler
app.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      const age = calculateAge(user.birthdate); // Here you calculate the age
      const userObject = user.toObject(); // Convert Mongoose document to a plain JavaScript object
      userObject.age = age; // Add the age property to the user object

      res.render('individual-profile', { user: userObject }); // Pass the user object with the age property to the view
    } else {
      res.status(404).send('Profile not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});



app.post('/save-profile/:id', async (req, res) => {
  if (!req.session.loggedin) {
      return res.status(401).send('You must be logged in to save profiles');
  }

  try {
      const userId = req.session.userId; // Or another way to identify the current user
      const profileToSaveId = req.params.id;

      // Find the current user
      const currentUser = await User.findById(userId);
      let responseMessage = '';

      // Check if the profile is already saved
      if (currentUser.savedProfiles.includes(profileToSaveId)) {
          // Profile is already saved; remove it
          await User.findByIdAndUpdate(userId, {
              $pull: { savedProfiles: profileToSaveId }
          });
          responseMessage = 'Profile removed';
      } else {
          // Profile not saved yet; add it
          await User.findByIdAndUpdate(userId, {
              $addToSet: { savedProfiles: profileToSaveId }
          });
          responseMessage = 'Profile saved';
      }
      
      res.status(200).send(responseMessage);
  } catch (error) {
      console.error(error);
      res.status(500).send('Error saving profile');
  }
});



app.get('/saved-profiles', async (req, res) => {
  if (!req.session.loggedin) {
    return res.redirect('/login');
  }
  
  try {
    const user = await User.findById(req.session.userId).populate('savedProfiles');
    if (user) {
      res.render('saved-profiles', { profiles: user.savedProfiles, savedProfiles: user.savedProfiles.map(p => p._id.toString()) });
    } else {
      res.render('saved-profiles', { profiles: [], savedProfiles: [] });
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
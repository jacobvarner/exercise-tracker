const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const cors = require('cors');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

let userSchema = new mongoose.Schema({
  username: String
});

let User = mongoose.model('User', userSchema);

// Add new user
app.post('/api/exercise/new-user', (req, res) => {
  let username = req.body.username;
  User.findOne({username: username}, (err, storedUsername) => {
    if (err) return;
    if (storedUsername) {
      res.send('The username \'' + username + '\' has already been taken.'); 
    } else {
      let newUser = new User({ username: username });
      
      newUser.save((err, createdUser) => {
        if (err) return;
        res.json({ username: username, _id: createdUser._id });
      });
    }
  });
});

// Get all users
app.get('/api/exercise/users', (req, res) => {
  User.find({}, 'username _id', (err, users) => {
    let output = [];
    
    users.map((user) => {
      output.push(user);
    });
    
    res.send(output);
  });
});

let exerciseSchema = new mongoose.Schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: Date.now}
});

let Exercise = mongoose.model('Exercise', exerciseSchema);

// Adds a new exercise for a user
app.post('/api/exercise/add', (req, res) => {
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  
  User.findById(userId, (err, user) => {
    if (err) return;
    if (user) {
      let newExercise = new Exercise({
        userId: user._id,
        description: description,
        duration: duration
      });

      if (date.length > 0) {
        newExercise.date = new Date(date);
      }

      newExercise.save((err, createdExercise) => {
        if (err) return;
        res.json({
          userId: userId,
          description: description,
          duration: duration,
          date: createdExercise.date,
          _id: createdExercise._id
        });
      }); 
    }
  });
});

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const User = require('./models/user.js'); 

const LocalStrategy = require('passport-local'); 

const helmet = require('helmet'); 

const authorRouter = require('./routes/author.js');
const userRouter = require('./routes/user.js');
const reviewRouter = require('./routes/review.js');
const cloudinaryRoutes = require('./routes/uploadToCloud.js');

const app = express();

// mongoose.connect(process.env.ATLAS_URL)
//     .then(() => console.log('Connected to MongoDB'))
//     .catch(err => console.error('DB Connection Error:', err));

app.use(helmet({ contentSecurityPolicy: false })); 

const PORT = process.env.PORT || 8080;
mongoose.connect(process.env.ATLAS_URL)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('DB Connection Error:', err);
    });



function sanitize(obj) {
  for (let key in obj) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitize(obj[key]);
    }
  }
  return obj;
}

app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize({ ...req.query }); 
  req.params = sanitize(req.params);
  next();
});


app.use(cors({ origin:process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' })); 

app.use(passport.initialize());
passport.use(new LocalStrategy(User.authenticate()));


/*const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});*/

app.use('/author', authorRouter);
app.use('/users', userRouter);
app.use('/material/:id/comments', reviewRouter);
app.use('/api/cloudinary', cloudinaryRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).json({ message });
});


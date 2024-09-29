
/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Junayad Bin Forhad
Student ID: 160158218
Date: 29/09/2024
Vercel Web App URL: https://web322-app-chi.vercel.app/about
GitHub Repository URL: https://github.com/Junayad47/web322-app

********************************************************************************/ 


const express = require('express');
const path = require('path');

// Adding the store-service module
const storeService = require('./store-service');

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// To serve the static files from the "public" folder
app.use('/public', express.static(path.join(__dirname, 'public')));


// Route to the "about.html" file
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

// Route to redirect to "/about"
app.get('/', (req, res) => {
  res.redirect('/about');
});

// Route to /shop
app.get('/shop', (req, res) => {
  storeService.getPublishedItems()
    .then(items => res.json(items))
    .catch(err => res.status(500).json({ message: err }));
});

// Route to /items
app.get('/items', (req, res) => {
  storeService.getAllItems()
    .then(items => res.json(items))
    .catch(err => res.status(500).json({ message: err }));
});

// Route to /categories
app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then(categories => res.json(categories))
    .catch(err => res.status(500).json({ message: err }));
});

// 404 route for invalid routes
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

// Initialize store service and starting the server
storeService.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Express http server listening on ${HTTP_PORT} !`);
    });
  })
  .catch(err => {
    console.error("Failed to initialize store service module !", err);
  });

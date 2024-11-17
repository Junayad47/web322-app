/*********************************************************************************
 WEB322 – Assignment 04
 I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
 No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
 
 Name: Junayad Bin Forhad
 Student ID: 160158218
 Date: 17/11/2024
 Vercel Web App URL: https://web322-app-chi.vercel.app/about
 GitHub Repository URL: https://github.com/Junayad47/web322-app
 
 ********************************************************************************/

// Import required modules
const express = require('express');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require('./store-service');

// Create Express app
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

const helpers = require('./helpers');
app.locals.helpers = helpers;

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dq7dcekye',
    api_key: '325631771362246',
    api_secret: 'i1dbHFXDgbwOw8d5lTOrzQjoclY',
    secure: true
});

// Set up multer for handling file uploads (No disk storage)
const upload = multer();

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Explicitly set the views directory

// Middleware to set activeRoute based on the current route
app.use((req, res, next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = '/' + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, '') : route.replace(/\/(.*)/, ''));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Route for the about page
app.get('/about', (req, res) => {
    res.render('about', { layout: 'partials/main', title: "Junayad Bin Forhad's Store" });
});

// Redirect root to shop page
app.get('/', (req, res) => {
    res.redirect('/shop');
});

// Route for shop (published items)
app.get('/shop', (req, res) => {
    const category = req.query.category;
    let viewData = {};

    storeService.getPublishedItemsByCategory(category)
        .then(items => {
            viewData.items = items;
            if (items.length > 0) {
                viewData.item = items[0];
            } else {
                viewData.message = 'no results';
            }
        })
        .catch(() => {
            viewData.message = 'no results';
        })
        .then(storeService.getCategories)
        .then(categories => {
            viewData.categories = categories;
        })
        .catch(() => {
            viewData.categoriesMessage = 'no results';
        })
        .then(() => {
            res.render('shop', { data: viewData, viewingCategory: category });
        });
});

// Route for shop item by ID
app.get('/shop/:id', (req, res) => {
    const category = req.query.category;
    let viewData = {};

    storeService.getItemById(req.params.id)
        .then(item => {
            viewData.item = item;
        })
        .catch(() => {
            viewData.message = 'no results';
        })
        .then(() => storeService.getPublishedItemsByCategory(category))
        .then(items => {
            viewData.items = items;
        })
        .catch(() => {
            viewData.items = [];
        })
        .then(() => storeService.getCategories())
        .then(categories => {
            viewData.categories = categories;
        })
        .catch(() => {
            viewData.categoriesMessage = 'no results';
        })
        .then(() => {
            res.render('shop', { data: viewData, viewingCategory: category });
        });
});

// Route for items with optional filtering
app.get('/items', (req, res) => {
    if (req.query.category) {
        // Filter items by category
        storeService.getItemsByCategory(req.query.category)
            .then(items => res.render('items', { items: items }))
            .catch(err => res.render('items', { message: 'no results' }));
    } else if (req.query.minDate) {
        // Filter items by minimum date
        storeService.getItemsByMinDate(req.query.minDate)
            .then(items => res.render('items', { items: items }))
            .catch(err => res.render('items', { message: 'no results' }));
    } else {
        // Get all items
        storeService.getAllItems()
            .then(items => res.render('items', { items: items }))
            .catch(err => res.render('items', { message: 'no results' }));
    }
});

// Route for getting a single item by ID
app.get('/item/:id', (req, res) => {
    storeService.getItemById(req.params.id)
        .then(item => res.json(item))
        .catch(err => res.status(404).json({ message: err }));
});

// Route for getting all categories
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(categories => res.render('categories', { categories: categories }))
        .catch(err => res.render('categories', { message: 'no results' }));
});

// Route for rendering the add item page
app.get('/items/add', (req, res) => {
    res.render('addItem', { layout: 'partials/main' });
});

// Route for adding a new item
app.post('/items/add', upload.single('featureImage'), (req, res) => {
    if (req.file) {
        // If a file was uploaded, process it with Cloudinary
        const streamUpload = req => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            const result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then(uploaded => {
            processItem(uploaded.url);
        });
    } else {
        // If no file was uploaded, process item without image
        processItem('');
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        storeService.addItem(req.body)
            .then(() => res.redirect('/items'))
            .catch(err => res.status(500).json({ message: err }));
    }
});

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).render('404');
});

// Initialize store service and start the server
storeService.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Express http server listening on ${HTTP_PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to initialize store service module!', err);
    });

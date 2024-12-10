
/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Junayad Bin Forhad
Student ID: 160158218
Date: 10/12/2024
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
const authData = require('./auth-service');
const serverless = require('serverless-http');

const { Sequelize } = require('sequelize');
const pg = require('pg');
const mongoose = require('mongoose');
const clientSessions = require('client-sessions');

// Sequelize configuration for PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://web322asg5_owner:jcNoE8SLJ7Uw@ep-shiny-term-a5dt70gz.us-east-2.aws.neon.tech/web322asg5?sslmode=require', {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((err) => {
        console.log('Unable to connect to the database:', err);
    });

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb+srv://junayadjnd47:sXmD0HLzfbrJ9Pus@cluster0.yjrfs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB successfully.');
})
.catch((err) => {
    console.log('Failed to connect to MongoDB:', err);
});

// Create Express app
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

const helpers = {
    formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
};

app.locals.helpers = helpers;

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dq7dcekye',
    api_key: '325631771362246',
    api_secret: '325631771362246',
    secure: true
});

// Multer for handling file uploads
const upload = multer();

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure client-sessions middleware
app.use(clientSessions({
    cookieName: "session", // object name that will be added to 'req'
    secret: "supreme_leader47", // secret string to sign the session ID cookie
    duration: 24 * 60 * 60 * 1000, // duration of the session in milliseconds
    activeDuration: 1000 * 60 * 5 // the session will be extended by this many ms each request
}));

// Middleware to set activeRoute based on the current route
app.use((req, res, next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = '/' + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, '') : route.replace(/\/(.*)/, ''));
    app.locals.viewingCategory = req.query.category;
    next();
});


// Middleware to make session available in all templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Helper middleware to ensure user is logged in
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
}

// Redirect root to about page
app.get('/', (req, res) => {
    res.redirect('/about');
});

// Route for the about page
app.get('/about', (req, res) => {
    res.render('about', { layout: 'partials/main', title: "Junayad's Store" });
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
            res.render('shop', { data: viewData, viewingCategory: category, session: req.session });
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

// Route for items with optional filtering with ensureLogin middleware
app.get('/items', ensureLogin, (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(items => {
                if (items.length > 0) {
                    res.render('items', { items: items });
                } else {
                    res.render('items', { message: "no results" });
                }
            })
            .catch(err => res.render('items', { message: 'no results' }));
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then(items => {
                if (items.length > 0) {
                    res.render('items', { items: items });
                } else {
                    res.render('items', { message: "no results" });
                }
            })
            .catch(err => res.render('items', { message: 'no results' }));
    } else {
        storeService.getAllItems()
            .then(items => {
                if (items.length > 0) {
                    res.render('items', { items: items });
                } else {
                    res.render('items', { message: "no results" });
                }
            })
            .catch(err => res.render('items', { message: 'no results' }));
    }
});

app.get('/item/:id', ensureLogin, (req, res) => {
    storeService.getItemById(req.params.id)
        .then(item => res.json(item))
        .catch(err => res.status(404).json({ message: err }));
});

app.get('/categories', ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(categories => {
            if (categories.length > 0) {
                res.render('categories', { categories: categories });
            } else {
                res.render('categories', { message: "no results" });
            }
        })
        .catch(err => res.render('categories', { message: 'no results' }));
});

app.get('/items/add', ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(data => res.render('addItem', {
            layout: 'partials/main',
            categories: data
        }))
        .catch(() => res.render('addItem', {
            layout: 'partials/main',
            categories: []
        }));
});

app.post('/items/add', ensureLogin, upload.single('featureImage'), (req, res) => {
    if (req.file) {
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
        }).catch(err => {
            console.error('File upload failed:', err);
            res.status(500).send('File upload failed');
        });
    } else {
        processItem('');
    }

        function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        storeService.addItem(req.body)
            .then(() => res.redirect('/items'))
            .catch(err => res.status(500).json({ message: err }));
    }
});

// Route for rendering the add category page
app.get('/categories/add', ensureLogin, (req, res) => {
    res.render('addCategory', { layout: 'partials/main' });
});

// Route for adding a new category
app.post('/categories/add', ensureLogin, (req, res) => {
    storeService.addCategory(req.body)
        .then(() => res.redirect('/categories'))
        .catch(err => res.status(500).json({ message: err }));
});

// Route for deleting a category by ID
app.get('/categories/delete/:id', ensureLogin, (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => res.redirect('/categories'))
        .catch(err => res.status(500).send('Unable to Remove Category / Category not found'));
});

// Route for deleting an item by ID
app.get('/items/delete/:id', ensureLogin, (req, res) => {
    storeService.deleteItemById(req.params.id)
        .then(() => res.redirect('/items'))
        .catch(err => res.status(500).send('Unable to Remove Item / Item not found'));
});

// Authentication routes
app.get('/register', (req, res) => {
    res.render('register', { layout: 'partials/main', errorMessage: null, successMessage: null, userName: null, email: null });
});

app.post('/register', (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render('register', { layout: 'partials/main', successMessage: "User created", errorMessage: null, userName: null, email: null });
        })
        .catch(err => {
            res.render('register', {
                layout: 'partials/main',
                errorMessage: err,
                successMessage: null,
                userName: req.body.userName,
                email: req.body.email
            });
        });
});

app.get('/login', (req, res) => {
    res.render('login', { layout: 'partials/main', errorMessage: null, userName: null });
});

app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/about');
        })
        .catch(err => {
            res.render('login', {
                layout: 'partials/main',
                errorMessage: err,
                userName: req.body.userName
            });
        });
});

app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});



app.get('/login', (req, res) => {
    res.render('login', { layout: 'partials/main', error: null, userName: null });
});

app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/items');
        })
        .catch(err => {
            res.render('login', {
                layout: 'partials/main',
                errorMessage: err,
                userName: req.body.userName
            });
        });
});

app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

// Route for user history
app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory', { layout: 'partials/main' });
});

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).render('404');
});

// For Vercel serverless function
module.exports = serverless(app);

// Local server initialization
if (require.main === module) {
    storeService.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Express http server listening on ${HTTP_PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to start server:', err);
        app.listen(HTTP_PORT, () => {
            console.log(`Express http server listening on ${HTTP_PORT}`);
        });
    });
}


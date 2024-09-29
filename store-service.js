const fs = require('fs').promises;
const path = require('path');

// Globally declared items and categories
let items = [];
let categories = [];


// Retriving the data if failed returning a message
function initialize() {
    return Promise.all([
        fs.readFile(path.join(__dirname, "data", "items.json"), 'utf8')
            .then(data => {
                items = JSON.parse(data);
            }),
        fs.readFile(path.join(__dirname, "data", "categories.json"), 'utf8')
            .then(data => {
                categories = JSON.parse(data);
            })
    ]).then(() => {
        if (items.length === 0 || categories.length === 0) {
            throw new Error("Couldn't read data !");
        }
    });
}

// To get all published items (checking the length and condition)
function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published);
        if (publishedItems.length > 0) {
            resolve(publishedItems);
        } else {
            reject("No results returned !");
        }
    });
}

// To get all the Items (checking the length and condition)
function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) {
            resolve(items);
        } else {
            reject("No results returned !");
        }
    });
}


// To get all the categories
function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) {
            resolve(categories);
        } else {
            reject("No results returned !");
        }
    });
}

module.exports = {
    initialize,
    getPublishedItems,
    getAllItems,
    getCategories
};
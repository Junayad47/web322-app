const fs = require('fs').promises;
const path = require('path');

// Arrays to store items and categories
let items = [];
let categories = [];

// Initialize the store service by reading data from JSON files
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
            throw new Error("Couldn't read data!");
        }
    });
}

// Get all published items
function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published);
        if (publishedItems.length > 0) {
            resolve(publishedItems);
        } else {
            reject("No results returned!");
        }
    });
}

// Get all items
function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) {
            resolve(items);
        } else {
            reject("No results returned!");
        }
    });
}

// Get all categories
function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) {
            resolve(categories);
        } else {
            reject("No results returned!");
        }
    });
}

// Add a new item
function addItem(itemData) {
    return new Promise((resolve, reject) => {
        // Set published status
        itemData.published = itemData.published === undefined ? false : true;
        // Set new item ID
        itemData.id = items.length + 1;
        // Add new item to array
        items.push(itemData);
        resolve(itemData);
    });
}

// Get items by category
function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.category == category);
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results returned!");
        }
    });
}

// Get items by minimum date
function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results returned!");
        }
    });
}

// Get a single item by ID
function getItemById(id) {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id == id);
        if (item) {
            resolve(item);
        } else {
            reject("No result returned!");
        }
    });
}

// Export all functions
module.exports = {
    initialize,
    getPublishedItems,
    getAllItems,
    getCategories,
    addItem,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById
};
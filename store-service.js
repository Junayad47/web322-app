
const Sequelize = require('sequelize');

// Establish a new Sequelize instance with a PostgreSQL connection
const sequelize = new Sequelize('postgresql://web322asg5_owner:jcNoE8SLJ7Uw@ep-shiny-term-a5dt70gz.us-east-2.aws.neon.tech/web322asg5?sslmode=require', {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    query: { raw: true } // Enable raw SQL query logging
});

// Define the Item model with its attributes
const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    itemDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
});

// Define the Category model with its attribute
const Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

// Establish relationship where each Item belongs to a Category
Item.belongsTo(Category, { foreignKey: 'category' });

// Initialize the database by syncing the models
function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve())
            .catch(err => reject("Unable to sync the database"));
    });
}

// Fetch all items
function getAllItems() {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then(data => resolve(data))
            .catch(() => reject("No results returned"));
    });
}

// Fetch items by a specific category
function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { category: category }
        })
        .then(data => resolve(data))
        .catch(() => reject("No results returned"));
    });
}

// Fetch items by a minimum date
function getItemsByMinDate(minDateStr) {
    const { gte } = Sequelize.Op;
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                itemDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
        .then(data => resolve(data))
        .catch(() => reject("No results returned"));
    });
}

// Fetch a specific item by its ID
function getItemById(id) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { id: id }
        })
        .then(data => data.length > 0 ? resolve(data[0]) : reject("No result returned"))
        .catch(() => reject("No result returned"));
    });

}

// Add a new item to the database
function addItem(itemData) {
    return new Promise((resolve, reject) => {
        // Ensure published is a boolean
        itemData.published = itemData.published ? true : false;

        // Replace empty strings with null values
        for (let prop in itemData) {
            if (itemData[prop] === "") {
                itemData[prop] = null;
            }
        }


        // Set the item date to the current date
        itemData.itemDate = new Date();

        Item.create(itemData)
            .then(data => resolve(data))
            .catch(() => reject("Unable to create item"));
    });
}

// Fetch all published items
function getPublishedItems() {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { published: true }
        })
        .then(data => resolve(data))
        .catch(() => reject("No results returned"));
    });
}

// Fetch published items by a specific category
function getPublishedItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { 
                published: true,
                category: category 
            }
        })
        .then(data => resolve(data))
        .catch(() => reject("No results returned"));
    });
}

// Fetch all categories
function getCategories() {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then(data => resolve(data))
            .catch(() => reject("No results returned"));
    });
}

// Add a new category to the database
function addCategory(categoryData) {
    return new Promise((resolve, reject) => {
        // Replace empty strings with null values
        for (let prop in categoryData) {
            if (categoryData[prop] === "") {
                categoryData[prop] = null;
            }
        }

        Category.create(categoryData)
            .then(data => resolve(data))
            .catch(() => reject("Unable to create category"));
    });
}

// Delete a category by its ID
function deleteCategoryById(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: { id: id }
        })
        .then(rowsDeleted => rowsDeleted > 0 ? resolve() : reject())
        .catch(() => reject());
    });
}

// Delete an item by its ID
function deleteItemById(id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: { id: id }
        })
        .then(rowsDeleted => rowsDeleted > 0 ? resolve() : reject())
        .catch(() => reject());
    });
}

// Export all functions
module.exports = {
    initialize,
    getAllItems,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById,
    addItem,
    getPublishedItems,
    getPublishedItemsByCategory,
    getCategories,
    addCategory,
    deleteCategoryById,
    deleteItemById
};

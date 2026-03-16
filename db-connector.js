// Citation for the following file:
// Date: January 2026
// Adapted from: Activity 2 - Connect webapp to database (Individual) 
// Source URL: https://canvas.oregonstate.edu/courses/2031764/assignments/10323319

// Get an instance of mysql we can use in the app
let mysql = require('mysql2')

// Create a 'connection pool' using the provided credentials
const pool = mysql.createPool({
    waitForConnections: true,
    connectionLimit   : 10,
    host              : 'HOSTNAME',
    user              : 'USER',
    password          : 'PASSWORD',
    database          : 'DATABASAE'
}).promise(); // This makes it so we can use async / await rather than callbacks

// Export it for use in our application
module.exports = pool;
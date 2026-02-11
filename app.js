/*
    SETUP
*/

// Express
const express = require('express');  // We are using the express library for the web server
const app = express();               // We need to instantiate an express object to interact with the server in our code
const PORT = 6777;     // Set a port number

// Serve static files from public directory
app.use(express.static('public'));



/*
    ROUTES
*/

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});



/*
    LISTENER
*/

app.listen(PORT, function(){            // This is the basic syntax for what is called the 'listener' which receives incoming requests on the specified PORT.
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});
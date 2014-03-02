var server = require('isotope');

var config = 
[
    {
        name : "sql",
        location : "sequil"
    }
];

server.create(8000, config);
require('dotenv').config();


const PORT = 3000;
const express = require('express');
const server = express();

const morgan = require('morgan');
server.use(morgan('dev'));//morgan('dev'), is a function which logs out the incoming requests

server.use(express.json())//express.json(), is a function which will read incoming JSON from requests

const { client } = require('./db');
client.connect();

server.listen(PORT,() => {
    console.log('The server is up on port', PORT)
});



const apiRouter = require('./api');
server.use('/api', apiRouter);
 

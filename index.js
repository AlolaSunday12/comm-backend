const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
require("dotenv/config");
const cors = require('cors');
const mongoose = require('mongoose');
const productRoutes = require('./routes/products')
const categoriesRoutes = require('./routes/categories')
const ordersRoutes = require('./routes/orders')
const usersRoutes = require('./routes/users')
const authJwt = require('./helpers/jwt')
const errorHandler = require('./helpers/error-handler')
const path = require('path');

app.use(cors());
app.options('*', cors());

//middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan('tiny'));  // for logging request
app.use(authJwt());
app.use('/Public/uploads', express.static(__dirname + '/Public/uploads'));
app.use(errorHandler);

const api = process.env.API_URL;


app.use(`${api}/products`, productRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);
app.use(`${api}/categories`, categoriesRoutes);


mongoose.connect(process.env.mongoURL, {
  tls: true,  // Use TLS explicitly
  tlsAllowInvalidCertificates: true, 
}); 

const connection = mongoose.connection;

connection.on('error', (error) => {
    console.error('MongoDB connection failed:', error);
});

connection.on('connected', () => {
    console.log('MongoDB connection successful');
});


const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log('node server started using nodemon');
});
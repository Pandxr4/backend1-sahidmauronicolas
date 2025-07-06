const express = require('express');

const app = express();

// Middleware para parsear JSON
app.use(express.json());

const cartsRouter = require('./routes/carts');
const productsRouter = require('./routes/products'); // si también tienes productos

// Rutas
app.use('/api/carts', cartsRouter);
app.use('/api/products', productsRouter);

// Levantar servidor
app.listen(8080, () => {
  console.log('Servidor en http://localhost:8080');
});
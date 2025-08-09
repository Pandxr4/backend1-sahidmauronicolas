// routes/views.js
const { Router } = require('express');
const path = require('path');
const fs = require('fs');

const router = Router();
const filePath = path.join(__dirname, '..', 'productos.json');

const readProducts = () => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

// Home: vista estática (HTTP)
router.get('/', (req, res) => {
  const products = readProducts();
  res.render('home', { products });
});

// Realtime products: trabaja con websocket + muestra lista inicial
router.get('/realtimeproducts', (req, res) => {
  const products = readProducts();
  res.render('realTimeProducts', { products });
});

module.exports = router;

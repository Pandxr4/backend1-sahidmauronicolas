const { Router } = require('express');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'carritos.json');

const router = Router();

// Función auxiliar para leer carritos desde el archivo
const getCartsFromFile = () => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

// Función auxiliar para guardar carritos en el archivo
const saveCartsToFile = (carts) => {
  fs.writeFileSync(filePath, JSON.stringify(carts, null, 2));
};

// GET / - listar todos los carritos
router.get('/', (req, res) => {
  const carts = getCartsFromFile();
  res.json(carts);
});

// GET /:cid - obtener carrito por id
router.get('/:cid', (req, res) => {
  const carts = getCartsFromFile();
  const cid = parseInt(req.params.cid);
  const cart = carts.find(c => c.id === cid);
  if (cart) {
    res.json(cart);
  } else {
    res.status(404).json({ error: 'Carrito no encontrado' });
  }
});

// POST / - crear nuevo carrito
router.post('/', (req, res) => {
  const carts = getCartsFromFile();
  const { products } = req.body;

  const maxId = carts.length ? Math.max(...carts.map(c => c.id)) : 0;
  const newCart = {
    id: maxId + 1,
    products: Array.isArray(products) ? products : []
  };

  carts.push(newCart);
  saveCartsToFile(carts);
  res.status(201).json(newCart);
});

// DELETE /:cid - eliminar carrito por id
router.delete('/:cid', (req, res) => {
  const carts = getCartsFromFile();
  const cid = parseInt(req.params.cid);
  const index = carts.findIndex(c => c.id === cid);
  if (index === -1) {
    return res.status(404).json({ error: 'Carrito no encontrado' });
  }

  carts.splice(index, 1);
  saveCartsToFile(carts);
  res.json({ message: 'Carrito eliminado' });
});

// POST /:cid/productos - agregar producto al carrito
router.post('/:cid/productos', (req, res) => {
  const carts = getCartsFromFile();
  const cid = parseInt(req.params.cid);
  const { productId, quantity } = req.body;

  const cartIndex = carts.findIndex(c => c.id === cid);
  if (cartIndex === -1) {
    return res.status(404).json({ error: 'Carrito no encontrado' });
  }

  const cart = carts[cartIndex];

  // Buscar si el producto ya existe en el carrito
  const prodIndex = cart.products.findIndex(p => p.productId === productId);
  if (prodIndex !== -1) {
    // Actualizar cantidad
    cart.products[prodIndex].quantity += quantity;
  } else {
    // Agregar nuevo producto
    cart.products.push({ productId, quantity });
  }

  // Guardar cambios
  carts[cartIndex] = cart;
  saveCartsToFile(carts);
  res.json(cart);
});

module.exports = router;
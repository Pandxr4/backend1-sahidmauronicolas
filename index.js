const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// ======= Helpers para manejar productos =======
const filePath = path.join(__dirname, 'productos.json');

const getProductsFromFile = () => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const saveProductsToFile = (products) => {
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
};
// ==============================================

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Routers HTTP
const cartsRouter = require('./routes/carts');
const productsRouter = require('./routes/products')(io); // HTTP alternativa
const viewsRouter = require('./routes/views');

app.use('/api/carts', cartsRouter);
app.use('/api/products', productsRouter); // sigue disponible como alternativa HTTP
app.use('/', viewsRouter);

// ================== Socket.io ==================
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  // Enviar lista inicial
  socket.emit('productosInicial', getProductsFromFile());

  // Crear producto desde socket
  socket.on('nuevoProducto', (data) => {
    const products = getProductsFromFile();
    const maxId = products.length ? Math.max(...products.map(p => p.id)) : 0;

    const newProduct = {
      id: maxId + 1,
      title: data.title,
      description: data.description,
      code: data.code,
      price: parseFloat(data.price),
      status: data.status !== undefined ? data.status : true,
      stock: parseInt(data.stock),
      category: data.category,
      thumbnails: Array.isArray(data.thumbnails) ? data.thumbnails : []
    };

    products.push(newProduct);
    saveProductsToFile(products);

    io.emit('productoAgregado', newProduct); // enviar a todos
  });

  // Eliminar producto desde socket
  socket.on('eliminarProducto', (idProducto) => {
    const products = getProductsFromFile();
    const index = products.findIndex(p => p.id === parseInt(idProducto));

    if (index !== -1) {
      products.splice(index, 1);
      saveProductsToFile(products);
      io.emit('productoEliminado', parseInt(idProducto));
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});
// ================================================

// Levantar servidor
httpServer.listen(8080, () => {
  console.log('Servidor en http://localhost:8080');
});

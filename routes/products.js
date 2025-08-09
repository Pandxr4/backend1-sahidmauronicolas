// routes/products.js
const { Router } = require('express');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'productos.json');

module.exports = (io) => {
    const router = Router();

    // Función auxiliar para leer productos desde el archivo
    const getProductsFromFile = () => {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (err) {
            return [];
        }
    };

    // Función auxiliar para guardar productos en el archivo
    const saveProductsToFile = (products) => {
        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
    };

    // GET / - listar todos los productos, con limit opcional
    router.get('/', (req, res) => {
        const products = getProductsFromFile();
        const limit = parseInt(req.query.limit);
        if (!isNaN(limit)) {
            res.json(products.slice(0, limit));
        } else {
            res.json(products);
        }
    });

    // GET /:pid - obtener producto por id
    router.get('/:pid', (req, res) => {
        const products = getProductsFromFile();
        const pid = parseInt(req.params.pid);
        const product = products.find(p => p.id === pid);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    });

    // POST / - crear nuevo producto
    router.post('/', (req, res) => {
        const products = getProductsFromFile();
        const {
            title,
            description,
            code,
            price,
            status,
            stock,
            category,
            thumbnails
        } = req.body;

        if (!title || !description || !code || price === undefined || stock === undefined || !category) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const maxId = products.length ? Math.max(...products.map(p => p.id)) : 0;
        const newProduct = {
            id: maxId + 1,
            title,
            description,
            code,
            price,
            status: status !== undefined ? status : true,
            stock,
            category,
            thumbnails: Array.isArray(thumbnails) ? thumbnails : []
        };

        products.push(newProduct);
        saveProductsToFile(products);

        // Emitimos evento por socket
        io.emit('productoAgregado', newProduct);

        res.status(201).json(newProduct);
    });

    // PUT /:pid - actualizar producto sin modificar id
    router.put('/:pid', (req, res) => {
        const products = getProductsFromFile();
        const pid = parseInt(req.params.pid);
        const index = products.findIndex(p => p.id === pid);
        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const existingProduct = products[index];
        const {
            title,
            description,
            code,
            price,
            status,
            stock,
            category,
            thumbnails
        } = req.body;

        const updatedProduct = {
            ...existingProduct,
            title: title !== undefined ? title : existingProduct.title,
            description: description !== undefined ? description : existingProduct.description,
            code: code !== undefined ? code : existingProduct.code,
            price: price !== undefined ? price : existingProduct.price,
            status: status !== undefined ? status : existingProduct.status,
            stock: stock !== undefined ? stock : existingProduct.stock,
            category: category !== undefined ? category : existingProduct.category,
            thumbnails: Array.isArray(thumbnails) ? thumbnails : existingProduct.thumbnails,
        };

        products[index] = updatedProduct;
        saveProductsToFile(products);

        res.json(updatedProduct);
    });

    // DELETE /:pid - eliminar producto
    router.delete('/:pid', (req, res) => {
        const products = getProductsFromFile();
        const pid = parseInt(req.params.pid);
        const index = products.findIndex(p => p.id === pid);
        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        products.splice(index, 1);
        saveProductsToFile(products);

        // Emitimos evento por socket
        io.emit('productoEliminado', pid);

        res.json({ message: 'Producto eliminado' });
    });

    return router;
};

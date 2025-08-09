document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  const productsList = document.getElementById('products-list');
  const addProductForm = document.getElementById('addProductForm');
  const noProductsElem = document.getElementById('no-products');

  function createProductLi(product) {
    const li = document.createElement('li');
    li.dataset.id = product.id;
    li.innerHTML = `
      <strong>${escapeHtml(product.title)}</strong> — ${escapeHtml(product.description)} — <em>Precio:</em> ${product.price} — <small>ID: ${product.id}</small>
      <button class="delete-btn" data-id="${product.id}">Eliminar</button>
    `;
    return li;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // Actualizar lista cuando llega producto agregado
  socket.on('productoAgregado', (product) => {
    if (noProductsElem) noProductsElem.remove();

    const existing = productsList.querySelector(`li[data-id="${product.id}"]`);
    if (existing) {
      productsList.replaceChild(createProductLi(product), existing);
    } else {
      productsList.appendChild(createProductLi(product));
    }
  });

  // Actualizar lista cuando llega producto eliminado
  socket.on('productoEliminado', (id) => {
    const li = productsList.querySelector(`li[data-id="${id}"]`);
    if (li) li.remove();

    if (!productsList.children.length && !document.getElementById('no-products')) {
      const p = document.createElement('p');
      p.id = 'no-products';
      p.innerText = 'No hay productos todavía.';
      productsList.parentNode.appendChild(p);
    }
  });

  // -------------------- OPCIÓN 1: CREAR/ELIMINAR POR SOCKET --------------------
  addProductForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(addProductForm);
    const newProduct = {
      title: formData.get('title'),
      description: formData.get('description'),
      code: formData.get('code'),
      price: formData.get('price'),
      stock: formData.get('stock'),
      category: formData.get('category'),
      thumbnails: []
    };
    socket.emit('nuevoProducto', newProduct);
    addProductForm.reset();
  });

  productsList?.addEventListener('click', (e) => {
    if (e.target.matches('.delete-btn')) {
      const id = e.target.dataset.id;
      if (confirm(`¿Eliminar producto ID ${id}?`)) {
        socket.emit('eliminarProducto', id);
      }
    }
  });

  /*
  // -------------------- OPCIÓN 2: CREAR/ELIMINAR POR FETCH HTTP --------------------
  addProductForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(addProductForm);
    const body = {
      title: formData.get('title'),
      description: formData.get('description'),
      code: formData.get('code'),
      price: parseFloat(formData.get('price')),
      stock: parseInt(formData.get('stock')),
      category: formData.get('category'),
      thumbnails: []
    };
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json();
        alert('Error: ' + (err.error || res.statusText));
        return;
      }
      addProductForm.reset();
    } catch (err) {
      console.error(err);
      alert('Error al crear producto');
    }
  });

  productsList?.addEventListener('click', async (e) => {
    if (e.target.matches('.delete-btn')) {
      const id = e.target.dataset.id;
      if (!confirm('¿Eliminar producto id ' + id + ' ?')) return;
      try {
        const res = await fetch('/api/products/' + id, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json();
          alert('Error: ' + (err.error || res.statusText));
        }
      } catch (err) {
        console.error(err);
        alert('Error al eliminar producto');
      }
    }
  });
  */
});

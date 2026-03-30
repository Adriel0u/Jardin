// ================= DATOS & ESTADO =================
const datosBase = [
    { id: 1, nombre: "Monstera", precio: 25.00, img: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400" },
    { id: 2, nombre: "Ficus Lyrata", precio: 45.00, img: "https://images.unsplash.com/photo-1612364806079-b01538113e2d?w=400" },
    { id: 3, nombre: "Cactus", precio: 12.50, img: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400" }
];

// Cargar productos y carrito de memoria
let productos = JSON.parse(localStorage.getItem('prods')) || datosBase;
let carrito = JSON.parse(localStorage.getItem('cart')) || [];

// ================= FUNCIONES PRINCIPALES =================

// 1. Renderizar Tienda
function renderShop() {
    const grid = document.getElementById('grid');
    grid.innerHTML = productos.map(p => `
        <div class="card">
            <img src="${p.img}" alt="${p.nombre}">
            <div class="card-body">
                <h4>${p.nombre}</h4>
                <span class="price">$${parseFloat(p.precio).toFixed(2)}</span>
                <button class="btn-add" onclick="addToCart(${p.id})">Agregar +</button>
            </div>
        </div>
    `).join('');
}

// 2. Lógica del Carrito
function addToCart(id) {
    const prod = productos.find(p => p.id === id);
    carrito.push(prod);
    saveAndUpdate();
    toggleCart(true); // Abrir carrito al comprar
}

function removeFromCart(index) {
    carrito.splice(index, 1); // Borrar por posición
    saveAndUpdate();
}

function saveAndUpdate() {
    localStorage.setItem('cart', JSON.stringify(carrito));
    updateCartUI();
}

function updateCartUI() {
    // Actualizar Badge
    document.getElementById('cartCount').innerText = carrito.length;
    
    // Actualizar Lista Visual
    const container = document.getElementById('cartItemsContainer');
    if (carrito.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px;">Tu carrito está vacío 🌱</p>';
        document.getElementById('cartTotal').innerText = "$0.00";
        return;
    }

    let total = 0;
    container.innerHTML = carrito.map((item, index) => {
        total += parseFloat(item.precio);
        return `
            <div class="cart-item">
                <img src="${item.img}">
                <div class="item-details">
                    <h4>${item.nombre}</h4>
                    <p>$${parseFloat(item.precio).toFixed(2)}</p>
                    <button class="btn-remove" onclick="removeFromCart(${index})">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('cartTotal').innerText = `$${total.toFixed(2)}`;
}

function toggleCart(forceOpen = false) {
    const sidebar = document.getElementById('cartSidebar');
    if(forceOpen) {
        sidebar.classList.add('active');
    } else {
        sidebar.classList.toggle('active');
    }
}

function checkout() {
    if(carrito.length === 0) return alert("Agrega productos primero");
    alert(`¡Gracias por tu compra! Total: ${document.getElementById('cartTotal').innerText}`);
    carrito = []; // Vaciar
    saveAndUpdate();
    toggleCart();
}

// ================= LÓGICA VENDEDOR (LOGIN) =================

const loginModal = document.getElementById('loginModal');
const adminPanel = document.getElementById('adminPanel');

function abrirLogin() {
    // Si ya estoy logueado, mostrar panel directamente
    if(sessionStorage.getItem('isUserAdmin') === 'true') {
        adminPanel.style.display = 'block';
        window.scrollTo(0,0);
    } else {
        loginModal.style.display = 'flex';
    }
}

function cerrarLogin() {
    loginModal.style.display = 'none';
}

function verificarLogin() {
    const pass = document.getElementById('passwordInput').value;
    if(pass === "admin123") {
        sessionStorage.setItem('isUserAdmin', 'true'); // Guardar sesión temporal
        loginModal.style.display = 'none';
        adminPanel.style.display = 'block';
        window.scrollTo(0, 0); // Ir arriba para ver el panel
        alert("¡Bienvenido Vendedor!");
    } else {
        alert("Contraseña incorrecta");
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('isUserAdmin');
    adminPanel.style.display = 'none';
}

// Agregar producto desde panel
function agregarProducto(e) {
    e.preventDefault();
    const nuevo = {
        id: Date.now(),
        nombre: document.getElementById('newNombre').value,
        precio: document.getElementById('newPrecio').value,
        img: document.getElementById('newImg').value
    };
    productos.push(nuevo);
    localStorage.setItem('prods', JSON.stringify(productos));
    renderShop();
    e.target.reset();
    alert("Producto agregado correctamente");
}

// ================= INICIALIZACIÓN =================
renderShop();
updateCartUI();

// Verificar si ya estaba logueado al recargar
if(sessionStorage.getItem('isUserAdmin') === 'true') {
    adminPanel.style.display = 'block';
}
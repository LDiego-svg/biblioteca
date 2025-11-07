// --- 1. MEMORIA DEL FRONTEND Y CONFIGURACIÓN ---
const API_URL = 'api/'; 

// Memoria para guardar quién es el usuario y qué libros hay
let currentUser = null;
let allBooks = [];
let borrowCart = [];
// Referencias a los contenedores de las páginas
const pages = {
    auth: document.getElementById('auth-page'),
    user: document.getElementById('user-page'),
    admin: document.getElementById('admin-page'),
    bookPreview: document.getElementById('book-preview-page'),
    myBooks: document.getElementById('my-books-page'),
    cart: document.getElementById('cart-page')
};

// --- 2. NAVEGACIÓN ENTRE PÁGINAS ---
function showPage(pageName) {
    Object.values(pages).forEach(page => page.style.display = 'none');
    if (pages[pageName]) {
        pages[pageName].style.display = 'block';
    }
}

// --- 3. FUNCIONES DE RENDERIZADO---

// Dibuja la página de Login Y Registro
function renderAuthPage() {
    pages.auth.innerHTML = `
        <div class="card" style="max-width: 450px; margin: 2rem auto;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h1 style="margin: 0;">Gestión de Biblioteca</h1>
                <p style="color: #6c757d; margin: 0.5rem 0 0 0;">Pide prestado libros de tu biblioteca cercana</p>
            </div>

            <div class="auth-tabs">
                <button id="tab-login" class="btn btn-primary" style="flex: 1; border-radius: 0.375rem 0 0 0.375rem;">Iniciar Sesión</button>
                <button id="tab-register" class="btn btn-outline" style="flex: 1; border-radius: 0 0.375rem 0.375rem 0; margin-left: -2px;">Registrarse</button>
            </div>

            <form id="login-form" style="margin-top: 1.5rem;">
                <div class="input-group">
                    <label for="login-username">Usuario</label>
                    <input id="login-username" type="text" class="input" value="user" required />
                </div>
                <div class="input-group">
                    <label for="login-password">Contraseña</label>
                    <input id="login-password" type="password" class="input" value="user" required />
                </div>
                <p style="font-size: 0.8rem; color: #6c757d;">credenciales de usuario 'user'/'user' o de administrador 'admin'/'admin'</p>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Iniciar Sesión</button>
            </form>

            <form id="register-form" style="margin-top: 1.5rem; display: none;">
                <div class="input-group">
                    <label for="reg-fullname">Nombre Completo</label>
                    <input id="reg-fullname" type="text" class="input" required />
                </div>
                <div class="input-group">
                    <label for="reg-username">Usuario</label>
                    <input id="reg-username" type="text" class="input" required />
                </div>
                <div class="input-group">
                    <label for="reg-email">Email</label>
                    <input id="reg-email" type="email" class="input" required />
                </div>
                <div class="input-group">
                    <label for="reg-password">Contraseña</label>
                    <input id="reg-password" type="password" class="input" required />
                </div>
                <div class="input-group">
                    <label for="reg-confirm-password">Confirmar Contraseña</label>
                    <input id="reg-confirm-password" type="password" class="input" required />
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Crear Cuenta</button>
            </form>
        </div>
    `;

    // --- AÑADIR LOS LISTENERS ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        handleLogin(username, password); 
    });

    registerForm.addEventListener('submit', handleRegister);

    tabLogin.addEventListener('click', () => {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabLogin.classList.add('btn-primary');
        tabLogin.classList.remove('btn-outline');
        tabRegister.classList.add('btn-outline');
        tabRegister.classList.remove('btn-primary');
    });

    tabRegister.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabLogin.classList.add('btn-outline');
        tabLogin.classList.remove('btn-primary');
        tabRegister.classList.add('btn-primary');
        tabRegister.classList.remove('btn-outline');
    });
}

// Dibuja la página principal del usuario
async function renderUserPage() {
    // 1. Pedir al PHP los libros que YA he prestado
    const myBorrowedBooks = await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`);
    
    //  MEJORA 1: Verificación defensiva 
    // Si myBorrowedBooks es null (por un error de API), lo tratamos como un array vacío.
    const borrowedIds = myBorrowedBooks ? myBorrowedBooks.map(b => b.id_libro) : [];

    pages.user.innerHTML = `
        <div class="header">
            <div class="header-title">
                <div>
                    <h1>Buscar Libros</h1>
                    <p>Bienvenido, ${currentUser.username}</p>
                </div>
            </div>
            <div class="header-actions">
                <button id="my-books-btn" class="btn btn-outline">Mis Libros (${borrowedIds.length})</button>
                <button id="cart-btn" class="btn btn-outline">Carrito (${borrowCart.length})</button>
                <button id="logout-btn" class="btn btn-outline">Salir</button>
            </div>
        </div>
        <div class="card">
            <input id="search-input" type="text" class="input" placeholder="Buscar libros por título o autor..." />
        </div>
        <div id="books-grid" class="books-grid"></div>
    `;
    
    // 3. Obtenemos todos los libros del backend
    allBooks = await apiCall('libros.php');

    if (!allBooks) {
        console.error("No se pudieron cargar 'allBooks'. Deteniendo render.");
        alert("Error: No se pudo conectar con la base de datos de libros. Revisa la consola.");
        return; // Salimos de la función para evitar más errores
    }

    // 4. Dibuja la cuadrícula de libros
    renderBooksGrid(allBooks, borrowedIds);

    try {
        const allGridButtons = document.querySelectorAll('#books-grid .book-card .btn');
        allGridButtons.forEach(button => {
            if (button.innerText === '') { // Solo si está vacío
                if (button.disabled) {
                    button.innerText = 'Prestado';
                } else if (button.classList.contains('btn-outline')) {
                    button.innerText = 'Quitar de la Lista';
                } else {
                    button.innerText = 'Añadir al carrito';
                }
            }
        });
    } catch (e) { console.error('Error en hack de botones:', e); }
    
    // 5. Listeners
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('my-books-btn').addEventListener('click', renderMyBooksPage);
    document.getElementById('cart-btn').addEventListener('click', renderCartPage);

    document.getElementById('search-input').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        const filteredBooks = allBooks ? allBooks.filter(book => 
            book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query)
        ) : [];
        
        renderBooksGrid(filteredBooks, borrowedIds);
    });
    showPage('user');
}

// Dibuja la cuadrícula de libros
function renderBooksGrid(books, borrowedIds) {
    const grid = document.getElementById('books-grid');
    if (books.length === 0) {
        grid.innerHTML = "<p>No se encontraron libros.</p>";
        return;
    }

    // PASO 1: Dibujamos los botones VACÍOS y SIN ONCLICK, solo con un ID
    grid.innerHTML = books.map(book => {
        const isBorrowed = borrowedIds.includes(book.id);
        const isInCart = borrowCart.includes(book.id);

        let buttonHTML = '';
        const buttonId = `btn-book-${book.id}`; // ID único

        if (isBorrowed) {
            buttonHTML = `<button 
                            class="btn" 
                            style="width: 100%; margin-top: 1rem;" 
                            disabled id="${buttonId}">
                          </button>`; // <-- Vacío y sin onclick
        } else if (isInCart) {
            buttonHTML = `<button 
                            class="btn btn-outline" 
                            style="width: 100%; margin-top: 1rem;" 
                            id="${buttonId}">
                          </button>`; // <-- Vacío y sin onclick
        } else {
            buttonHTML = `<button 
                            class="btn btn-primary" 
                            style="width: 100%; margin-top: 1rem;" 
                            id="${buttonId}">
                          </button>`; // <-- Vacío y sin onclick
        }

        return `
            <div class="card book-card" onclick="renderBookPreviewPage(${book.id})">
                <div class="book-card-info">
                    <div class="title-row">
                        <h3>${book.title}</h3>
                        <span class="category-badge">${book.category}</span>
                    </div>
                    <p class="author">de ${book.author}</p>
                </div>
                ${buttonHTML}
            </div>
        `;
    }).join('');

    // PASO 2: AHORA les añadimos el texto Y EL ONCLICK correcto
    books.forEach(book => {
        const button = document.getElementById(`btn-book-${book.id}`);
        if (button) {
            const isBorrowed = borrowedIds.includes(book.id);
            const isInCart = borrowCart.includes(book.id);

            if (isBorrowed) {
                button.innerText = 'Prestado';
            } else if (isInCart) {
                button.innerText = 'Quitar de la Lista';
                // ¡Añadimos el listener!
                button.addEventListener('click', (event) => {
                    event.stopPropagation(); // <-- ¡La magia para que no te lleve a la preview!
                    handleRemoveFromCart(book.id);
                });
            } else {
                button.innerText = 'Añadir al carrito';
                // ¡Añadimos el listener!
                button.addEventListener('click', (event) => {
                    event.stopPropagation(); // <-- ¡La magia para que no te lleve a la preview!
                    handleAddToCart(book.id);
                });
            }
        }
    });
}


// Dibuja la página de vista previa de un libro
// Dibuja la página de vista previa de un libro
async function renderBookPreviewPage(bookId) {
    const book = allBooks.find(b => b.id == bookId);
    if (!book) return;

    const myBorrowedBooks = await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`);
    const isBorrowed = myBorrowedBooks ? myBorrowedBooks.some(b => b.id_libro == book.id) : false;
    const isInCart = borrowCart.includes(book.id);
    
    const buttonId = `btn-preview-${book.id}`; // ID único
    let buttonHTML = '';

    // PASO 1: Dibujamos el botón VACÍO y SIN ONCLICK
    if (isBorrowed) {
        buttonHTML = `<button class="btn" style="width: 100%; margin-top: 1rem;" disabled id="${buttonId}"></button>`;
    } else if (isInCart) {
        buttonHTML = `<button class="btn btn-outline" style="width: 100%; margin-top: 1rem;" id="${buttonId}"></button>`;
    } else {
        buttonHTML = `<button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" id="${buttonId}"></button>`;
    }
    
    pages.bookPreview.innerHTML = `
        <button id="back-to-list-btn" class="btn btn-outline" style="margin-bottom: 1.5rem;">← Volver a la lista</button>
        <div class="book-preview-grid">
            <div class="book-preview-sidebar">
                <div class="card">
                    ${buttonHTML} </div>
                <div class="card">
                    <p><strong>Autor:</strong> ${book.author}</p>
                    <p><strong>Publicado:</strong> ${book.publishedYear}</p>
                    <p><strong>Páginas:</strong> ${book.pages}</p>
                </div>
            </div>
            <div class="book-preview-details">
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h1>${book.title}</h1>
                        <span class="category-badge">${book.category}</span>
                    </div>
                    <p class="author" style="margin-top:-1rem;">por ${book.author}</p>
                    <div class="rating">${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}</div>
                    <h3>Descripción</h3>
                    <p>${book.description}</p>
                    <hr style="margin: 2rem 0;">
                    <h3>Detalles del Libro</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="card"><p><strong>Categoría</strong><br>${book.category}</p></div>
                        <div class="card"><p><strong>Disponibilidad</strong><br>${isBorrowed ? 'Ya prestado por ti' : (isInCart ? 'En tu lista' : 'Disponible')}</p></div>
                        <div class="card"><p><strong>Páginas</strong><br>${book.pages}</p></div>
                        <div class="card"><p><strong>Año</strong><br>${book.publishedYear}</p></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // PASO 2: AHORA le añadimos el texto Y EL ONCLICK correcto
    const previewButton = document.getElementById(buttonId);
    if (previewButton) {
        if (isBorrowed) {
            previewButton.innerText = 'Ya Prestado';
        } else if (isInCart) {
            previewButton.innerText = 'Quitar de la Lista';
            previewButton.addEventListener('click', (event) => {
                // No necesitamos stopPropagation() aquí, pero no hace daño
                handleRemoveFromCart(book.id);
            });
        } else {
            previewButton.innerText = 'Añadir al carrito';
            previewButton.addEventListener('click', (event) => {
                handleAddToCart(book.id);
            });
        }
    }

    showPage('bookPreview');
    document.getElementById('back-to-list-btn').addEventListener('click', renderUserPage);
}

// Dibuja la página "Mis Libros"
async function renderMyBooksPage() {
    const myBooks = await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`);

    pages.myBooks.innerHTML = `
        <div class="header">
            <div class="header-title">
                <h1>Mis Libros Prestados</h1>
                <p>Tienes ${myBooks.length} ${myBooks.length === 1 ? 'libro' : 'libros'} prestado${myBooks.length === 1 ? '' : 's'}</p>
            </div>
            <button id="back-to-user-btn" class="btn btn-outline">← Volver</button>
        </div>
        <div id="my-books-grid" class="books-grid">
            ${myBooks.length === 0 
                ? `<div class="card" style="grid-column: 1 / -1; text-align: center;">
                        <h2>No tienes libros prestados</h2>
                        <p style="color: #6c757d; margin-bottom: 1.5rem;">Comienza a explorar nuestra colección y pide prestado algunos libros</p>
                        <button id="explore-btn" class="btn btn-primary">Explorar Libros</button>
                </div>`
                : myBooks.map(book => `
                    <div class="card">
                        <h3>${book.title}</h3>
                        <p class="author">de ${book.author}</p>
                        <p><strong>Prestado el:</strong> ${book.fecha_prestamo}</p>
                        <button class="btn btn-outline" style="width:100%; margin-top:1rem;" onclick="handleReturn(${book.id_prestamo})">Devolver Libro</button>
                    </div>
                `).join('')
            }
        </div>
    `;
    showPage('myBooks');
    document.getElementById('back-to-user-btn').addEventListener('click', () => showPage('user'));
    if (myBooks.length === 0) {
        document.getElementById('explore-btn').addEventListener('click', () => showPage('user'));
    }
}

function renderCartPage(){
    const booksInCart = allBooks.filter(book => borrowCart.includes(book.id));
    pages.cart.innerHTML = `
        <div class="header">
            <div class="header-title">
                <h1>Mi Lista de Préstamos</h1>
                <p>Tienes ${booksInCart.length} ${booksInCart.length === 1 ? 'libro' : 'libros'} listos para pedir.</p>
            </div>
            <button id="back-to-user-btn-from-cart" class="btn btn-outline">← Volver a la Búsqueda</button>
        </div>
        
        ${booksInCart.length === 0 
            ? `<div class="card" style="text-align: center; grid-column: 1 / -1;">
                    <h2>Tu lista está vacía</h2>
                    <p style="color: #6c757d; margin-bottom: 1.5rem;">Añade libros desde la página de búsqueda.</p>
                    <button id="explore-btn-from-cart" class="btn btn-primary">Explorar Libros</button>
            </div>`
            : `<div class_
                    <div class="card">
                        <h2>Resumen de Préstamo</h2>
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Autor</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${booksInCart.map(book => `
                                    <tr>
                                        <td>${book.title}</td>
                                        <td>${book.author}</td>
                                        <td>
                                            <button class="btn btn-outline" style="padding: 0.25rem 0.5rem;" onclick="handleRemoveFromCart(${book.id})">
                                                Quitar
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <button class="btn btn-primary" style="width: 100%; font-size: 1.1rem; margin-top: 1.5rem;" onclick="handleBorrowAll()">
                            Confirmar Préstamo de (${booksInCart.length}) Libros
                        </button>
                    </div>
            </div>`
        }
    `;
    showPage('cart');

    // Listeners
    document.getElementById('back-to-user-btn-from-cart').addEventListener('click', renderUserPage);
    if (booksInCart.length === 0) {
        document.getElementById('explore-btn-from-cart').addEventListener('click', () => showPage('user'));
    }
}

// Dibuja la página de Administrador
async function renderAdminPage() {
    const allBorrowedBooks = await apiCall('admin_data.php');
    const totalPrestamos = allBorrowedBooks.length;
    const usuariosActivos = [...new Set(allBorrowedBooks.map(b => b.username))].length;

    pages.admin.innerHTML = `
        <div class="header">
            <div class="header-title">
                <h1>Página de Administrador</h1>
                <p>Sistema de Gestión de Librería</p>
            </div>
            <button id="admin-logout-btn" class="btn btn-outline">Salir</button>
        </div>
        
        <div class="books-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 2rem;">
            <div class="card">
                <p style="color: #6c757d;">Total de libros prestados</p>
                <h1 style="font-size: 2.5rem;">${totalPrestamos}</h1>
            </div>
            <div class="card">
                <p style="color: #6c757d;">Usuarios Activos</p>
                <h1 style="font-size: 2.5rem;">${usuariosActivos}</h1>
            </div>
            <div class="card">
                <p style="color: #6c757d;">Préstamos (Hoy)</p>
                <h1 style="font-size: 2.5rem;">0</h1>
            </div>
        </div>

        <div class="card">
            <h2>Préstamos Recientes</h2>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Título del Libro</th>
                        <th>Prestado a</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${allBorrowedBooks.length === 0 ? '<tr><td colspan="3">No hay préstamos aún.</td></tr>' : ''}
                    ${allBorrowedBooks.map(book => `
                        <tr>
                            <td>${book.title}</td>
                            <td>${book.username}</td>
                            <td>${book.fecha_prestamo}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    showPage('admin');
    document.getElementById('admin-logout-btn').addEventListener('click', handleLogout);
}

// --- 4. MANEJADORES DE LÓGICA (LAS "REACCIONES") ---

// Función genérica para llamar a nuestra API PHP
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(API_URL + endpoint, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
        const responseText = await response.text();
        if (!responseText) {
            throw new Error("Respuesta vacía del servidor.");
        }
        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.error("Error al parsear JSON:", responseText);
            throw new Error(`Respuesta inválida del servidor: ${e.message}. El servidor dijo: ${responseText}`);
        }
    } catch (error) {
        console.error('Error en apiCall:', error);
        alert(`Error de comunicación con el servidor: ${error.message}`);
        return null;
    }
}

function updateCartButton() {
    const cartButton = document.getElementById('cart-btn');
    if (cartButton){
        cartButton.innerText = `Carrito (${borrowCart.length})`;
    }
}

function handleAddToCart(bookId){
    if(borrowCart.includes(bookId)){
        alert("Este libro ya está en tu lista.");
        return;
    }
    borrowCart.push(bookId);
    alert("Libro añadido a la lista.");
    if(pages.user.style.display === 'block'){
        renderBookPreviewPage(bookId);
    }
}

function handleRemoveFromCart(bookId){
    const index = borrowCart.indexOf(bookId);
    if(index>-1){
        borrowCart.splice(index, 1);
    }
    if(pages.user.style.display === 'block'){
        renderUserPage();
    } else if (pages.bookPreview.style.display === 'block'){
        renderBookPreviewPage(bookId);
    }
    else if(pages.cart.style.display === 'block'){
        renderCartPage();
    }
}

async function handleBorrowAll() {
    if(borrowCart.lenght === 0){
        alert("Tu lista está vacia.");
        return;
    }

    const button = event.target;
    button.disable = true;
    button.innerText = 'Procesando...';

    const data = await apiCall('prestar_varios.php', 'POST', {
        id_usuario: currentUser.id,
        id_libros: borrowCart
    });
    if (data && data.success){
        alert(data.message);
        borrowCart = [];
        renderUserPage = [];
    } else {
        alert(data.error || "No se pudieron prestar los libros.");
        button.disabled = false;
        button.innerText = `Confirmar Préstamo de (${borrowCart.lenght} libros)`;
    }
}

// Reacción al formulario de Login
async function handleLogin(username, password) {
    const data = await apiCall('login.php', 'POST', { username, password });

    if (data && data.user) {
        currentUser = data.user; 
        if (currentUser.role === 'admin') {
            renderAdminPage();
        } else {
            renderUserPage();
        }
    } else {
        alert(data.error || "Usuario o contraseña incorrectos.");
    }
}

// Reacción al formulario de Registro
async function handleRegister(event) {
    event.preventDefault();
    
    // 1. Obtenemos los datos del formulario de registro
    const fullName = document.getElementById('reg-fullname').value;
    const email = document.getElementById('reg-email').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    // 2. Verificación simple en el frontend
    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden.");
        return; 
    }

    // 3. Llamamos a nuestra API en PHP
    const data = await apiCall('registro.php', 'POST', {
        fullName: fullName,
        email: email,
        username: username,
        password: password
    });

    // 4. Mostramos la respuesta del servidor
    if (data && data.success) {
        alert(data.message);
        document.getElementById('tab-login').click(); 
    } else {
        alert((data && data.error) || "No se pudo registrar.");
    }
}

// Reacción al botón de Salir
function handleLogout() {
    currentUser = null;
    renderAuthPage();
    showPage('auth');
}


// Reacción al botón de Devolver
async function handleReturn(prestamoId) {
    const data = await apiCall('devolver.php', 'POST', {
        id_prestamo: prestamoId
    });

    if (data && data.success) {
        alert(data.message);
        renderMyBooksPage(); // Reaccionamos recargando la página de mis libros
    } else {
        alert(data.error || "No se pudo devolver el libro.");
    }
}

// --- 5. INICIO DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Cuando la página carga, lo primero que hacemos es dibujar el login.
    renderAuthPage();
    showPage('auth');
});
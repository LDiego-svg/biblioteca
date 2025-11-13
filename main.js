// --- 1. CONFIGURACIÓN GLOBAL Y ESTADO ---

const API_URL = 'api/'; // Endpoint base de la API

// Estado global de la aplicación
let currentUser = null; // Objeto del usuario autenticado
let allBooks = [];      // Caché local de la lista completa de libros
let borrowCart = [];    // Array de IDs de libros (estado del carrito)

// Referencias a los contenedores de vistas del DOM
const pages = {
    auth: document.getElementById('auth-page'),
    user: document.getElementById('user-page'),
    admin: document.getElementById('admin-page'),
    bookPreview: document.getElementById('book-preview-page'),
    myBooks: document.getElementById('my-books-page'),
    cart: document.getElementById('cart-page')
};

// --- 2. NAVEGACIÓN Y CARGA DE VISTAS ---

/** 
 * Router principal de la SPA. Oculta todas las páginas y muestra la solicitada.
 * @param {string} pageName - Clave del objeto 'pages' (ej. 'user', 'admin').
 */
function showPage(pageName) {
    Object.values(pages).forEach(page => {
        if (page) page.style.display = 'none';
    });
    
    if (pages[pageName]) {
        pages[pageName].style.display = 'block';
    }
}

/**
 * Carga plantillas HTML desde la carpeta /vistas.
 * @param {string} nombreVista - Nombre del archivo (sin .html).
 * @returns {Promise<string|null>} Contenido HTML como texto o null en error.
 */
async function cargarVista(nombreVista) {
    try {
        const response = await fetch(`vistas/${nombreVista}.html`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se encontró ${nombreVista}.html`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error al cargar plantilla: ${error.message}`);
        return null; // Devolvemos null para un manejo de errores en el render
    }
}

// --- 3. FUNCIONES DE RENDERIZADO (VISTAS) ---

/**
 * Renderiza la vista de autenticación (login/registro).
 */
async function renderAuthPage() {
    const html = await cargarVista('autenticacion');
    if (html === null) {
        pages.auth.innerHTML = '<p>Error crítico: No se pudo cargar la vista de autenticación.</p>';
        return;
    }
    pages.auth.innerHTML = html;

    // Asignación de listeners para formularios y tabs
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

    // Lógica de pestañas
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

/**
 * Renderiza la vista principal del usuario (catálogo de libros).
 */
async function renderUserPage() {
    // 1. Obtener datos de libros prestados (default a array vacío si falla)
    const myBorrowedBooks = (await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`)) || [];
    const borrowedIds = myBorrowedBooks.map(b => b.id_libro);

    // 2. Cargar y "compilar" la plantilla
    let plantillaHtml = await cargarVista('usuario');
    if (!plantillaHtml) return; // Salida segura si la plantilla no cargó

    plantillaHtml = plantillaHtml.replace('{{nombreUsuario}}', currentUser.username);
    plantillaHtml = plantillaHtml.replace('{{contadorMisLibros}}', borrowedIds.length);
    plantillaHtml = plantillaHtml.replace('{{contadorCarrito}}', borrowCart.length);

    // 3. Inyectar HTML
    pages.user.innerHTML = plantillaHtml;

    // 4. Poblar la caché 'allBooks'
    allBooks = (await apiCall('libros.php')) || [];
    if (allBooks.length === 0) {
        console.error("No se pudieron cargar 'allBooks'.");
        alert("Error: No se pudo conectar con la base de datos de libros.");
        return; 
    }

    // 5. Renderizar la cuadrícula de libros
    renderBooksGrid(allBooks, borrowedIds);
    
    // 6. Asignar Listeners a la vista
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('my-books-btn').addEventListener('click', renderMyBooksPage);
    document.getElementById('cart-btn').addEventListener('click', renderCartPage);

    // Listener del filtro de búsqueda (cliente)
    document.getElementById('search-input').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        const filteredBooks = allBooks ? allBooks.filter(book => 
            book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query)
        ) : [];
        
        renderBooksGrid(filteredBooks, borrowedIds);
    });

    showPage('user');
}

/**
 * Renderiza la cuadrícula de libros en '#books-grid'.
 * @param {Array} books - Array de objetos de libro a mostrar.
 * @param {Array} borrowedIds - IDs de libros ya prestados (para deshabilitar botones).
 */
function renderBooksGrid(books, borrowedIds) {
    const grid = document.getElementById('books-grid');
    if (books.length === 0) {
        grid.innerHTML = "<p>No se encontraron libros.</p>";
        return;
    }

    // PASO 1: Inyección masiva de HTML.
    // Se crean los botones sin listeners para asignarlos en el PASO 2.
    grid.innerHTML = books.map(book => {
        const isBorrowed = borrowedIds.includes(book.id);
        const isInCart = borrowCart.includes(book.id);

        let buttonHTML = '';
        const buttonId = `btn-book-${book.id}`; // ID único para binding

        if (isBorrowed) {
            buttonHTML = `<button class="btn" style="width: 100%; margin-top: 1rem;" disabled id="${buttonId}"></button>`;
        } else if (isInCart) {
            buttonHTML = `<button class="btn btn-outline" style="width: 100%; margin-top: 1rem;" id="${buttonId}"></button>`;
        } else {
            buttonHTML = `<button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" id="${buttonId}"></button>`;
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

    // PASO 2: Binding de eventos post-renderizado.
    // Se asignan textos y listeners a los botones creados en el PASO 1.
    books.forEach(book => {
        const button = document.getElementById(`btn-book-${book.id}`);
        if (button) {
            const isBorrowed = borrowedIds.includes(book.id);
            const isInCart = borrowCart.includes(book.id);

            if (isBorrowed) {
                button.innerText = 'Prestado';
            } else if (isInCart) {
                button.innerText = 'Quitar de la Lista';
                button.addEventListener('click', (event) => {
                    // Evita que el click en el botón active el click de la tarjeta.
                    event.stopPropagation(); 
                    handleRemoveFromCart(book.id);
                });
            } else {
                button.innerText = 'Añadir al carrito';
                button.addEventListener('click', (event) => {
                    event.stopPropagation();
                    handleAddToCart(book.id);
                });
            }
        }
    });
}


/**
 * Renderiza la vista detallada de un libro.
 * @param {number} bookId - ID del libro (obtenido de 'allBooks').
 */
async function renderBookPreviewPage(bookId) {
    // 1. Obtener datos
    const book = allBooks.find(b => b.id == bookId);
    if (!book) return; // Salida segura si el libro no está en la caché

    const myBorrowedBooks = (await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`)) || [];
    const isBorrowed = myBorrowedBooks.some(b => b.id_libro == book.id);
    const isInCart = borrowCart.includes(book.id);

    // 2. Cargar plantilla
    let plantillaHtml = await cargarVista('vista_libro');
    if (!plantillaHtml) return;

    // 3. Preparar HTML dinámico
    const buttonId = `btn-preview-${book.id}`;
    let botonHTML = '';
    let disponibilidad = 'Disponible';

    if (isBorrowed) {
        botonHTML = `<button class="btn" style="width: 100%; margin-top: 1rem;" disabled id="${buttonId}"></button>`;
        disponibilidad = 'Ya prestado por ti';
    } else if (isInCart) {
        botonHTML = `<button class="btn btn-outline" style="width: 100%; margin-top: 1rem;" id="${buttonId}"></button>`;
        disponibilidad = 'En tu lista';
    } else {
        botonHTML = `<button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" id="${buttonId}"></button>`;
    }

    const ratingEstrellas = '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating);

    // 4. Inyección de datos en la plantilla (templating básico)
    plantillaHtml = plantillaHtml.replace('{{botonHTML}}', botonHTML);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{autor}}', 'g'), book.author);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{ano}}', 'g'), book.publishedYear);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{paginas}}', 'g'), book.pages);
    plantillaHtml = plantillaHtml.replace('{{titulo}}', book.title);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{categoria}}', 'g'), book.category);
    plantillaHtml = plantillaHtml.replace('{{ratingEstrellas}}', ratingEstrellas);
    plantillaHtml = plantillaHtml.replace('{{descripcion}}', book.description);
    plantillaHtml = plantillaHtml.replace('{{disponibilidad}}', disponibilidad);

    // 5. Inyectar HTML al DOM
    pages.bookPreview.innerHTML = plantillaHtml;
    
    // 6. Binding del botón post-renderizado
    const previewButton = document.getElementById(buttonId);
    if (previewButton) {
        if (isBorrowed) {
            previewButton.innerText = 'Ya Prestado';
        } else if (isInCart) {
            previewButton.innerText = 'Quitar de la Lista';
            previewButton.addEventListener('click', () => handleRemoveFromCart(book.id));
        } else {
            previewButton.innerText = 'Añadir al carrito';
            previewButton.addEventListener('click', () => handleAddToCart(book.id));
        }
    }

    // 7. Listeners de la vista
    showPage('bookPreview');
    document.getElementById('back-to-list-btn').addEventListener('click', renderUserPage);
}

/**
 * Renderiza la vista "Mis Libros" (préstamos activos del usuario).
 */
async function renderMyBooksPage() {
    // 1. Obtener préstamos
    const myBooks = (await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`)) || [];

    // 2. Cargar plantilla base
    let plantillaHtml = await cargarVista('mis_libros');
    if (!plantillaHtml) return;

    // 3. Preparar pluralización
    const contador = myBooks.length;
    const pluralLibro = contador === 1 ? 'libro' : 'libros';
    const pluralS = contador === 1 ? '' : 's';

    // 4. Inyectar datos en plantilla
    plantillaHtml = plantillaHtml.replace('{{contador}}', contador);
    plantillaHtml = plantillaHtml.replace('{{pluralLibro}}', pluralLibro);
    plantillaHtml = plantillaHtml.replace('{{pluralS}}', pluralS);
    pages.myBooks.innerHTML = plantillaHtml;

    // 5. Renderizar contenido dinámico (la cuadrícula)
    const gridContainer = document.getElementById('my-books-grid');
    
    if (myBooks.length === 0) {
        // Estado vacío
        gridContainer.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center;">
                <h2>No tienes libros prestados</h2>
                <p style="color: #6c757d; margin-bottom: 1.5rem;">Comienza a explorar nuestra colección.</p>
                <button id="explore-btn" class="btn btn-primary">Explorar Libros</button>
            </div>`;
    } else {
        // Renderizar tarjetas de libros prestados
        gridContainer.innerHTML = myBooks.map(book => `
            <div class="card">
                <h3>${book.title}</h3>
                <p class="author">de ${book.author}</p>
                <p><strong>Prestado el:</strong> ${book.fecha_prestamo}</p>
                <button class="btn btn-outline" style="width:100%; margin-top:1rem;" onclick="handleReturn(${book.id_prestamo})">Devolver Libro</button>
            </div>
        `).join('');
    }

    // 6. Listeners
    showPage('myBooks');
    document.getElementById('back-to-user-btn').addEventListener('click', () => showPage('user'));
    
    const exploreBtn = document.getElementById('explore-btn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => showPage('user'));
    }
}

/**
 * Renderiza la vista del Carrito (lista de préstamos pendientes).
 */
async function renderCartPage() {
    // 1. Obtener datos (filtrando la caché 'allBooks' con 'borrowCart')
    const booksInCart = allBooks.filter(book => borrowCart.includes(book.id));

    // 2. Cargar plantilla base
    let plantillaHtml = await cargarVista('carrito');
    if (!plantillaHtml) return;

    // 3. Pluralización
    const contador = booksInCart.length;
    const pluralLibro = contador === 1 ? 'libro' : 'libros';
    const pluralS = contador === 1 ? '' : 's';

    // 4. Inyectar datos
    plantillaHtml = plantillaHtml.replace('{{contador}}', contador);
    plantillaHtml = plantillaHtml.replace('{{pluralLibro}}', pluralLibro);
    plantillaHtml = plantillaHtml.replace('{{pluralS}}', pluralS);
    pages.cart.innerHTML = plantillaHtml;

    // 5. Renderizar contenido dinámico
    const contentContainer = document.getElementById('cart-content-container');
    
    if (booksInCart.length === 0) {
        // Estado vacío
        contentContainer.innerHTML = `
            <div class="card" style="text-align: center; grid-column: 1 / -1;">
                <h2>Tu lista está vacía</h2>
                <p style="color: #6c757d; margin-bottom: 1.5rem;">Añade libros desde la página de búsqueda.</p>
                <button id="explore-btn-from-cart" class="btn btn-primary">Explorar Libros</button>
            </div>`;
    } else {
        // Renderizar tabla de resumen
        contentContainer.innerHTML = `
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
                
                <button class="btn btn-primary" style="width: 100%; font-size: 1.1rem; margin-top: 1.5rem;" onclick="handleBorrowAll(event)">
                    Confirmar Préstamo de (${booksInCart.length}) Libros
                </button>
            </div>`;
    }

    // 6. Listeners
    showPage('cart');
    document.getElementById('back-to-user-btn-from-cart').addEventListener('click', renderUserPage);
    
    const exploreBtn = document.getElementById('explore-btn-from-cart');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => showPage('user'));
    }
}

/**
 * Renderiza la vista de Administrador.
 */
async function renderAdminPage() {
    // 1. Cargar plantilla
    const plantillaHtml = await cargarVista('admin');
    if (!plantillaHtml) return;
    pages.admin.innerHTML = plantillaHtml;

    // 2. Obtener datos
    const allBorrowedBooks = (await apiCall('admin_data.php')) || [];

    // 3. Calcular estadísticas
    const totalPrestamos = allBorrowedBooks.length;
    const usuariosActivos = [...new Set(allBorrowedBooks.map(b => b.username))].length; // Conteo de únicos

    // 4. Inyectar estadísticas
    document.getElementById('admin-total-prestamos').innerText = totalPrestamos;
    document.getElementById('admin-usuarios-activos').innerText = usuariosActivos;

    // 5. Renderizar tabla de préstamos
    const tablaCuerpo = document.getElementById('admin-tabla-cuerpo');
    if (allBorrowedBooks.length === 0) {
        tablaCuerpo.innerHTML = '<tr><td colspan="3">No hay préstamos aún.</td></tr>';
    } else {
        tablaCuerpo.innerHTML = allBorrowedBooks.map(book => `
            <tr>
                <td>${book.title}</td>
                <td>${book.username}</td>
                <td>${book.fecha_prestamo}</td>
            </tr>
        `).join('');
    }

    // 6. Listeners
    showPage('admin');
    document.getElementById('admin-logout-btn').addEventListener('click', handleLogout);
}

// --- 4. MANEJADORES DE LÓGICA (API Y ACCIONES) ---

/**
 * Wrapper centralizado para 'fetch' que maneja la comunicación con la API.
 * @param {string} endpoint - Archivo PHP (ej. 'login.php').
 * @param {string} [method='GET'] - Método HTTP.
 * @param {Object} [body=null] - Objeto JS para enviar como JSON.
 * @returns {Promise<any|null>} Datos JSON parseados o null si falla.
 */
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
        const responseText = await response.text(); // Leer como texto primero

        if (!response.ok) {
            // Si el server manda un 4xx o 5xx, responseText suele tener el error
            throw new Error(responseText || `Error HTTP: ${response.status}`);
        }

        if (!responseText) {
            // Respuesta 200 OK pero vacía (ej. un DELETE sin 'echo')
            return { success: true, message: 'Operación completada.' }; 
        }

        try {
            return JSON.parse(responseText); // Intentar parsear
        } catch (e) {
            // Si el parseo falla, el PHP imprimió algo mal (ej. un warning)
            console.error("Error al parsear JSON:", responseText);
            throw new Error(`Respuesta inválida del servidor. El servidor dijo: ${responseText}`);
        }

    } catch (error) {
        console.error('Error en apiCall:', error.message);
        alert(`Error de comunicación con el servidor: ${error.message}`);
        return null; // Devolver null para que los 'handlers' puedan reaccionar
    }
}

/**
 * Añade un libro al estado 'borrowCart'.
 * @param {number} bookId - ID del libro a añadir.
 */
function handleAddToCart(bookId){
    if(borrowCart.includes(bookId)){
        return; // Evitar duplicados
    }
    borrowCart.push(bookId);
    alert("Libro añadido a la lista.");

    // Re-renderizar la vista actual para actualizar el estado del botón
    if(pages.user.style.display === 'block'){
        renderUserPage();
    }else if (pages.bookPreview.style.display === 'block'){
        renderBookPreviewPage(bookId);
    }
}

/**
 * Elimina un libro del estado 'borrowCart'.
 * @param {number} bookId - ID del libro a eliminar.
 */
function handleRemoveFromCart(bookId){
    const index = borrowCart.indexOf(bookId);
    if(index > -1){ // Asegurarse de que existe
        borrowCart.splice(index, 1);
    }

    // Re-renderizar la vista actual para reflejar el cambio
    if(pages.user.style.display === 'block'){
        renderUserPage();
    } else if (pages.bookPreview.style.display === 'block'){
        renderBookPreviewPage(bookId);
    }
    else if(pages.cart.style.display === 'block'){
        renderCartPage(); // Si está en el carrito, refresca el carrito
    }
}

/**
 * Envía la lista de 'borrowCart' a la API para procesar el préstamo múltiple.
 * @param {Event} event - Evento 'click' del botón.
 */
async function handleBorrowAll(event) {
    if (borrowCart.length === 0){
        return;
    }

    // Deshabilitar botón para prevenir doble submit
    const button = event.target;
    button.disabled = true; // BUGFIX: Corregido de .disable
    button.innerText = 'Procesando...';

    const data = await apiCall('prestar_varios.php', 'POST', {
        id_usuario: currentUser.id,
        id_libros: borrowCart
    });

    if (data && data.success){
        alert(data.message);
        borrowCart = []; // Limpiar carrito
        renderUserPage(); // Volver al catálogo
    } else {
        alert(data.error || "No se pudieron prestar los libros.");
        // Reactivar botón si falla
        button.disabled = false;
        button.innerText = `Confirmar Préstamo de (${borrowCart.length}) Libros`; // BUGFIX: Corregido de .lenght
    }
}

/**
 * Maneja el submit del formulario de login.
 */
async function handleLogin(username, password) {
    const data = await apiCall('login.php', 'POST', { username, password });

    if (data && data.user) {
        currentUser = data.user; // Establecer estado global
        // Enrutamiento basado en rol
        if (currentUser.role === 'admin') {
            renderAdminPage();
        } else {
            renderUserPage();
        }
    } else {
        alert(data.error || "Credenciales incorrectas.");
    }
}

/**
 * Maneja el submit del formulario de registro.
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('reg-fullname').value;
    const email = document.getElementById('reg-email').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden.");
        return; 
    }

    const data = await apiCall('registro.php', 'POST', {
        fullName: fullName,
        email: email,
        username: username,
        password: password
    });

    if (data && data.success) {
        alert(data.message);
        document.getElementById('tab-login').click(); // Cambiar a pestaña de login
    } else {
        alert((data && data.error) || "Error en el registro.");
    }
}

/**
 * Limpia el estado de sesión y vuelve a la página de autenticación.
 */
function handleLogout() {
    currentUser = null;
    allBooks = [];
    borrowCart = [];
    renderAuthPage();
    showPage('auth');
}

/**
 * Llama a la API para devolver un libro (eliminar un préstamo).
 * @param {number} prestamoId - El ID de la *fila* en la tabla 'prestamos'.
 */
async function handleReturn(prestamoId) {
    if (!confirm("¿Estás seguro de que quieres devolver este libro?")) {
        return;
    }

    const data = await apiCall('devolver.php', 'POST', {
        id_prestamo: prestamoId
    });

    if (data && data.success) {
        alert(data.message);
        renderMyBooksPage(); // Recargar la vista 'mis_libros'
    } else {
        alert(data.error || "No se pudo devolver el libro.");
    }
}

// --- 5. INICIO DE LA APLICACIÓN ---

/**
 * Punto de entrada. Se ejecuta al cargar el DOM.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Iniciar siempre en la vista de autenticación.
    renderAuthPage();
    showPage('auth');
});
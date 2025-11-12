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

async function cargarVista(nombreVista) {
    try {
        const response = await fetch(`vistas/${nombreVista}.html`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se encontró ${nombreVista}.html`);
        }
        return await response.text();
    } catch (error) {
        // Usamos 'error.message' en lugar del 'responseText' que no existe
        console.error(`Error al cargar la plantilla: ${error.message}`); 
        return null; // Devolvemos null para saber que falló
    }
}

// --- 3. FUNCIONES DE RENDERIZADO---

// Dibuja la página de Login Y Registro
async function renderAuthPage() {
    // 1. Carga el HTML desde el archivo
    const html = await cargarVista('autenticacion');
    
    // 2. Verificamos si el HTML se cargó antes de continuar
    if (html === null) {
        // Si 'cargarVista' falló, mostramos un error claro y nos detenemos
        pages.auth.innerHTML = '<p>Error al cargar el contenido de la página. Revisa que la carpeta "vistas" y el archivo "autenticacion.html" existan y estén bien escritos.</p>';
        return; // Salimos de la función para evitar el error 'null.addEventListener'
    }

    // 3. Inserta el HTML en la página
    pages.auth.innerHTML = html;

    // 4. AÑADE LOS LISTENERS 
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
    // 1. Pedir los datos primero
    // (Usamos la corrección de '|| []' para evitar errores si está vacío)
    const myBorrowedBooks = (await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`)) || [];
    const borrowedIds = myBorrowedBooks.map(b => b.id_libro);

    // 2. Cargar la plantilla HTML
    let plantillaHtml = await cargarVista('usuario');

    // 3. Reemplazar los marcadores con los datos reales
    plantillaHtml = plantillaHtml.replace('{{nombreUsuario}}', currentUser.username);
    plantillaHtml = plantillaHtml.replace('{{contadorMisLibros}}', borrowedIds.length);
    plantillaHtml = plantillaHtml.replace('{{contadorCarrito}}', borrowCart.length);

    // 4. Insertar el HTML final en la página
    pages.user.innerHTML = plantillaHtml;

    // 5. La lógica de la función (el resto) se queda igual.
    // Obtenemos todos los libros del backend
    allBooks = (await apiCall('libros.php')) || [];

    if (allBooks.length === 0) {
        console.error("No se pudieron cargar 'allBooks'. Deteniendo render.");
        alert("Error: No se pudo conectar con la base de datos de libros. Revisa la consola.");
        return; 
    }

    // Dibuja la cuadrícula de libros
    renderBooksGrid(allBooks, borrowedIds);

    // (El "hack" de los botones se queda aquí, es parte de la lógica de esta página)
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
    
    // Listeners (se quedan aquí, son la lógica de esta vista)
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
async function renderBookPreviewPage(bookId) {
    // 1. OBTENER DATOS
    const book = allBooks.find(b => b.id == bookId);
    if (!book) return;

    // (Usamos la corrección '|| []' para evitar el bug)
    const myBorrowedBooks = (await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`)) || [];
    const isBorrowed = myBorrowedBooks.some(b => b.id_libro == book.id);
    const isInCart = borrowCart.includes(book.id);

    // 2. CARGAR PLANTILLA
    let plantillaHtml = await cargarVista('vista_libro');

    // 3. PREPARAR DATOS DINÁMICOS
    const buttonId = `btn-preview-${book.id}`; // ID único para el botón
    let botonHTML = ''; // HTML del botón
    let disponibilidad = 'Disponible'; // Texto de disponibilidad

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

    // 4. REEMPLAZAR MARCADORES (Usamos .replace() varias veces)
    plantillaHtml = plantillaHtml.replace('{{botonHTML}}', botonHTML);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{autor}}', 'g'), book.author);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{ano}}', 'g'), book.publishedYear);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{paginas}}', 'g'), book.pages);
    plantillaHtml = plantillaHtml.replace('{{titulo}}', book.title);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{categoria}}', 'g'), book.category);
    plantillaHtml = plantillaHtml.replace('{{ratingEstrellas}}', ratingEstrellas);
    plantillaHtml = plantillaHtml.replace('{{descripcion}}', book.description);
    plantillaHtml = plantillaHtml.replace('{{disponibilidad}}', disponibilidad);

    // 5. INSERTAR HTML
    pages.bookPreview.innerHTML = plantillaHtml;
    
    // 6. LÓGICA DE BOTONES (El "hack" que hicimos)
    // Le añadimos el texto Y EL ONCLICK al botón que acabamos de insertar
    const previewButton = document.getElementById(buttonId);
    if (previewButton) {
        if (isBorrowed) {
            previewButton.innerText = 'Ya Prestado';
        } else if (isInCart) {
            previewButton.innerText = 'Quitar de la Lista';
            previewButton.addEventListener('click', (event) => {
                handleRemoveFromCart(book.id);
            });
        } else {
            previewButton.innerText = 'Añadir al carrito';
            previewButton.addEventListener('click', (event) => {
                handleAddToCart(book.id);
            });
        }
    }

    // 7. LISTENERS DE LA PÁGINA
    showPage('bookPreview');
    document.getElementById('back-to-list-btn').addEventListener('click', renderUserPage);
}

// Dibuja la página "Mis Libros"
async function renderMyBooksPage() {
    // 1. OBTENER DATOS
    const myBooks = await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`);

    // 2. CARGAR PLANTILLA "CÁSCARA"
    let plantillaHtml = await cargarVista('mis_libros');

    // 3. PREPARAR DATOS DINÁMICOS
    const contador = myBooks.length;
    const pluralLibro = contador === 1 ? 'libro' : 'libros';
    const pluralS = contador === 1 ? '' : 's';

    // 4. REEMPLAZAR MARCADORES
    plantillaHtml = plantillaHtml.replace('{{contador}}', contador);
    plantillaHtml = plantillaHtml.replace('{{pluralLibro}}', pluralLibro);
    plantillaHtml = plantillaHtml.replace('{{pluralS}}', pluralS);

    // 5. INSERTAR HTML "CÁSCARA"
    pages.myBooks.innerHTML = plantillaHtml;

    // 6. GENERAR Y INSERTAR EL CONTENIDO DINÁMICO (La cuadrícula)
    const gridContainer = document.getElementById('my-books-grid');
    
    if (myBooks.length === 0) {
        // Opción A: No hay libros
        gridContainer.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center;">
                <h2>No tienes libros prestados</h2>
                <p style="color: #6c757d; margin-bottom: 1.5rem;">Comienza a explorar nuestra colección y pide prestado algunos libros</p>
                <button id="explore-btn" class="btn btn-primary">Explorar Libros</button>
            </div>`;
    } else {
        // Opción B: Sí hay libros
        gridContainer.innerHTML = myBooks.map(book => `
            <div class="card">
                <h3>${book.title}</h3>
                <p class="author">de ${book.author}</p>
                <p><strong>Prestado el:</strong> ${book.fecha_prestamo}</p>
                <button class="btn btn-outline" style="width:100%; margin-top:1rem;" onclick="handleReturn(${book.id_prestamo})">Devolver Libro</button>
            </div>
        `).join('');
    }

    // 7. LISTENERS
    showPage('myBooks');
    document.getElementById('back-to-user-btn').addEventListener('click', () => showPage('user'));
    if (myBooks.length === 0) {
        document.getElementById('explore-btn').addEventListener('click', () => showPage('user'));
    }
}

// Dibuja la página de la Lista de Préstamos (Carrito)
async function renderCartPage() {
    // 1. OBTENER DATOS
    const booksInCart = allBooks.filter(book => borrowCart.includes(book.id));

    // 2. CARGAR PLANTILLA "CÁSCARA"
    let plantillaHtml = await cargarVista('carrito');

    // 3. PREPARAR DATOS DINÁMICOS
    const contador = booksInCart.length;
    const pluralLibro = contador === 1 ? 'libro' : 'libros';
    const pluralS = contador === 1 ? '' : 's';

    // 4. REEMPLAZAR MARCADORES
    plantillaHtml = plantillaHtml.replace('{{contador}}', contador);
    plantillaHtml = plantillaHtml.replace('{{pluralLibro}}', pluralLibro);
    plantillaHtml = plantillaHtml.replace('{{pluralS}}', pluralS);

    // 5. INSERTAR HTML "CÁSCARA"
    pages.cart.innerHTML = plantillaHtml;

    // 6. GENERAR Y INSERTAR EL CONTENIDO DINÁMICO
    const contentContainer = document.getElementById('cart-content-container');
    
    if (booksInCart.length === 0) {
        // Opción A: Carrito vacío
        contentContainer.innerHTML = `
            <div class="card" style="text-align: center; grid-column: 1 / -1;">
                <h2>Tu lista está vacía</h2>
                <p style="color: #6c757d; margin-bottom: 1.5rem;">Añade libros desde la página de búsqueda.</p>
                <button id="explore-btn-from-cart" class="btn btn-primary">Explorar Libros</button>
            </div>`;
    } else {
        // Opción B: Carrito con libros
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

    // 7. LISTENERS
    showPage('cart');
    document.getElementById('back-to-user-btn-from-cart').addEventListener('click', renderUserPage);
    if (booksInCart.length === 0) {
        document.getElementById('explore-btn-from-cart').addEventListener('click', () => showPage('user'));
    }
}

// Dibuja la página de Administrador
async function renderAdminPage() {
    // 1. CARGAR PLANTILLA "CÁSCARA"
    // Lo hacemos primero para que el usuario vea la estructura
    const plantillaHtml = await cargarVista('admin');
    pages.admin.innerHTML = plantillaHtml;

    // 2. OBTENER DATOS (Usando la corrección del bug que hicimos)
    const allBorrowedBooks = (await apiCall('admin_data.php')) || [];

    // 3. PREPARAR DATOS DINÁMICOS
    const totalPrestamos = allBorrowedBooks.length;
    const usuariosActivos = [...new Set(allBorrowedBooks.map(b => b.username))].length;

    // 4. INSERTAR DATOS EN LAS TARJETAS
    // (Usamos .getElementById para esto, es más limpio)
    document.getElementById('admin-total-prestamos').innerText = totalPrestamos;
    document.getElementById('admin-usuarios-activos').innerText = usuariosActivos;

    // 5. GENERAR Y INSERTAR EL CONTENIDO DINÁMICO (La tabla)
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

    // 6. LISTENERS
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
        renderUserPage();
    }else if (pages.bookPreview.style.display === 'block'){
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

async function handleBorrowAll(event) {
    if (borrowCart.length === 0){
        alert("Tu lista está vacia.");
        return;
    }

    const button = event.target;
    button.disable = true;
    button.innerText = 'Pedido Realizado.';

    const data = await apiCall('prestar_varios.php', 'POST', {
        id_usuario: currentUser.id,
        id_libros: borrowCart
    });
    if (data && data.success){
        alert(data.message);
        borrowCart = [];
        renderUserPage();
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
// --- 1. CONFIGURACIÓN GLOBAL  ---

const API_URL = 'api/'; 


let currentUser = null; 
let allBooks = [];      
let borrowCart = [];    

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
 * @param {string} pageName 
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
 * @param {string} nombreVista 
 * @returns {Promise<string|null>} 
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
        return null; 
    }
}

// --- 3. FUNCIONES DE RENDERIZADO  ---

async function renderAuthPage() {
    const html = await cargarVista('autenticacion');
    if (html === null) {
        pages.auth.innerHTML = '<p>Error crítico: No se pudo cargar la vista de autenticación.</p>';
        return;
    }
    pages.auth.innerHTML = html;

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

    //  La lógica de pestañas
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


// carga la vista de usuario
async function renderUserPage() {
    // Obtener datos de libros prestados 
    const myBorrowedBooks = (await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`)) || [];
    const borrowedIds = myBorrowedBooks.map(b => b.id_libro);

    //  Cargar y compilar la plantilla
    let plantillaHtml = await cargarVista('usuario');
    if (!plantillaHtml) return; 

    plantillaHtml = plantillaHtml.replace('{{nombreUsuario}}', currentUser.username);
    plantillaHtml = plantillaHtml.replace('{{contadorMisLibros}}', borrowedIds.length);
    plantillaHtml = plantillaHtml.replace('{{contadorCarrito}}', borrowCart.length);

    pages.user.innerHTML = plantillaHtml;

    allBooks = (await apiCall('libros.php')) || [];
    if (allBooks.length === 0) {
        console.error("No se pudieron cargar 'allBooks'.");
        alert("Error: No se pudo conectar con la base de datos de libros.");
        return; 
    }

    //  Renderizar la cuadrícula de libros
    renderBooksGrid(allBooks, borrowedIds);
    
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

/**
 * Renderiza la cuadrícula de libros en '#books-grid'.
 * @param {Array} books 
 * @param {Array} borrowedIds 
 */
function renderBooksGrid(books, borrowedIds) {
    const grid = document.getElementById('books-grid');
    if (books.length === 0) {
        grid.innerHTML = "<p>No se encontraron libros.</p>";
        return;
    }


    grid.innerHTML = books.map(book => {
        const isBorrowed = borrowedIds.includes(book.id);
        const isInCart = borrowCart.includes(book.id);

        let buttonHTML = '';
        const buttonId = `btn-book-${book.id}`; 

        if (isBorrowed) {
            buttonHTML = `<button class="btn" style="width: 100%; margin-top: 1rem;" disabled id="${buttonId}"></button>`;
        } else if (isInCart) {
            buttonHTML = `<button class="btn btn-outline" style="width: 100%; margin-top: 1rem;" id="${buttonId}"></button>`;
        } else {
            buttonHTML = `<button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" id="${buttonId}"></button>`;
        }

        const imagenHTML = book.imagen_url 
            ? `<img src="${book.imagen_url}" alt="${book.title}" class="book-cover-img">`
            : `<div class="book-icon">📚</div>`;
        
        // El contenedor completo de la portada
        const portadaDiv = `<div class="book-cover">${imagenHTML}</div>`;


        return `
            <div class="card book-card" onclick="renderBookPreviewPage(${book.id})">
                ${portadaDiv} 
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
 * @param {number} bookId 
 */
async function renderBookPreviewPage(bookId) {
    const book = allBooks.find(b => b.id == bookId);
    if (!book) return; 

    const myBorrowedBooks = (await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`)) || [];
    const isBorrowed = myBorrowedBooks.some(b => b.id_libro == book.id);
    const isInCart = borrowCart.includes(book.id);

    //  Cargar plantilla 
    let plantillaHtml = await cargarVista('vista_libro');
    if (!plantillaHtml) return;

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

    const imagenHTML = book.imagen_url 
        ? `<img src="${book.imagen_url}" alt="${book.title}" class="book-cover-img">`
        : `<div class="book-icon" style="font-size: 8rem; height: 16rem; display:flex; align-items:center; justify-content:center; background:#f8f9fa; border-radius:8px;">📚</div>`;

    plantillaHtml = plantillaHtml.replace('{{imagenHTML}}', imagenHTML);
    plantillaHtml = plantillaHtml.replace('{{botonHTML}}', botonHTML);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{autor}}', 'g'), book.author);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{ano}}', 'g'), book.publishedYear);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{paginas}}', 'g'), book.pages);
    plantillaHtml = plantillaHtml.replace('{{titulo}}', book.title);
    plantillaHtml = plantillaHtml.replace(new RegExp('{{categoria}}', 'g'), book.category);
    plantillaHtml = plantillaHtml.replace('{{ratingEstrellas}}', ratingEstrellas);
    plantillaHtml = plantillaHtml.replace('{{descripcion}}', book.description);
    plantillaHtml = plantillaHtml.replace('{{disponibilidad}}', disponibilidad);

    pages.bookPreview.innerHTML = plantillaHtml;
    
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

    showPage('bookPreview');
    document.getElementById('back-to-list-btn').addEventListener('click', renderUserPage);
}

// pagina de mis libros
async function renderMyBooksPage() {

    const myBooks = (await apiCall(`mis_libros.php?id_usuario=${currentUser.id}`)) || [];

    let plantillaHtml = await cargarVista('mis_libros');
    if (!plantillaHtml) return;

    const contador = myBooks.length;
    const pluralLibro = contador === 1 ? 'libro' : 'libros';
    const pluralS = contador === 1 ? '' : 's';

    plantillaHtml = plantillaHtml.replace('{{contador}}', contador);
    plantillaHtml = plantillaHtml.replace('{{pluralLibro}}', pluralLibro);
    plantillaHtml = plantillaHtml.replace('{{pluralS}}', pluralS);
    pages.myBooks.innerHTML = plantillaHtml;

    const gridContainer = document.getElementById('my-books-grid');
    
    if (myBooks.length === 0) {
        // vacio
        gridContainer.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center;">
                <h2>No tienes libros prestados</h2>
                <p style="color: #6c757d; margin-bottom: 1.5rem;">Comienza a explorar nuestra colección.</p>
                <button id="explore-btn" class="btn btn-primary">Explorar Libros</button>
            </div>`;
    } else {
        // con libros
        gridContainer.innerHTML = myBooks.map(book => {
            const imagenHTML = book.imagen_url 
                ? `<img src="${book.imagen_url}" alt="${book.title}" class="book-cover-img">`
                : `<div class="book-icon" style="font-size: 3rem; height: 10rem;">📚</div>`;
            
            return `
                <div class="card">
                    <div class="book-cover">${imagenHTML}</div> 
                    
                    <h3>${book.title}</h3>
                    <p class="author">de ${book.author}</p>
                    <p><strong>Prestado el:</strong> ${book.fecha_prestamo}</p>
                    <button class="btn btn-outline" style="width:100%; margin-top:1rem;" onclick="handleReturn(${book.id_prestamo})">Devolver Libro</button>
                </div>
            `;
        }).join('');
    }

    showPage('myBooks');
    document.getElementById('back-to-user-btn').addEventListener('click', renderUserPage);
    
    const exploreBtn = document.getElementById('explore-btn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => showPage('user'));
    }
}


async function renderCartPage() {

    const booksInCart = allBooks.filter(book => borrowCart.includes(book.id));

    // 2. Cargar plantilla base
    let plantillaHtml = await cargarVista('carrito');
    if (!plantillaHtml) return;

    const contador = booksInCart.length;
    const pluralLibro = contador === 1 ? 'libro' : 'libros';
    const pluralS = contador === 1 ? '' : 's';

    plantillaHtml = plantillaHtml.replace('{{contador}}', contador);
    plantillaHtml = plantillaHtml.replace('{{pluralLibro}}', pluralLibro);
    plantillaHtml = plantillaHtml.replace('{{pluralS}}', pluralS);
    pages.cart.innerHTML = plantillaHtml;

    const contentContainer = document.getElementById('cart-content-container');
    
    if (booksInCart.length === 0) {
        // Estado vacío
        contentContainer.innerHTML = `
            <div class="card" style="grid-column: 1 / -1;">
                <h2>Tu lista está vacía</h2>
                <p style="color: #6c757d; margin-bottom: 1.5rem;">Añade libros desde la página de búsqueda.</p>
                <button id="explore-btn-from-cart" class="btn btn-primary">Explorar Libros</button>
            </div>`;
        
        document.getElementById('explore-btn-from-cart').addEventListener('click', () => showPage('user'));

    } else {
        // estado con libros
        contentContainer.innerHTML = `
            <div class="card">
                <h2>Resumen de Préstamo</h2>
                <table class="admin-table">
                    <thead><tr><th>Título</th><th>Autor</th><th>Acción</th></tr></thead>
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
                
                <button id="btn-generar-qr" class="btn btn-outline" style="width: 100%; margin-top: 1.5rem;">
                    Generar QR para Mostrador
                </button>

                <button class="btn btn-primary" style="width: 100%; font-size: 1.1rem; margin-top: 0.5rem;" onclick="handleBorrowAll(event)">
                    Confirmar Préstamo Digital
                </button>
            </div>`;
            
        document.getElementById('btn-generar-qr').addEventListener('click', handleMostrarQR);
    }

showPage('cart');
    document.getElementById('back-to-user-btn-from-cart').addEventListener('click', renderUserPage);
    
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const btnDescargarQR = document.getElementById('btn-descargar-qr');
    
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', handleCerrarQR);
    }
    if (btnDescargarQR) {
        btnDescargarQR.addEventListener('click', handleDescargarQR);
    }
}

// vista administrador
async function renderAdminPage() {
    const plantillaHtml = await cargarVista('admin');
    if (!plantillaHtml) return;
    pages.admin.innerHTML = plantillaHtml;

    const [allBorrowedBooks, allInventoryBooks] = await Promise.all([
        apiCall('admin_data.php'),
        apiCall('libros.php')
    ]);

    const borrowed = allBorrowedBooks || [];
    const inventory = allInventoryBooks || [];
    const totalPrestamos = allBorrowedBooks.length;
    const usuariosActivos = [...new Set(borrowed.map(b => b.username))].length; 
    const totalInventario = inventory.length;

// estadisticas
    document.getElementById('admin-total-prestamos').innerText = totalPrestamos;
    document.getElementById('admin-usuarios-activos').innerText = usuariosActivos;
    document.getElementById('admin-total-inventario').innerText = totalInventario;

    // cargamos tabla de préstamos
    const tablaCuerpoPrestamos = document.getElementById('admin-tabla-cuerpo');
    if (borrowed.length === 0) {
        tablaCuerpoPrestamos.innerHTML = '<tr><td colspan="3">No hay préstamos aún.</td></tr>';
    } else {
        tablaCuerpoPrestamos.innerHTML = borrowed.map(book => `
            <tr>
                <td>${book.title}</td>
                <td>${book.username}</td>
                <td>${book.fecha_prestamo}</td>
            </tr>
        `).join('');
    }

    // cargamos la  tabla de gestion de inventario
    const tablaCuerpoInventario = document.getElementById('admin-tabla-inventario');
    if (inventory.length === 0){
        tablaCuerpoInventario.innerHTML = `<tr><td colspan="3">No hay libros en el inventario.</td></tr>`;
    } else {
        tablaCuerpoInventario.innerHTML = inventory.map(book => `
            <tr>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>
                    <button class="btn btn-outline" style="padding: 0.25rem 0.5rem;" onclick="handleEliminarLibro(${book.id})">
                        Eliminar
                    </button>
                </td>
            </tr>
            `).join('');
    }

    showPage('admin');
    document.getElementById('admin-logout-btn').addEventListener('click', handleLogout);
    document.getElementById('form-agregar-libro').addEventListener('submit', handleAgregarLibro);
}

// --- 4. Logica ---

/**
 * Wrapper centralizado para fetch que maneja la comunicación con la API.
 * @param {string} endpoint 
 * @param {string} [method='GET'] 
 * @param {Object} [body=null] 
 * @returns {Promise<any|null>} 
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
        const responseText = await response.text(); 

        if (!response.ok) {
            throw new Error(responseText || `Error HTTP: ${response.status}`);
        }

        if (!responseText) {
            return { success: true, message: 'Operación completada.' }; 
        }

        try {
            return JSON.parse(responseText); 
        } catch (e) {
            console.error("Error al parsear JSON:", responseText);
            throw new Error(`Respuesta inválida del servidor. El servidor dijo: ${responseText}`);
        }

    } catch (error) {
        console.error('Error en apiCall:', error.message);
        alert(`Error de comunicación con el servidor: ${error.message}`);
        return null; 
    }
}

/**
 * Añade un libro al estado borrowCart.
 * @param {number} bookId 
 */
function handleAddToCart(bookId){
    if(borrowCart.includes(bookId)){
        return; // nos ayuda a evitar los duplicados
    }
    borrowCart.push(bookId);
    alert("Libro añadido a la lista.");

    if(pages.user.style.display === 'block'){
        renderUserPage();
    }else if (pages.bookPreview.style.display === 'block'){
        renderBookPreviewPage(bookId);
    }
}


// funciones del QR
function handleMostrarQR() {
    const modal = document.getElementById('qr-modal-overlay');
    const qrContainer = document.getElementById('qr-code-container');
    

    if (!modal || !qrContainer) {
        alert("Error: No se encontró el contenedor del QR. Asegúrate de que el HTML esté en vistas/carrito.html");
        return;
    }
    
    qrContainer.innerHTML = ''; //eliminamos el codigo QR anterior

    // buscamos que datos lleva el QR
    const booksInCart = allBooks.filter(book => borrowCart.includes(book.id));
    const titulosLibros = booksInCart.map(book => `- ${book.title} (de ${book.author})`).join('\n');
    const fecha = new Date().toLocaleDateString('es-ES');
    
    const textoDelQR = `
Pedido de Biblioteca
Usuario: ${currentUser.username}
Fecha: ${fecha}
--- Libros Solicitados ---
${titulosLibros}
    `;

    //  Generar el QR
    try {
        new QRCode(qrContainer, {
            text: textoDelQR.trim(), width: 234, height: 234,
            colorDark: "#000000", colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (e) {
        console.error("Error al generar QR:", e);
        alert("No se pudo generar el código QR.");
        return;
    }

    modal.classList.add('active');
}

// funcion cerrar el QR
function handleCerrarQR() {
    const modal = document.getElementById('qr-modal-overlay');
    modal.classList.remove('active');
}

//funcion para descragar el QR
function handleDescargarQR() {
    try {
        const canvas = document.querySelector('#qr-code-container canvas');
        
        if (!canvas) {
            alert("No se pudo encontrar el QR para descargar.");
            return;
        }
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `pedido_qr_biblioteca_${currentUser.username}.png`;
        link.click();
    } catch (e) {
        console.error("Error al descargar QR:", e);
        alert("No se pudo descargar el código QR.");
    }
}

/**
 * Elimina un libro del estado borrowCart.
 * @param {number} bookId -
 */
function handleRemoveFromCart(bookId){
    const index = borrowCart.indexOf(bookId);
    if(index > -1){ //nos aseguramos que el libro existe
        borrowCart.splice(index, 1);
    }

    // volvemos a cargar la pagina para ver los cambios
    if(pages.user.style.display === 'block'){
        renderUserPage();
    } else if (pages.bookPreview.style.display === 'block'){
        renderBookPreviewPage(bookId);
    }
    else if(pages.cart.style.display === 'block'){
        renderCartPage(); 
    }
}

/**
 * Envía la lista de borrowCart a la API para procesar el préstamo múltiple.
 * @param {Event} event 
 */
async function handleBorrowAll(event) {
    if (borrowCart.length === 0){
        return;
    }

    const button = event.target;
    button.disabled = true; 
    button.innerText = 'Procesando...';

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
        button.innerText = `Confirmar Préstamo de (${borrowCart.length}) Libros`; 
    }
}


// login
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
        alert(data.error || "Credenciales incorrectas.");
    }
}

//registro
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
        document.getElementById('tab-login').click(); 
    } else {
        alert((data && data.error) || "Error en el registro.");
    }
}

//cerrar sesion- boton salir
function handleLogout() {
    currentUser = null;
    allBooks = [];
    borrowCart = [];
    renderAuthPage();
    showPage('auth');
}

/**
 * Llama a la API para devolver un libro.
 * @param {number} prestamoId 
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
        renderMyBooksPage(); 
    } else {
        alert(data.error || "No se pudo devolver el libro.");
    }
}

/**
 * Maneja el submit del formulario de Añadir Libro.
 * @param {Event} event 
 */
async function handleAgregarLibro(event) {
    event.preventDefault();

    const title = document.getElementById('reg-title').value;
    const author = document.getElementById('reg-author').value;
    const category = document.getElementById('reg-category').value;
    const description = document.getElementById('reg-description').value;
    const imagen_url = document.getElementById('reg-imagen').value;
    const publishedYear = document.getElementById('reg-year').value;
    const pages = document.getElementById('reg-pages').value;

    const data = await apiCall('agregar_libro.php', 'POST', {
        title: title,
        author: author,
        category: category,
        description: description,
        imagen_url: imagen_url,
        publishedYear: publishedYear,
        pages: pages
    });
    if (data && data.success){
        alert(data.message);
        renderAdminPage();
    } else {
        alert(data.error || "No se puso añadir el libro.");
    }
}

/**
 * Llama a la API para eliminar un libro del inventario.
 * @param {number} libroId 
 */
async function handleEliminarLibro(libroId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este libro del inventario?\nEsta acción no se puede deshacer.")) {
        return;
    }

    const data = await apiCall('eliminar_libro.php', 'POST', {
        id_libro: libroId
    });

    if (data && data.success) {
        alert(data.message);
        renderAdminPage();
    } else {
        alert(data.error || "No se pudo eliminar el libro.");
    }
}

// --- 5. INICIO DE LA APLICACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    // Iniciar siempre en la vista de autenticación.
    renderAuthPage();
    showPage('auth');
});
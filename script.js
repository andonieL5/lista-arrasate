// ==========================================
// FIREBASE APP - LISTA FAMILIAR
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    deleteDoc,
    getDocs,
    onSnapshot,
    runTransaction,
    writeBatch,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================
// CONFIGURACIÓN FIREBASE
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyCqTIkaoO62UIMZPcRpaQdbdTvE5ZXYKE8",
    authDomain: "lista-familiar-3a05d.firebaseapp.com",
    projectId: "lista-familiar-3a05d",
    storageBucket: "lista-familiar-3a05d.firebasestorage.app",
    messagingSenderId: "343672850288",
    appId: "1:343672850288:web:771de65690748505b0b1b5"
};

console.log("==========================================");
console.log("LISTA FAMILIAR");
console.log("Firebase projectId:", firebaseConfig.projectId);
console.log("Firebase appId:", firebaseConfig.appId);
console.log("==========================================");


// ==========================================
// INICIALIZAR FIREBASE
// ==========================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const proveedorGoogle =
    new GoogleAuthProvider();

const db =
    getFirestore(app);


// ==========================================
// REFERENCIAS FIRESTORE
// ==========================================

const FAMILIA_ID =
    "familia-andoni";

const listaRef =
    collection(
        db,
        "familias",
        FAMILIA_ID,
        "listaCompra"
    );


// ==========================================
// ELEMENTOS HTML
// ==========================================

const miLista =
    document.getElementById("miLista");

const loginGoogle =
    document.getElementById("loginGoogle");

const usuarioActual =
    document.getElementById("usuarioActual");

const konexioPuntua =
    document.getElementById("konexioPuntua");

const compraHecha =
    document.getElementById("compraHecha");

const modalConfirmacion =
    document.getElementById("confirmModal");

const modalBai =
    document.getElementById("modalBai");

const modalEz =
    document.getElementById("modalEz");

const zerrendaHutsa =
    document.getElementById("zerrendaHutsa");

const produktuKopurua =
    document.getElementById("produktuKopurua");


// ==========================================
// ESTADO LOCAL
// ==========================================

const listaCompra = {};

let unsubscribeLista = null;


// Evita que un mismo botón de check
// reciba dos acciones simultáneas.
const checksGuardando = new Set();


// ==========================================
// UTILIDADES
// ==========================================

function esProductoPorGramos(producto) {

    return producto === "Haragi xehatua";
}


// ==========================================
// CREAR ID SEGURO PARA FIRESTORE
// ==========================================

function convertirId(producto) {

    return producto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


// ==========================================
// REFERENCIA DE PRODUCTO
// ==========================================

function productoRef(producto) {

    return doc(
        db,
        "familias",
        FAMILIA_ID,
        "listaCompra",
        convertirId(producto)
    );
}


// ==========================================
// CATEGORÍAS / PRODUCTOS
// ==========================================

document.addEventListener(
    "click",
    function (evento) {

        // --------------------------------------
        // CATEGORÍA
        // --------------------------------------

        const categoria =
            evento.target.closest(
                ".kategoria-btn"
            );

        if (categoria) {

            categoria.parentElement.classList.toggle(
                "zabalik"
            );

            return;
        }


        // --------------------------------------
        // SUBCATEGORÍA
        // --------------------------------------

        const subcategoria =
            evento.target.closest(
                ".azpikategoria-btn"
            );

        if (subcategoria) {

            subcategoria.parentElement.classList.toggle(
                "zabalik"
            );

            return;
        }


        // --------------------------------------
        // AÑADIR PRODUCTO
        // --------------------------------------

        const botonProducto =
            evento.target.closest(
                ".anadir, .anadir-gramos"
            );

        if (!botonProducto) {
            return;
        }


        const producto =
            botonProducto.dataset.producto;

        const emoji =
            botonProducto.dataset.emoji;


        if (!producto || !emoji) {

            console.error(
                "Producto sin datos:",
                botonProducto
            );

            return;
        }


        console.log(
            "Añadiendo producto:",
            producto
        );


        añadirProducto(
            producto,
            emoji
        );
    }
);


// ==========================================
// AÑADIR PRODUCTO
// ==========================================

async function añadirProducto(
    producto,
    emoji
) {

    const referencia =
        productoRef(producto);


    try {

        await runTransaction(
            db,
            async function (transaction) {

                const documento =
                    await transaction.get(
                        referencia
                    );


                // ----------------------------------
                // PRODUCTO NUEVO
                // ----------------------------------

                if (!documento.exists()) {

                    const esGramos =
                        esProductoPorGramos(
                            producto
                        );


                    transaction.set(
                        referencia,
                        {
                            nombre: producto,

                            emoji: emoji,

                            cantidad:
                                esGramos
                                    ? 250
                                    : 1,

                            unidad:
                                esGramos
                                    ? "g"
                                    : "unidad",

                            checked: false
                        }
                    );


                    return;
                }


                // ----------------------------------
                // PRODUCTO YA EXISTENTE
                // ----------------------------------

                const datos =
                    documento.data();


                const esGramos =
                    esProductoPorGramos(
                        producto
                    )
                    ||
                    datos.unidad === "g";


                const incremento =
                    esGramos
                        ? 250
                        : 1;


                let cantidadActual =
                    Number(
                        datos.cantidad
                    ) || 0;


                if (
                    esGramos
                    &&
                    datos.unidad !== "g"
                ) {

                    cantidadActual = 0;
                }


                // ----------------------------------
                // MUY IMPORTANTE
                //
                // SOLO modificamos cantidad/unidad.
                //
                // NO escribimos checked.
                //
                // Por tanto:
                // checked queda exactamente como estaba
                // en Firebase.
                // ----------------------------------

                transaction.update(
                    referencia,
                    {
                        cantidad:
                            cantidadActual +
                            incremento,

                        unidad:
                            esGramos
                                ? "g"
                                : (
                                    datos.unidad ||
                                    "unidad"
                                )
                    }
                );
            }
        );


        console.log(
            "Producto añadido correctamente:",
            producto
        );


    } catch (error) {

        console.error(
            "ERROR AL AÑADIR PRODUCTO:",
            producto
        );

        console.error(
            "Código:",
            error.code
        );

        console.error(
            "Mensaje:",
            error.message
        );

        console.error(error);
    }
}


// ==========================================
// CAMBIAR CANTIDAD
// ==========================================

async function cambiarCantidad(
    producto,
    cambio
) {

    const referencia =
        productoRef(producto);


    try {

        await runTransaction(
            db,
            async function (transaction) {

                const documento =
                    await transaction.get(
                        referencia
                    );


                if (!documento.exists()) {
                    return;
                }


                const datos =
                    documento.data();


                const esGramos =
                    esProductoPorGramos(
                        producto
                    )
                    ||
                    datos.unidad === "g";


                const incremento =
                    esGramos
                        ? 250
                        : 1;


                let cantidadActual =
                    Number(
                        datos.cantidad
                    ) || 0;


                if (
                    esGramos
                    &&
                    datos.unidad !== "g"
                ) {

                    cantidadActual = 250;
                }


                const nuevaCantidad =
                    cantidadActual +
                    incremento * cambio;


                // ----------------------------------
                // SI LLEGA A 0
                // ----------------------------------

                if (nuevaCantidad <= 0) {

                    transaction.delete(
                        referencia
                    );

                    return;
                }


                // ----------------------------------
                // CAMBIAR CANTIDAD
                //
                // NO TOCAMOS checked.
                // ----------------------------------

                transaction.update(
                    referencia,
                    {
                        cantidad:
                            nuevaCantidad,

                        unidad:
                            esGramos
                                ? "g"
                                : (
                                    datos.unidad ||
                                    "unidad"
                                )
                    }
                );
            }
        );


    } catch (error) {

        console.error(
            "Error cambiando cantidad:",
            error
        );
    }
}


// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

async function eliminarProducto(
    producto
) {

    try {

        await deleteDoc(
            productoRef(producto)
        );


    } catch (error) {

        console.error(
            "Error eliminando producto:",
            error
        );
    }
}


// ==========================================
// CAMBIAR CHECK
// ==========================================
//
// ESTA ES LA PARTE NUEVA IMPORTANTE.
//
// No utilizamos runTransaction para el check.
// Utilizamos updateDoc().
//
// Además:
//
// 1. Actualizamos inmediatamente la interfaz.
// 2. Actualizamos listaCompra local.
// 3. Guardamos el valor exacto en Firebase.
// 4. Evitamos doble toque.
// 5. Si falla Firebase hacemos rollback.
//

async function cambiarCheck(
    producto,
    fila,
    botonCheck
) {

    const nombre =
        producto.nombre;


    const id =
        convertirId(nombre);


    // --------------------------------------
    // EVITAR DOBLE CLICK / DOBLE TOQUE
    // --------------------------------------

    if (checksGuardando.has(id)) {

        console.log(
            "Check ya se está guardando:",
            nombre
        );

        return;
    }


    checksGuardando.add(id);


    // --------------------------------------
    // ESTADO ANTERIOR
    // --------------------------------------

    const estadoAnterior =
        producto.checked === true;


    // --------------------------------------
    // NUEVO ESTADO
    // --------------------------------------

    const nuevoEstado =
        !estadoAnterior;


    // --------------------------------------
    // ACTUALIZACIÓN LOCAL INMEDIATA
    // --------------------------------------

    producto.checked =
        nuevoEstado;


    // --------------------------------------
    // ACTUALIZAR INTERFAZ INMEDIATAMENTE
    // --------------------------------------

    if (nuevoEstado) {

        fila.classList.add(
            "eginda"
        );

    } else {

        fila.classList.remove(
            "eginda"
        );
    }


    // --------------------------------------
    // PROTEGER BOTÓN
    // --------------------------------------

    botonCheck.disabled =
        true;


    botonCheck.dataset.guardando =
        "true";


    try {

        const referencia =
            productoRef(nombre);


        console.log(
            "Guardando check en Firebase:",
            nombre,
            "=>",
            nuevoEstado
        );


        // ----------------------------------
        // ESCRITURA DIRECTA
        // ----------------------------------

        await updateDoc(
            referencia,
            {
                checked:
                    nuevoEstado
            }
        );


        console.log(
            "✓ Check guardado correctamente:",
            nombre,
            nuevoEstado
        );


    } catch (error) {

        console.error(
            "=========================================="
        );

        console.error(
            "ERROR GUARDANDO CHECK"
        );

        console.error(
            "Producto:",
            nombre
        );

        console.error(
            "Código:",
            error.code
        );

        console.error(
            "Mensaje:",
            error.message
        );

        console.error(
            error
        );

        console.error(
            "=========================================="
        );


        // ----------------------------------
        // ROLLBACK
        // ----------------------------------

        producto.checked =
            estadoAnterior;


        if (estadoAnterior) {

            fila.classList.add(
                "eginda"
            );

        } else {

            fila.classList.remove(
                "eginda"
            );
        }


        // ----------------------------------
        // MENSAJE
        // ----------------------------------

        console.warn(
            "El check no se pudo guardar en Firebase."
        );


    } finally {

        checksGuardando.delete(
            id
        );


        botonCheck.disabled =
            false;


        delete botonCheck.dataset.guardando;
    }
}


// ==========================================
// ORDEN DE SECCIONES
// ==========================================

const ordenSecciones = {

    "DESPENTSA": 1,

    "ESNEKIAK": 2,

    "FRUTAK ETA BARAZKIAK": 3,

    "HARAGIA ETA ARRAINA": 4,

    "IZOZTUA": 5,

    "EDARIAK": 6,

    "GARBIKETA": 7,

    "BESTELAKOAK": 99
};


// ==========================================
// CLASIFICACIÓN
// ==========================================

function obtenerSeccion(
    producto
) {

    const nombre =
        producto.toLowerCase();


    // --------------------------------------
    // DESPENTSA
    // --------------------------------------

    const despentsa = [

        "espagetiak",
        "makarroiak",
        "fideoak",
        "tallarinak",
        "maria doradas",
        "principe",
        "tostatuak",
        "chiquilin",
        "lentejak",
        "garbantzuak",
        "babarrunak",
        "atuna",
        "olibak",
        "piperrak",
        "esparragoak",
        "tomate birrindua",
        "oliba-olioa",
        "ekilore-olioa",
        "mahats-ozpina",
        "arroza",
        "arrautzak",
        "nesquik",
        "colacao"
    ];


    if (
        despentsa.some(
            item =>
                nombre.includes(item)
        )
    ) {

        return "DESPENTSA";
    }


    // --------------------------------------
    // ESNEKIAK
    // --------------------------------------

    const esnekiak = [

        "esne osoa",
        "esne erdigaingabetua",
        "jogurta",
        "gazta",
        "gurina",
        "esnegaina",
        "flana",
        "natillak"
    ];


    if (
        esnekiak.some(
            item =>
                nombre.includes(item)
        )
    ) {

        return "ESNEKIAK";
    }


    // --------------------------------------
    // FRUTAK ETA BARAZKIAK
    // --------------------------------------

    const frutakBarazkiak = [

        "sagarrak",
        "platanoak",
        "laranjak",
        "mandarinak",
        "udareak",
        "marrubiak",
        "mahatsak",
        "melokotoiak",
        "kiwia",
        "anana",
        "sandia",
        "meloia",
        "limoiak",
        "tomateak",
        "aguakateak",
        "letxuga",
        "azenarioak",
        "patatak",
        "tipulak",
        "baratxuria",
        "piperrak frescoa",
        "kalabazina",
        "pepinoa",
        "brokolia",
        "azalorea",
        "espinakak",
        "perretxikoak",
        "berenjena",
        "porruak"
    ];


    if (
        frutakBarazkiak.some(
            item =>
                nombre.includes(item)
        )
    ) {

        return "FRUTAK ETA BARAZKIAK";
    }


    // --------------------------------------
    // HARAGIA ETA ARRAINA
    // --------------------------------------

    const haragiaArraina = [

        "oilasko",
        "behi-",
        "haragi xehatua",
        "txerri-",
        "solomoa",
        "hirugiharra",
        "izokina",
        "legatza",
        "bakailaoa",
        "atuna freskoa",
        "sardina",
        "antxoak"
    ];


    if (
        haragiaArraina.some(
            item =>
                nombre.includes(item)
        )
    ) {

        return "HARAGIA ETA ARRAINA";
    }


    // --------------------------------------
    // IZOTZTUA
    // --------------------------------------

    const izoztuak = [

        "sandwich",
        "magnum",
        "pizza"
    ];


    if (
        izoztuak.some(
            item =>
                nombre.includes(item)
        )
    ) {

        return "IZOZTUA";
    }


    // --------------------------------------
    // EDARIAK
    // --------------------------------------

    const edariak = [

        "coca-cola",
        "fanta",
        "sprite",
        "aquarius",
        "nestea",
        "kafea",
        "tea",
        "ura",
        "zukua"
    ];


    if (
        edariak.some(
            item =>
                nombre.includes(item)
        )
    ) {

        return "EDARIAK";
    }


    // --------------------------------------
    // GARBIKETA
    // --------------------------------------

    const garbiketa = [

        "garbigarria",
        "oihal-leungarria",
        "orban-kentzailea",
        "ontzi-garbigarria",
        "ontzi-garbigailurako",
        "koipe-kentzailea",
        "sukaldeko papera",
        "esponjak",
        "komun-garbigarria",
        "bainugelako",
        "lixiba",
        "garbitzaile",
        "beira-garbigarria",
        "zabor-poltsak",
        "komuneko papera"
    ];


    if (
        garbiketa.some(
            item =>
                nombre.includes(item)
        )
    ) {

        return "GARBIKETA";
    }


    return "BESTELAKOAK";
}


// ==========================================
// MOSTRAR LISTA
// ==========================================

function mostrarLista() {

    miLista.innerHTML = "";


    const productos =
        Object.values(
            listaCompra
        );


    // --------------------------------------
    // CONTADOR
    // --------------------------------------

    if (produktuKopurua) {

        produktuKopurua.textContent =
            productos.length;
    }


    // --------------------------------------
    // LISTA VACÍA
    // --------------------------------------

    if (productos.length === 0) {

        zerrendaHutsa.style.display =
            "block";

        return;
    }


    zerrendaHutsa.style.display =
        "none";


    // --------------------------------------
    // AGRUPAR
    // --------------------------------------

    const grupos = {};


    productos.forEach(
        function (producto) {

            const seccion =
                obtenerSeccion(
                    producto.nombre
                );


            if (!grupos[seccion]) {

                grupos[seccion] = [];
            }


            grupos[seccion].push(
                producto
            );
        }
    );


    // --------------------------------------
    // MOSTRAR SECCIONES
    // --------------------------------------

    Object.keys(grupos)
        .sort(
            function (a, b) {

                return (
                    ordenSecciones[a] || 99
                )
                -
                (
                    ordenSecciones[b] || 99
                );
            }
        )
        .forEach(
            function (seccion) {


                const seccionElemento =
                    document.createElement(
                        "div"
                    );


                seccionElemento.className =
                    "lista-sekzioa";


                // ----------------------------------
                // TÍTULO
                // ----------------------------------

                const titulo =
                    document.createElement(
                        "div"
                    );


                titulo.className =
                    "lista-sekzioa-tituloa";


                titulo.textContent =
                    seccion;


                seccionElemento.appendChild(
                    titulo
                );


                // ----------------------------------
                // PRODUCTOS
                // ----------------------------------

                grupos[seccion].forEach(
                    function (producto) {


                        const fila =
                            document.createElement(
                                "div"
                            );


                        fila.className =
                            "lista-produktua";


                        // ==================================
                        // CHECK
                        // ==================================

                        const check =
                            document.createElement(
                                "button"
                            );


                        check.className =
                            "lista-check";


                        check.type =
                            "button";


                        check.textContent =
                            "✓";


                        // ----------------------------------
                        // ESTADO INICIAL
                        // ----------------------------------

                        if (
                            producto.checked === true
                        ) {

                            fila.classList.add(
                                "eginda"
                            );
                        }


                        // ----------------------------------
                        // CHECK
                        // ----------------------------------
                        //
                        // Importante:
                        //
                        // NO usamos aquí un listener
                        // que dependa del DOM anterior.
                        //
                        // El listener queda asociado
                        // directamente al botón actual.
                        // ----------------------------------

                        check.addEventListener(
                            "click",
                            function (evento) {

                                evento.preventDefault();

                                evento.stopPropagation();


                                cambiarCheck(
                                    producto,
                                    fila,
                                    check
                                );
                            }
                        );


                        // También evitamos que ciertos
                        // móviles interpreten una pulsación
                        // larga como otra acción.

                        check.addEventListener(
                            "touchstart",
                            function (evento) {

                                evento.stopPropagation();
                            },
                            {
                                passive: true
                            }
                        );


                        // ==================================
                        // EMOJI
                        // ==================================

                        const emoji =
                            document.createElement(
                                "span"
                            );


                        emoji.className =
                            "lista-emoji";


                        emoji.textContent =
                            producto.emoji;


                        // ==================================
                        // INFO
                        // ==================================

                        const info =
                            document.createElement(
                                "div"
                            );


                        info.className =
                            "lista-info";


                        const nombre =
                            document.createElement(
                                "span"
                            );


                        nombre.className =
                            "lista-izena";


                        nombre.textContent =
                            producto.nombre;


                        info.appendChild(
                            nombre
                        );


                        // ==================================
                        // MENOS
                        // ==================================

                        const menos =
                            document.createElement(
                                "button"
                            );


                        menos.className =
                            "lista-kontrola";


                        menos.type =
                            "button";


                        menos.textContent =
                            "−";


                        menos.addEventListener(
                            "click",
                            function (evento) {

                                evento.preventDefault();

                                evento.stopPropagation();


                                cambiarCantidad(
                                    producto.nombre,
                                    -1
                                );
                            }
                        );


                        // ==================================
                        // CANTIDAD
                        // ==================================

                        const cantidad =
                            document.createElement(
                                "span"
                            );


                        cantidad.className =
                            "lista-kantitatea";


                        if (
                            esProductoPorGramos(
                                producto.nombre
                            )
                            ||
                            producto.unidad === "g"
                        ) {

                            cantidad.textContent =
                                producto.cantidad +
                                " g";

                        } else {

                            cantidad.textContent =
                                producto.cantidad;
                        }


                        // ==================================
                        // MÁS
                        // ==================================

                        const mas =
                            document.createElement(
                                "button"
                            );


                        mas.className =
                            "lista-kontrola";


                        mas.type =
                            "button";


                        mas.textContent =
                            "+";


                        mas.addEventListener(
                            "click",
                            function (evento) {

                                evento.preventDefault();

                                evento.stopPropagation();


                                cambiarCantidad(
                                    producto.nombre,
                                    1
                                );
                            }
                        );


                        // ==================================
                        // ELIMINAR
                        // ==================================

                        const eliminar =
                            document.createElement(
                                "button"
                            );


                        eliminar.className =
                            "lista-ezabatu";


                        eliminar.type =
                            "button";


                        eliminar.textContent =
                            "Ezabatu";


                        eliminar.addEventListener(
                            "click",
                            function (evento) {

                                evento.preventDefault();

                                evento.stopPropagation();


                                eliminarProducto(
                                    producto.nombre
                                );
                            }
                        );


                        // ==================================
                        // CONSTRUIR FILA
                        // ==================================

                        fila.appendChild(
                            check
                        );

                        fila.appendChild(
                            emoji
                        );

                        fila.appendChild(
                            info
                        );

                        fila.appendChild(
                            menos
                        );

                        fila.appendChild(
                            cantidad
                        );

                        fila.appendChild(
                            mas
                        );

                        fila.appendChild(
                            eliminar
                        );


                        seccionElemento.appendChild(
                            fila
                        );
                    }
                );


                miLista.appendChild(
                    seccionElemento
                );
            }
        );
}


// ==========================================
// FIRESTORE EN TIEMPO REAL
// ==========================================

function iniciarListenerFirestore() {

    // --------------------------------------
    // CANCELAR LISTENER ANTERIOR
    // --------------------------------------

    if (unsubscribeLista) {

        unsubscribeLista();

        unsubscribeLista = null;
    }


    console.log(
        "Iniciando listener Firestore..."
    );


    unsubscribeLista =
        onSnapshot(

            listaRef,

            function (snapshot) {

                console.log(
                    "Firestore actualizado. Productos:",
                    snapshot.size
                );


                // ----------------------------------
                // CREAR NUEVO ESTADO
                // ----------------------------------

                const nuevoEstado = {};


                snapshot.forEach(
                    function (documento) {

                        const datos =
                            documento.data();


                        const nombre =
                            datos.nombre;


                        if (!nombre) {
                            return;
                        }


                        // ----------------------------------
                        // CHECK
                        // ----------------------------------
                        //
                        // Si Firebase tiene:
                        //
                        // checked: true
                        //
                        // guardamos true.
                        //
                        // Si no existe o es false:
                        //
                        // false.
                        // ----------------------------------

                        const checked =
                            datos.checked === true;


                        nuevoEstado[
                            documento.id
                        ] = {

                            nombre:
                                nombre,

                            emoji:
                                datos.emoji || "🛒",

                            cantidad:
                                Number(
                                    datos.cantidad
                                ) || 1,

                            unidad:
                                datos.unidad
                                ||
                                (
                                    esProductoPorGramos(
                                        nombre
                                    )
                                        ? "g"
                                        : "unidad"
                                ),

                            checked:
                                checked
                        };
                    }
                );


                // ----------------------------------
                // REEMPLAZAR ESTADO LOCAL
                // ----------------------------------

                Object.keys(
                    listaCompra
                ).forEach(
                    function (key) {

                        delete listaCompra[key];
                    }
                );


                Object.assign(
                    listaCompra,
                    nuevoEstado
                );


                // ----------------------------------
                // DIBUJAR
                // ----------------------------------

                mostrarLista();
            },


            function (error) {

                console.error(
                    "=========================================="
                );

                console.error(
                    "ERROR FIRESTORE LISTENER"
                );

                console.error(
                    "Código:",
                    error.code
                );

                console.error(
                    "Mensaje:",
                    error.message
                );

                console.error(
                    error
                );

                console.error(
                    "=========================================="
                );
            }
        );
}


// ==========================================
// GOOGLE LOGIN
// ==========================================

loginGoogle.addEventListener(
    "click",
    async function () {

        try {

            loginGoogle.disabled =
                true;


            loginGoogle.textContent =
                "Saioa hasten...";


            const resultado =
                await signInWithPopup(
                    auth,
                    proveedorGoogle
                );


            console.log(
                "Google bidez saioa hasita:",
                resultado.user.email
            );


        } catch (error) {

            console.error(
                "Errorea saioa hastean:",
                error
            );


            loginGoogle.disabled =
                false;


            loginGoogle.textContent =
                "Google-rekin sartu";
        }
    }
);


// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(
    auth,
    function (usuario) {

        // --------------------------------------
        // USUARIO CONECTADO
        // --------------------------------------

        if (usuario) {

            console.log(
                "Usuario autenticado:",
                usuario.email
            );


            console.log(
                "ID del usuario:",
                usuario.uid
            );


            usuarioActual.textContent =
                "Konektatuta: " +
                usuario.email;


            usuarioActual.classList.add(
                "konektatuta"
            );


            konexioPuntua.classList.add(
                "konektatuta"
            );


            loginGoogle.textContent =
                "Saioa hasita ✓";


            loginGoogle.disabled =
                true;


            iniciarListenerFirestore();


            return;
        }


        // --------------------------------------
        // SIN USUARIO
        // --------------------------------------

        console.log(
            "No hay usuario conectado"
        );


        usuarioActual.textContent =
            "Ez duzu saiorik hasi";


        usuarioActual.classList.remove(
            "konektatuta"
        );


        konexioPuntua.classList.remove(
            "konektatuta"
        );


        loginGoogle.textContent =
            "Google-rekin sartu";


        loginGoogle.disabled =
            false;


        // --------------------------------------
        // PARAR LISTENER
        // --------------------------------------

        if (unsubscribeLista) {

            unsubscribeLista();

            unsubscribeLista = null;
        }


        // --------------------------------------
        // LIMPIAR LISTA LOCAL
        // --------------------------------------

        Object.keys(
            listaCompra
        ).forEach(
            function (key) {

                delete listaCompra[key];
            }
        );


        mostrarLista();
    }
);


// ==========================================
// EROSKETA EGINDA
// ==========================================

compraHecha.addEventListener(
    "click",
    function () {

        if (
            Object.keys(
                listaCompra
            ).length === 0
        ) {

            return;
        }


        modalConfirmacion.classList.add(
            "zabalik"
        );
    }
);


// ==========================================
// MODAL EZ
// ==========================================

modalEz.addEventListener(
    "click",
    function () {

        modalConfirmacion.classList.remove(
            "zabalik"
        );
    }
);


// ==========================================
// MODAL BAI
// ==========================================

modalBai.addEventListener(
    "click",
    async function () {

        try {

            modalBai.disabled =
                true;


            modalBai.textContent =
                "Ezabatzen...";


            const snapshot =
                await getDocs(
                    listaRef
                );


            const batch =
                writeBatch(db);


            snapshot.forEach(
                function (documento) {

                    batch.delete(
                        documento.ref
                    );
                }
            );


            await batch.commit();


            modalConfirmacion.classList.remove(
                "zabalik"
            );


        } catch (error) {

            console.error(
                "Errorea zerrenda ezabatzean:",
                error
            );


        } finally {

            modalBai.disabled =
                false;


            modalBai.textContent =
                "Bai, ezabatu";
        }
    }
);


// ==========================================
// CERRAR MODAL FUERA
// ==========================================

modalConfirmacion.addEventListener(
    "click",
    function (evento) {

        if (
            evento.target ===
            modalConfirmacion
        ) {

            modalConfirmacion.classList.remove(
                "zabalik"
            );
        }
    }
);


// ==========================================
// ESC
// ==========================================

document.addEventListener(
    "keydown",
    function (evento) {

        if (
            evento.key === "Escape"
        ) {

            modalConfirmacion.classList.remove(
                "zabalik"
            );
        }
    }
);


// ==========================================
// DEBUG
// ==========================================

console.log(
    "Lista Familiar JS cargado correctamente."
);

console.log(
    "Sistema de checks Firebase: ACTIVO"
);

console.log(
    "Sistema anti doble toque móvil: ACTIVO"
);

console.log(
    "Preservación de checked al añadir productos: ACTIVA"
);

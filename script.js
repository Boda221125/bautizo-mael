'use strict';

const TIEMPO_LIMITE_SOLICITUD = 25_000;
const evento = window.EVENTO;
const fechaEvento = new Date(evento.fecha);

function mostrarDatosEvento() {
    const formatoFecha = new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Mexico_City',
    });

    document.getElementById('fechaTexto').textContent = formatoFecha.format(fechaEvento);

    for (const grupo of ['padres', 'padrinos']) {
        const contenedor = document.getElementById(grupo);

        for (const nombre of evento[grupo]) {
            const parrafo = document.createElement('p');
            parrafo.textContent = nombre;
            contenedor.append(parrafo);
        }
    }

    for (const tipo of ['ceremonia', 'recepcion']) {
        const seccion = document.getElementById(tipo);
        const lugar = evento[tipo];

        seccion.querySelector('.lugar-nombre').textContent = lugar.nombre;
        seccion.querySelector('.direccion').textContent = lugar.direccion;

        configurarUbicacion(seccion, lugar);
    }
}


function configurarUbicacion(seccion, lugar) {
    const enlace = seccion.querySelector('.mapa');
    const pendiente = seccion.querySelector('.mapa-pendiente');
    const ayuda = seccion.querySelector('.mapa-ayuda');
    const icono = seccion.querySelector('.lugar-icono');
    let destino = /^https:\/\//i.test(lugar.mapa) ? lugar.mapa : '';

    // Si no hay enlace, una dirección real permite abrir la búsqueda de Maps.
    const direccionConfirmada = lugar.direccion.trim()
        && !/próximamente|por confirmar/i.test(lugar.direccion);

    if (!destino && direccionConfirmada) {
        const consulta = `${lugar.nombre} ${lugar.direccion}`.trim();
        destino = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
    }

    if (!destino) return;

    enlace.href = destino;
    enlace.hidden = false;
    pendiente.hidden = true;
    ayuda.textContent = 'Toca el icono o el botón para consultar la ubicación en Google Maps.';

    const enlaceIcono = document.createElement('a');
    enlaceIcono.href = destino;
    enlaceIcono.target = '_blank';
    enlaceIcono.rel = 'noopener noreferrer';
    enlaceIcono.className = 'enlace-icono';
    enlaceIcono.setAttribute('aria-label', `Ver ubicación de ${lugar.nombre} en Google Maps`);
    icono.replaceWith(enlaceIcono);
    enlaceIcono.append(icono);
}

function mostrarCalendario() {
    // La fecha se calcula en México, aunque el invitado esté en otro huso horario.
    const partes = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        timeZone: 'America/Mexico_City',
    }).formatToParts(fechaEvento);
    const valores = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
    const anio = Number(valores.year);
    const mes = Number(valores.month) - 1;
    const diaEvento = Number(valores.day);
    const primerDia = new Date(Date.UTC(anio, mes, 1)).getUTCDay();
    const diasDelMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    const inicio = (primerDia + 6) % 7; // La semana comienza en lunes.

    const tabla = document.createElement('table');
    const titulo = document.createElement('caption');
    titulo.textContent = new Intl.DateTimeFormat('es-MX', {
        month: 'long', year: 'numeric', timeZone: 'America/Mexico_City',
    }).format(fechaEvento);
    tabla.append(titulo);

    const encabezado = tabla.createTHead().insertRow();
    for (const [abreviatura, nombre] of [
        ['L', 'Lunes'], ['M', 'Martes'], ['M', 'Miércoles'],
        ['J', 'Jueves'], ['V', 'Viernes'], ['S', 'Sábado'], ['D', 'Domingo'],
    ]) {
        const celda = document.createElement('th');
        celda.scope = 'col';
        celda.textContent = abreviatura;
        celda.setAttribute('aria-label', nombre);
        encabezado.append(celda);
    }

    const cuerpo = tabla.createTBody();
    const cantidadCeldas = Math.ceil((inicio + diasDelMes) / 7) * 7;
    let fila;

    for (let posicion = 0; posicion < cantidadCeldas; posicion++) {
        if (posicion % 7 === 0) fila = cuerpo.insertRow();
        const celda = fila.insertCell();
        const dia = posicion - inicio + 1;
        if (dia < 1 || dia > diasDelMes) continue;

        const numero = document.createElement('span');
        numero.textContent = dia;
        celda.append(numero);

        if (dia === diaEvento) {
            celda.className = 'dia-celebracion';
            celda.setAttribute('aria-label', `${dia} de ${titulo.textContent}: bautizo de Mael`);
        }
    }

    document.getElementById('calendarioEvento').replaceChildren(tabla);
}

function cargarFoto(imagen, ruta) {
    if (!ruta) return;

    // El espacio decorativo permanece visible hasta que la foto se haya cargado.
    imagen.addEventListener('load', () => {
        imagen.hidden = false;
        imagen.parentElement.querySelector('span').hidden = true;
    });

    imagen.addEventListener('error', () => {
        imagen.hidden = true;
    });

    imagen.src = ruta;
}

function mostrarGaleria() {
    const galeria = document.getElementById('fotos');
    cargarFoto(document.getElementById('fotoPrincipal'), evento.fotoPrincipal);

    evento.fotos.forEach((ruta, indice) => {
        const espacio = document.createElement('div');
        espacio.className = 'photo-slot';

        const texto = document.createElement('span');
        texto.textContent = 'Un recuerdo de Mael';

        const imagen = document.createElement('img');
        imagen.alt = `Fotografía de Mael ${indice + 1}`;
        imagen.loading = 'eager';
        imagen.hidden = true;

        espacio.append(texto, imagen);
        galeria.append(espacio);
        cargarFoto(imagen, ruta);
    });
}

function actualizarContador() {
    const restante = Math.max(0, fechaEvento.getTime() - Date.now());
    const unidades = {
        dias: Math.floor(restante / 86_400_000),
        horas: Math.floor(restante / 3_600_000) % 24,
        minutos: Math.floor(restante / 60_000) % 60,
        segundos: Math.floor(restante / 1_000) % 60,
    };

    for (const [id, valor] of Object.entries(unidades)) {
        document.getElementById(id).textContent = String(valor).padStart(2, '0');
    }

    document.getElementById('contadorEstado').textContent = restante === 0
        ? '¡Llegó el día de celebrar!'
        : '';
}

async function solicitarDatos(url, opciones = {}) {
    const respuesta = await fetch(url, {
        ...opciones,
        signal: AbortSignal.timeout(TIEMPO_LIMITE_SOLICITUD),
    });

    let datos;

    try {
        datos = await respuesta.json();
    } catch {
        throw new Error('El servidor no pudo responder. Intenta de nuevo más tarde.');
    }

    if (!respuesta.ok || !datos.success) {
        throw new Error(datos.message || 'No se pudo completar la solicitud.');
    }

    return datos;
}

function mensajeDeError(error) {
    // Una solicitud que tarda puede haberse guardado aunque no llegue su respuesta.
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        return 'La respuesta está tardando. Antes de volver a enviar, verifica si tu registro se guardó.';
    }

    if (error instanceof TypeError) {
        return 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.';
    }

    return error.message;
}

function mostrarEstadoFormulario(formulario, mensaje, tipo = '') {
    const estado = formulario.querySelector('.form-status');
    estado.className = ['form-status', tipo].filter(Boolean).join(' ');
    estado.textContent = mensaje;
}

function conectarFormulario(id, alGuardar) {
    const formulario = document.getElementById(id);
    const boton = formulario.querySelector('button');
    let enviando = false;

    formulario.addEventListener('submit', async (eventoSubmit) => {
        eventoSubmit.preventDefault();

        if (enviando || !formulario.reportValidity()) return;

        enviando = true;
        boton.disabled = true;
        mostrarEstadoFormulario(formulario, 'Guardando…');

        try {
            const datos = await solicitarDatos(formulario.action, {
                method: 'POST',
                body: new FormData(formulario),
            });

            mostrarEstadoFormulario(formulario, datos.message, 'success');
            formulario.reset();

            if (alGuardar) await alGuardar();
        } catch (error) {
            mostrarEstadoFormulario(formulario, mensajeDeError(error), 'error');
        } finally {
            enviando = false;
            boton.disabled = false;
        }
    });
}

function crearTarjetaRecuerdo(recuerdo) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'recuerdo';

    const nombre = document.createElement('h3');
    nombre.textContent = recuerdo.nombre;

    const relacion = document.createElement('small');
    relacion.textContent = recuerdo.parentesco || 'Con cariño';

    const mensaje = document.createElement('p');
    // Los mensajes son texto del invitado; nunca se interpretan como HTML.
    mensaje.textContent = recuerdo.mensaje;

    tarjeta.append(nombre, relacion, mensaje);
    return tarjeta;
}

async function cargarRecuerdos() {
    const estado = document.getElementById('recuerdosEstado');
    const reintentar = document.getElementById('reintentarRecuerdos');
    reintentar.hidden = true;

    try {
        const datos = await solicitarDatos('php/obtener_recuerdos.php');
        const tarjetas = datos.recuerdos.map(crearTarjetaRecuerdo);

        document.getElementById('timelineContainer').replaceChildren(...tarjetas);
        estado.textContent = tarjetas.length
            ? ''
            : 'Sé el primero en dejar unas palabras para Mael.';
    } catch {
        estado.textContent = 'No pudimos cargar los recuerdos. Puedes volver a intentarlo.';
        reintentar.hidden = false;
    }
}

function configurarNavegacion() {
    const boton = document.getElementById('btnTop');

    window.addEventListener('scroll', () => {
        boton.hidden = window.scrollY < 500;
    }, { passive: true });

    boton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function configurarAnimaciones() {
    if (!('IntersectionObserver' in window)) return;

    const observador = new IntersectionObserver((entradas) => {
        for (const entrada of entradas) {
            if (!entrada.isIntersecting) continue;

            entrada.target.classList.add('animated');
            observador.unobserve(entrada.target);
        }
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((elemento) => {
        observador.observe(elemento);
    });
}

function configurarMusica() {
    if (!evento.musica) return;

    const audio = document.getElementById('musica');
    const boton = document.getElementById('musicBtn');
    const estado = document.getElementById('musicEstado');

    audio.src = evento.musica;
    boton.hidden = false;

    boton.addEventListener('click', async () => {
        try {
            if (audio.paused) {
                await audio.play();
                boton.textContent = 'Ⅱ';
                boton.setAttribute('aria-label', 'Pausar música');
            } else {
                audio.pause();
                boton.textContent = '♫';
                boton.setAttribute('aria-label', 'Reproducir música');
            }

            estado.textContent = '';
        } catch {
            estado.textContent = 'La música todavía no está disponible.';
        }
    });
}

function iniciarInvitacion() {
    mostrarDatosEvento();
    mostrarGaleria();
    mostrarCalendario();
    actualizarContador();
    setInterval(actualizarContador, 1_000);

    // GitHub Pages aloja esta vista de diseño; los envíos requieren el servidor PHP.
    for (const id of ['rsvpForm', 'mensajeForm']) {
        const formulario = document.getElementById(id);
        formulario.addEventListener('submit', evento => evento.preventDefault());
        for (const campo of formulario.elements) campo.disabled = true;
        mostrarEstadoFormulario(formulario, 'Disponible próximamente en la invitación final.');
    }
    document.getElementById('recuerdosEstado').textContent = 'Los recuerdos estarán disponibles en la invitación final.';

    configurarNavegacion();
    configurarAnimaciones();
    configurarMusica();
}

iniciarInvitacion();

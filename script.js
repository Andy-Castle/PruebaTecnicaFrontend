const API_URL = "https://d8aeba5b-65e8-48d5-8a78-a74f53ec2e9c.mock.pstmn.io/hotels";
const PLACEHOLDER_IMAGE = "Imgs/hotel-svgrepo-com.svg";
const SELECTORS = {
  grid: "#hoteles-grid",
  status: ".grid-hoteles__estado",
  results: ".top-grid__resultados",
};

document.addEventListener("DOMContentLoaded", () => {
  cargarHoteles();
});

async function cargarHoteles() {
  const grid = document.querySelector(SELECTORS.grid);
  const status = document.querySelector(SELECTORS.status);
  const results = document.querySelector(SELECTORS.results);

  if (!grid || !status) {
    return;
  }

  updateStatus(status, "Cargando hoteles...");

  try {
    const hoteles = await obtenerHoteles();

    if (Array.isArray(hoteles) && hoteles.length > 0) {
      if (results) {
        results.textContent = `${hoteles.length} resultados`;
      }

      const fragment = document.createDocumentFragment();
      hoteles.forEach((hotel) => {
        const card = crearTarjetaHotel(hotel);
        if (card) {
          fragment.appendChild(card);
        }
      });

      grid.textContent = "";
      grid.appendChild(fragment);
      ocultarStatus(status);
    } else {
      updateStatus(status, "No encontramos hoteles disponibles por ahora.");
    }
  } catch (error) {
    console.error("Error al cargar los hoteles", error);
    updateStatus(
      status,
      "Ocurrio un problema al cargar los hoteles. Intenta nuevamente."
    );
  }
}

async function obtenerHoteles() {
  const respuesta = await fetch(API_URL);

  if (!respuesta.ok) {
    throw new Error(`Solicitud fallida con estado ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  return Array.isArray(datos) ? datos : [];
}

function crearTarjetaHotel(hotel) {
  if (!hotel || typeof hotel !== "object") {
    return null;
  }

  const card = document.createElement("article");
  card.className = "hotel-card";
  card.setAttribute("role", "listitem");

  const galeria = Array.isArray(hotel.gallery)
    ? hotel.gallery.filter((item) => item && typeof item.uri === "string")
    : [];
  const imagenInicial = obtenerImagenPrincipal(galeria);

  const media = document.createElement("div");
  media.className = "hotel-card__media";

  const badge = document.createElement("span");
  badge.className = "hotel-card__badge";
  badge.textContent = `${obtenerDescuento(hotel.id)}% Descuento`;
  media.appendChild(badge);

  const imagen = document.createElement("img");
  imagen.className = "hotel-card__image";
  imagen.src = imagenInicial;
  imagen.alt = `Fotografia del hotel ${hotel.name || "sin nombre"}`;
  imagen.loading = "lazy";
  media.appendChild(imagen);

  const botonPrev = document.createElement("button");
  botonPrev.type = "button";
  botonPrev.className = "hotel-card__nav hotel-card__nav--prev";
  botonPrev.setAttribute("aria-label", "Ver imagen anterior");
  botonPrev.innerHTML = "&lsaquo;";

  const botonNext = document.createElement("button");
  botonNext.type = "button";
  botonNext.className = "hotel-card__nav hotel-card__nav--next";
  botonNext.setAttribute("aria-label", "Ver imagen siguiente");
  botonNext.innerHTML = "&rsaquo;";

  media.appendChild(botonPrev);
  media.appendChild(botonNext);
  card.appendChild(media);

  if (galeria.length <= 1) {
    botonPrev.hidden = true;
    botonNext.hidden = true;
  } else {
    configurarGaleria(media, imagen, galeria);
  }

  const cuerpo = document.createElement("div");
  cuerpo.className = "hotel-card__cuerpo";

  const titulo = document.createElement("h3");
  titulo.className = "hotel-card__titulo";
  titulo.textContent = hotel.name || "Hotel sin nombre";
  cuerpo.appendChild(titulo);

  const meta = document.createElement("div");
  meta.className = "hotel-card__meta";

  const rating = crearRating(hotel.category);
  if (rating) {
    meta.appendChild(rating);
  }

  const ciudad = document.createElement("span");
  ciudad.className = "hotel-card__ciudad";
  ciudad.textContent = formatearCiudad(hotel.address?.city, hotel.address?.country);
  meta.appendChild(ciudad);

  cuerpo.appendChild(meta);

  const descripcion = document.createElement("p");
  descripcion.className = "hotel-card__descripcion";
  descripcion.textContent = truncarTexto(hotel.description, 190);
  cuerpo.appendChild(descripcion);

  card.appendChild(cuerpo);

  return card;
}

function configurarGaleria(media, imagen, galeria) {
  let indice = 0;
  const total = galeria.length;

  const actualizar = () => {
    const entrada = galeria[indice];
    imagen.src = entrada.uri;
  };

  const mover = (paso) => {
    indice = (indice + paso + total) % total;
    actualizar();
  };

  const botonPrev = media.querySelector(".hotel-card__nav--prev");
  const botonNext = media.querySelector(".hotel-card__nav--next");

  if (botonPrev && botonNext) {
    botonPrev.addEventListener("click", () => mover(-1));
    botonNext.addEventListener("click", () => mover(1));
  }
}

function obtenerImagenPrincipal(galeria) {
  if (!Array.isArray(galeria) || galeria.length === 0) {
    return PLACEHOLDER_IMAGE;
  }

  const entradaValida = galeria.find(
    (item) => item && typeof item.uri === "string" && item.uri.trim()
  );
  return entradaValida ? entradaValida.uri : PLACEHOLDER_IMAGE;
}

function crearRating(category) {
  if (!category) {
    return null;
  }

  const contenedor = document.createElement("div");
  contenedor.className = "hotel-card__rating";

  if (
    category.showIcon &&
    Number.isInteger(category.number) &&
    category.number > 0
  ) {
    contenedor.setAttribute("aria-label", `${category.number} estrellas`);

    const grupo = document.createElement("div");
    grupo.className = "hotel-card__stars";

    for (let i = 0; i < category.number; i += 1) {
      const estrella = document.createElement("img");
      estrella.className = "hotel-card__star";
      estrella.src = "Imgs/start-favorite-svgrepo-com.svg";
      estrella.alt = "";
      estrella.setAttribute("aria-hidden", "true");
      grupo.appendChild(estrella);
    }

    contenedor.appendChild(grupo);
  } else if (category.name) {
    contenedor.textContent = category.name;
  }

  const tieneContenido =
    contenedor.childNodes.length > 0 || contenedor.textContent.trim().length > 0;

  return tieneContenido ? contenedor : null;
}

function truncarTexto(valor, limite) {
  if (!valor) {
    return "";
  }

  if (valor.length <= limite) {
    return valor;
  }

  return `${valor.slice(0, limite).trim()}...`;
}

function formatearCiudad(ciudad, pais) {
  if (!ciudad) {
    return pais || "Cancun";
  }

  const normalizada = ciudad.trim().toLowerCase();

  switch (normalizada) {
    case "cancun":
    case "cancún":
    case "mexico - cancun":
    case "cancun, qroo":
      return "Cancun";
    default:
      return ciudad
        .toLowerCase()
        .split(/\s+/)
        .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(" ");
  }
}

function obtenerDescuento(id) {
  if (!Number.isInteger(id)) {
    return 15;
  }

  const base =
    (Math.round(Math.abs(id / 10)) % Math.round(Math.random() * 100)) + 10;
  return Math.min(base, 60);
}

function updateStatus(elemento, mensaje) {
  elemento.textContent = mensaje;
  elemento.classList.remove("grid-hoteles__estado--oculto");
}

function ocultarStatus(elemento) {
  elemento.textContent = "";
  elemento.classList.add("grid-hoteles__estado--oculto");
}

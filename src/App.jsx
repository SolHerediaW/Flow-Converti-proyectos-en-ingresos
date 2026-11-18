import { useState, useEffect } from "react";
import { db } from "./services/firebase";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import FormularioProyecto from "./components/FormularioProyecto";
import ListaProyectos from "./components/ListaProyectos";
import RegistroFinanciero from "./components/RegistroFinanciero";
import CalendarioProyectos from "./components/CalendarioProyectos";
import "./App.css";

export default function App() {
  const [proyectos, setProyectos] = useState([]);
  const [costos, setCostos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [vistaActual, setVistaActual] = useState("principal");

  // Estados de filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroPago, setFiltroPago] = useState("Todos");

  useEffect(() => {
    async function iniciarYCargar() {
      setCargando(true);
      setError("");
      try {
        const auth = getAuth();
        await signInAnonymously(auth);

        const snapProyectos = await getDocs(collection(db, "proyectos"));
        const listaProyectos = snapProyectos.docs.map((documento) => ({
          id: documento.id,
          ...documento.data()
        }));
        setProyectos(listaProyectos);

        const snapCostos = await getDocs(collection(db, "costos"));
        const listaCostos = snapCostos.docs.map((documento) => ({
          id: documento.id,
          ...documento.data()
        }));
        setCostos(listaCostos);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los datos de la base de datos.");
      } finally {
        setCargando(false);
      }
    }

    iniciarYCargar();
  }, []);

  function mostrarAvisoExito(texto) {
    setMensajeExito(texto);
    setError("");
    setTimeout(() => {
      setMensajeExito("");
    }, 3500);
  }

  function mostrarAvisoError(texto) {
    setError(texto);
    setMensajeExito("");
  }

  async function agregarProyecto(nuevoProyecto) {
    mostrarAvisoExito("Guardando proyecto...");
    try {
      const docRef = await addDoc(collection(db, "proyectos"), nuevoProyecto);
      const proyectoConId = { id: docRef.id, ...nuevoProyecto };
      setProyectos((anteriores) => [...anteriores, proyectoConId]);
      setMostrarFormulario(false);
      mostrarAvisoExito("Proyecto creado correctamente.");
    } catch (err) {
      console.error(err);
      mostrarAvisoError("No se pudo guardar el proyecto.");
    }
  }

  async function editarProyecto(id, datosActualizados) {
    try {
      const proyectoRef = doc(db, "proyectos", id);
      await updateDoc(proyectoRef, datosActualizados);
      setProyectos((anteriores) =>
        anteriores.map((p) => (p.id === id ? { ...p, ...datosActualizados } : p))
      );
      mostrarAvisoExito("Proyecto actualizado correctamente.");
    } catch (err) {
      console.error(err);
      mostrarAvisoError("No se pudo actualizar el proyecto.");
    }
  }

  async function cambiarEstadoTrabajo(id, nuevoEstado) {
    try {
      const proyectoRef = doc(db, "proyectos", id);
      await updateDoc(proyectoRef, { estadoTrabajo: nuevoEstado });
      setProyectos((anteriores) =>
        anteriores.map((p) => (p.id === id ? { ...p, estadoTrabajo: nuevoEstado } : p))
      );
      mostrarAvisoExito("Estado actualizado.");
    } catch (err) {
      console.error(err);
      mostrarAvisoError("No se pudo cambiar el estado.");
    }
  }

  async function registrarCobroProyecto(id) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    const fechaHoy = `${anio}-${mes}-${dia}`;

    try {
      const proyectoRef = doc(db, "proyectos", id);
      const datosCobro = {
        estadoPago: "Pagado",
        fechaCobroPagoFinal: fechaHoy
      };
      await updateDoc(proyectoRef, datosCobro);
      setProyectos((anteriores) =>
        anteriores.map((p) => (p.id === id ? { ...p, ...datosCobro } : p))
      );
      mostrarAvisoExito("Cobro registrado correctamente.");
    } catch (err) {
      console.error(err);
      mostrarAvisoError("No se pudo registrar el cobro.");
    }
  }

  async function eliminarProyecto(id) {
    try {
      await deleteDoc(doc(db, "proyectos", id));
      setProyectos((anteriores) => anteriores.filter((p) => p.id !== id));
      mostrarAvisoExito("El proyecto fue eliminado con éxito.");
    } catch (err) {
      console.error(err);
      mostrarAvisoError("No se pudo eliminar el proyecto.");
    }
  }

  // Filtrado combinado: búsqueda insensible a mayúsculas + estado + pago
  const proyectosFiltrados = proyectos.filter((proyecto) => {
    const textoBuscado = busqueda.trim().toLowerCase();
    const cumpleBusqueda =
      textoBuscado === "" ||
      (proyecto.titulo && proyecto.titulo.toLowerCase().includes(textoBuscado)) ||
      (proyecto.cliente && proyecto.cliente.toLowerCase().includes(textoBuscado)) ||
      (proyecto.descripcion && proyecto.descripcion.toLowerCase().includes(textoBuscado));

    const cumpleEstado = filtroEstado === "Todos" || proyecto.estadoTrabajo === filtroEstado;
    const estadoPagoActual = proyecto.estadoPago || "Impago";
    const cumplePago = filtroPago === "Todos" || estadoPagoActual === filtroPago;

    return cumpleBusqueda && cumpleEstado && cumplePago;
  });

  if (cargando && proyectos.length === 0 && costos.length === 0) {
    return (
      <div className="pantalla-carga-global">
        <h1>Flow</h1>
        <p className="slogan">Convertí tus proyectos en ingresos</p>
        <p>Cargando tu espacio de trabajo...</p>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Header fijo bajo (60px) con marca y navegación */}
      <header className="header-fijo">
        <div className="header-marca">
          <h1>Flow</h1>
          <span className="header-slogan">Convertí tus proyectos en ingresos</span>
        </div>

        <nav className="header-nav">
          <button
            className={`btn-nav ${vistaActual === "principal" ? "activo" : ""}`}
            onClick={() => setVistaActual("principal")}
          >
            Mis proyectos
          </button>
          <button
            className={`btn-nav ${vistaActual === "financiero" ? "activo" : ""}`}
            onClick={() => setVistaActual("financiero")}
          >
            Registro financiero
          </button>
        </nav>
      </header>

      <main className="contenedor-principal">
        {mensajeExito && <p className="alerta-exito">{mensajeExito}</p>}
        {error && <p className="alerta-error" role="alert">{error}</p>}

        {vistaActual === "principal" && (
          <>
            <div className="encabezado-pagina">
              <h2>Mis proyectos</h2>
              <p className="subtitulo-seccion">
                Planificá tus entregas, organizá tus proyectos y mantené el control de tus proyectos
              </p>
            </div>

            {/* Sección 1: Próximas entregas + Calendario */}
            <section className="seccion-bloque">
              <div className="encabezado-seccion-interna">
                <h3>Próximas entregas</h3>
                <p className="subtitulo-seccion">
                  Consulta tus fechas de entrega y detectá rápidamente los proyectos que requieren atención
                </p>
              </div>
              <CalendarioProyectos proyectos={proyectos} />
            </section>

            {/* Sección 2: Espacio de trabajo + Filtros + Grilla de Cards */}
            <section className="seccion-bloque">
              <div className="barra-superior">
                <div>
                  <h3>Espacio de trabajo</h3>
                  <p className="subtitulo-seccion">
                    Administrá cada etapa de tus proyectos y registrá nuevos trabajos
                  </p>
                </div>
                <button
                  className="btn-primario btn-nuevo-escritorio"
                  onClick={() => setMostrarFormulario(true)}
                >
                  + Nuevo proyecto
                </button>
              </div>

              <ListaProyectos
                proyectos={proyectosFiltrados}
                totalProyectos={proyectos.length}
                cargando={cargando}
                cambiarEstadoTrabajo={cambiarEstadoTrabajo}
                registrarCobroProyecto={registrarCobroProyecto}
                eliminarProyecto={eliminarProyecto}
                editarProyecto={editarProyecto}
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                filtroEstado={filtroEstado}
                setFiltroEstado={setFiltroEstado}
                filtroPago={filtroPago}
                setFiltroPago={setFiltroPago}
              />
            </section>

            {/* Botón flotante redondo para celular */}
            <button
              className="btn-flotante-movil"
              onClick={() => setMostrarFormulario(true)}
              aria-label="Nuevo proyecto"
            >
              +
            </button>

            {/* Modal de creación */}
            {mostrarFormulario && (
              <FormularioProyecto
                agregarProyecto={agregarProyecto}
                cerrarModal={() => setMostrarFormulario(false)}
              />
            )}
          </>
        )}

        {vistaActual === "financiero" && (
          <RegistroFinanciero
            proyectos={proyectos}
            costos={costos}
            setCostos={setCostos}
            registrarCobroProyecto={registrarCobroProyecto}
            mostrarExito={mostrarAvisoExito}
            mostrarError={mostrarAvisoError}
          />
        )}
      </main>
    </div>
  );
}
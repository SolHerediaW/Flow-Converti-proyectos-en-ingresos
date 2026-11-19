import { useState, useEffect } from "react";
import { db } from "./services/firebase";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import FormularioProyecto from "./components/FormularioProyecto";
import ListaProyectos from "./components/ListaProyectos";
import RegistroFinanciero from "./components/RegistroFinanciero";
import CalendarioProyectos from "./components/CalendarioProyectos";
import { formatearMoneda } from "./components/Finanzas";
import "./App.css";

export default function App() {
  const [proyectos, setProyectos] = useState([]);
  const [costos, setCostos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [mensajeExitoGlobal, setMensajeExitoGlobal] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [vistaActual, setVistaActual] = useState("principal");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroPago, setFiltroPago] = useState("Todos");

  useEffect(() => {
    async function iniciarYCargar() {
      setCargando(true);
      setErrorGlobal("");
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
        setErrorGlobal("No se pudieron cargar los datos de la base de datos.");
      } finally {
        setCargando(false);
      }
    }

    iniciarYCargar();
  }, []);

  function mostrarExito(texto) {
    setMensajeExitoGlobal(texto);
    setErrorGlobal("");
    setTimeout(() => {
      setMensajeExitoGlobal("");
    }, 3500);
  }

  function mostrarError(texto) {
    setErrorGlobal(texto);
    setMensajeExitoGlobal("");
    setTimeout(() => {
      setErrorGlobal("");
    }, 3500);
  }

  async function agregarProyecto(nuevoProyecto) {
    try {
      const docRef = await addDoc(collection(db, "proyectos"), nuevoProyecto);
      const proyectoConId = { id: docRef.id, ...nuevoProyecto };
      setProyectos((anteriores) => [...anteriores, proyectoConId]);
      setMostrarFormulario(false);
      mostrarExito("¡Logró guardarse el proyecto!");
    } catch (err) {
      console.error(err);
      mostrarError("Por favor complete todos los campos vacíos.");
    }
  }

  async function editarProyecto(id, datosActualizados) {
    try {
      const proyectoRef = doc(db, "proyectos", id);
      await updateDoc(proyectoRef, datosActualizados);
      setProyectos((anteriores) =>
        anteriores.map((p) => (p.id === id ? { ...p, ...datosActualizados } : p))
      );
      mostrarExito("¡Logró guardarse el proyecto!");
    } catch (err) {
      console.error(err);
      mostrarError("Por favor complete todos los campos vacíos.");
    }
  }

  async function cambiarEstadoTrabajo(id, nuevoEstado) {
    try {
      const proyectoRef = doc(db, "proyectos", id);
      await updateDoc(proyectoRef, { estadoTrabajo: nuevoEstado });
      setProyectos((anteriores) =>
        anteriores.map((p) => (p.id === id ? { ...p, estadoTrabajo: nuevoEstado } : p))
      );
    } catch (err) {
      console.error(err);
      mostrarError("No se pudo cambiar el estado.");
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
      mostrarExito("Cobro registrado correctamente.");
    } catch (err) {
      console.error(err);
      mostrarError("No se pudo registrar el cobro.");
    }
  }

  async function eliminarProyecto(id) {
    try {
      await deleteDoc(doc(db, "proyectos", id));
      setProyectos((anteriores) => anteriores.filter((p) => p.id !== id));
      mostrarExito("Tu proyecto se eliminó exitosamente");
    } catch (err) {
      console.error(err);
      mostrarError("No se pudo eliminar el proyecto.");
    }
  }

  let ingresosARS = 0;
  let ingresosUSD = 0;
  let proyeccionARS = 0;
  let proyeccionUSD = 0;

  for (const p of proyectos) {
    const moneda = p.moneda || "ARS";
    const montoTotal = Number(p.montoPago || 0);
    const estadoPago = p.estadoPago || "Impago";

    if (p.estadoTrabajo === "Terminado") {
      if (moneda === "USD") ingresosUSD += montoTotal;
      else ingresosARS += montoTotal;
    } else if (estadoPago === "Con seña") {
      // Si querés mantener la lógica de seña para proyectos que NO están terminados todavía:
      const sena = Number(p.montoSena || 0);
      if (moneda === "USD") ingresosUSD += sena;
      else ingresosARS += sena;

      const saldo = montoTotal - sena;
      if (saldo > 0) {
        if (moneda === "USD") proyeccionUSD += saldo;
        else proyeccionARS += saldo;
      }
    } else if (estadoPago === "Impago") {
      if (montoTotal > 0) {
        if (moneda === "USD") proyeccionUSD += montoTotal;
        else proyeccionARS += montoTotal;
      }
    }
  }
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
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F', color: '#FFFFFF' }}>
        <h1>Flow</h1>
        <p>Cargando tu espacio de trabajo...</p>
      </div>
    );
  }

  const esMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  return (
    <div className="app-layout-desktop">
      {/* Modales de feedback flotantes centrados en mobile o distribuidos en desktop */}
      {mensajeExitoGlobal && (
        <div className="modal-feedback-exito" role="status">
          {mensajeExitoGlobal}
        </div>
      )}
      {errorGlobal && (
        <div className={esMobile ? "modal-feedback-error" : "modal-feedback-error-izq"} role="alert">
          {errorGlobal}
        </div>
      )}

      {/* Header Fijo Superior para Mobile */}
      <header className="header-mobile-fijo">
        <div className="header-mobile-top-row">
          <div className="sidebar-logo-icon" style={{ padding: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>all_inclusive</span>
          </div>
          <div>
            <h1>Flow</h1>
            <p>Convertí proyectos en ingresos</p>
          </div>
        </div>
        <div className="header-mobile-contadores">
          <div className="tarjeta-contador-sidebar">
            <span className="valor-ars">{formatearMoneda(ingresosARS, "ARS")}</span>
            <span className="valor-usd">{formatearMoneda(ingresosUSD, "USD")}</span>
            <span className="contador-titulo">Ingresos del mes</span>
          </div>
          <div className="tarjeta-contador-sidebar">
            <span className="valor-ars">{formatearMoneda(proyeccionARS, "ARS")}</span>
            <span className="valor-usd">{formatearMoneda(proyeccionUSD, "USD")}</span>
            <span className="contador-titulo">Proyección del mes</span>
          </div>
        </div>
      </header>

      {/* Sidebar Fijo Izquierdo para Desktop */}
      <aside className="sidebar-desktop">
        <div>
          <div className="sidebar-marca">
            <div className="sidebar-logo-icon">
              <span className="material-symbols-outlined">all_inclusive</span>
            </div>
            <div>
              <h1>Flow</h1>
              <p>Convertí proyectos en ingresos</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`btn-nav-sidebar ${vistaActual === "principal" ? "activo-proyectos" : ""}`}
              onClick={() => setVistaActual("principal")}
            >
              <span className="material-symbols-outlined">folder_open</span>
              Mis proyectos
            </button>
            <button
              className={`btn-nav-sidebar ${vistaActual === "financiero" ? "activo-financiero" : ""}`}
              onClick={() => setVistaActual("financiero")}
            >
              <span className="material-symbols-outlined">bar_chart</span>
              Registro financiero
            </button>
          </nav>
        </div>

        <div className="sidebar-contadores">
          <div className="tarjeta-contador-sidebar">
            <span className="valor-ars">{formatearMoneda(ingresosARS, "ARS")}</span>
            <span className="valor-usd">{formatearMoneda(ingresosUSD, "USD")}</span>
            <span className="contador-titulo">Ingresos del mes</span>
          </div>
          <div className="tarjeta-contador-sidebar">
            <span className="valor-ars">{formatearMoneda(proyeccionARS, "ARS")}</span>
            <span className="valor-usd">{formatearMoneda(proyeccionUSD, "USD")}</span>
            <span className="contador-titulo">Proyección del mes</span>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="contenido-principal-desktop">
        {vistaActual === "principal" && (
          <>
            <div className="encabezado-vista">
              <div className="icono-vista-circulo proyectos">
                <span className="material-symbols-outlined">folder_open</span>
              </div>
              <div className="textos-vista-titulo">
                <h2>Mis proyectos</h2>
                <p>Planificá tus entregas, organizá y mantené el control de tus proyectos</p>
              </div>
            </div>

            <section className="seccion-bloque">
              <CalendarioProyectos proyectos={proyectos} />
            </section>

            <section className="seccion-bloque">
              <div className="barra-superior">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#D38B80' }}>list_alt</span>
                  <div>
                    <h3>Espacio de trabajo</h3>
                    <p className="subtitulo-seccion">Administrá cada etapa de tus proyectos y registrá nuevos trabajos</p>
                  </div>
                </div>
                <button
                  className="btn-primario"
                  style={{ display: window.innerWidth <= 768 ? 'none' : 'inline-flex' }}
                  onClick={() => setMostrarFormulario(true)}
                >
                  <span className="material-symbols-outlined">add</span>
                  Nuevo proyecto
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
                mostrarExito={mostrarExito}
                mostrarError={mostrarError}
              />
            </section>

            <button
              className="btn-flotante-movil"
              onClick={() => setMostrarFormulario(true)}
              aria-label="Nuevo proyecto"
            >
              +
            </button>

            {mostrarFormulario && (
              <FormularioProyecto
                agregarProyecto={agregarProyecto}
                cerrarModal={() => setMostrarFormulario(false)}
                mostrarError={mostrarError}
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
            mostrarExito={mostrarExito}
            mostrarError={mostrarError}
          />
        )}
      </main>

      {/* Barra de Navegación Inferior para Mobile */}
      <nav className="nav-movil-inferior">
        <button
          className={`btn-nav-movil ${vistaActual === "principal" ? "activo" : ""}`}
          onClick={() => setVistaActual("principal")}
        >
          <span className="material-symbols-outlined">folder_open</span>
          Mis proyectos
        </button>
        <button
          className={`btn-nav-movil ${vistaActual === "financiero" ? "activo" : ""}`}
          onClick={() => setVistaActual("financiero")}
        >
          <span className="material-symbols-outlined">bar_chart</span>
          Financiero
        </button>
      </nav>
    </div>
  );
}
import { useState, useEffect } from "react";
import { db } from "./services/firebase";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import FormularioProyecto from "./components/FormularioProyecto";
import ListaProyectos from "./components/ListaProyectos";
import RegistroFinanciero from "./components/RegistroFinanciero";
import { calcularContadoresFinancieros, formatearMoneda } from "./components/Finanzas";
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
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroPago, setFiltroPago] = useState("Todos");
  const [filtroTiempo, setFiltroTiempo] = useState("Este mes");

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
    try {
      const docRef = await addDoc(collection(db, "proyectos"), nuevoProyecto);
      const proyectoConId = { id: docRef.id, ...nuevoProyecto };
      setProyectos((anteriores) => [...anteriores, proyectoConId]);
      setMostrarFormulario(false);
      mostrarAvisoExito("Se subió su proyecto correctamente.");
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
    } catch (err) {
      console.error(err);
      mostrarAvisoError("No se pudo cambiar el estado.");
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

  // Cálculo directo durante el render (sin useEffect extra)
  const contadores = calcularContadoresFinancieros(proyectos, filtroTiempo);

  const proyectosFiltrados = proyectos.filter((proyecto) => {
    const cumpleEstado = filtroEstado === "Todos" || proyecto.estadoTrabajo === filtroEstado;
    const estadoPagoActual = proyecto.estadoPago || "Impago";
    const cumplePago = filtroPago === "Todos" || estadoPagoActual === filtroPago;
    return cumpleEstado && cumplePago;
  });

  return (
    <main className="contenedor">
      <header className="encabezado">
        <h1>Gestor Freelance</h1>
        <button
          className="btn-secundario"
          onClick={() => setVistaActual(vistaActual === "principal" ? "financiero" : "principal")}
        >
          {vistaActual === "principal" ? "Registro financiero" : "Volver a Proyectos"}
        </button>
      </header>

      {mensajeExito && <p className="alerta-exito">{mensajeExito}</p>}
      {error && <p className="alerta-error" role="alert">{error}</p>}

      {vistaActual === "principal" && (
        <>
          <div className="barra-filtro-tiempo">
            <label htmlFor="select-tiempo"><strong>Período financiero: </strong></label>
            <select
              id="select-tiempo"
              value={filtroTiempo}
              onChange={(e) => setFiltroTiempo(e.target.value)}
            >
              <option value="Este mes">Este mes</option>
              <option value="Este año">Este año</option>
            </select>
          </div>

          <section className="panel-contadores">
            <article className="tarjeta-contador">
              <h3>Ingresos Confirmados</h3>
              <p className="monto-verde">ARS: {formatearMoneda(contadores.confirmadosARS, "ARS")}</p>
              <p className="monto-verde">USD: {formatearMoneda(contadores.confirmadosUSD, "USD")}</p>
            </article>

            <article className="tarjeta-contador">
              <h3>Proyección Potencial</h3>
              <p className="monto-azul">ARS: {formatearMoneda(contadores.proyeccionARS, "ARS")}</p>
              <p className="monto-azul">USD: {formatearMoneda(contadores.proyeccionUSD, "USD")}</p>
            </article>
          </section>

          <div className="barra-superior">
            <h2>Mis proyectos</h2>
            <button
              className="btn-primario"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
              {mostrarFormulario ? "Cerrar formulario" : "+ Nuevo proyecto"}
            </button>
          </div>

          {mostrarFormulario && (
            <FormularioProyecto
              agregarProyecto={agregarProyecto}
              mostrarError={mostrarAvisoError}
            />
          )}

          <ListaProyectos
            proyectos={proyectosFiltrados}
            totalProyectos={proyectos.length}
            cargando={cargando}
            cambiarEstadoTrabajo={cambiarEstadoTrabajo}
            eliminarProyecto={eliminarProyecto}
            editarProyecto={editarProyecto}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            filtroPago={filtroPago}
            setFiltroPago={setFiltroPago}
          />
        </>
      )}

      {vistaActual === "financiero" && (
        <RegistroFinanciero
          proyectos={proyectos}
          costos={costos}
          setCostos={setCostos}
          mostrarExito={mostrarAvisoExito}
          mostrarError={mostrarAvisoError}
        />
      )}
    </main>
  );
}
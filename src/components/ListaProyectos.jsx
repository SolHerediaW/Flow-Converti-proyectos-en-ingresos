import { useState } from "react";
import { formatearMoneda } from "./Finanzas";

export default function ListaProyectos({
  proyectos,
  totalProyectos,
  cargando,
  cambiarEstadoTrabajo,
  registrarCobroProyecto,
  eliminarProyecto,
  editarProyecto,
  busqueda,
  setBusqueda,
  filtroEstado,
  setFiltroEstado,
  filtroPago,
  setFiltroPago,
  mostrarExito,
  mostrarError
}) {
  const [buscadorEnfocado, setBuscadorEnfocado] = useState(false);

  const [editandoProyecto, setEditandoProyecto] = useState(null);
  const [proyectoAEliminar, setProyectoAEliminar] = useState(null);

  const [tituloEdit, setTituloEdit] = useState("");
  const [descripcionEdit, setDescripcionEdit] = useState("");
  const [clienteEdit, setClienteEdit] = useState("");
  const [fechaEntregaEdit, setFechaEntregaEdit] = useState("");
  const [horasEstimadasEdit, setHorasEstimadasEdit] = useState("");
  const [monedaEdit, setMonedaEdit] = useState("ARS");
  const [estadoTrabajoEdit, setEstadoTrabajoEdit] = useState("Pendiente");
  const [montoEdit, setMontoEdit] = useState("");
  const [estadoPagoEdit, setEstadoPagoEdit] = useState("Impago");
  const [montoSenaEdit, setMontoSenaEdit] = useState("");
  const [fechaSenaEdit, setFechaSenaEdit] = useState("");
  const [fechaCobroPagoFinalEdit, setFechaCobroPagoFinalEdit] = useState("");

  const filtrosEstadoLista = [
    { label: "Pendientes", valor: "Pendiente" },
    { label: "En proceso", valor: "En proceso" },
    { label: "Terminado", valor: "Terminado" }
  ];

  const estadosTarjeta = ["Pendiente", "En proceso", "Terminado"];
  const estadosTrabajoOpciones = ["Pendiente", "En proceso", "Terminado"];
  const opcionesCobro = [
    { label: "No", valor: "Impago" },
    { label: "Una seña", valor: "Con seña" },
    { label: "Pagado completo", valor: "Pagado" }
  ];

  function manejarClickFiltroEstado(valor) {
    if (filtroEstado === valor) {
      setFiltroEstado("Todos");
    } else {
      setFiltroEstado(valor);
    }
  }

  function iniciarEdicion(proyecto) {
    setEditandoProyecto(proyecto);
    setTituloEdit(proyecto.titulo || "");
    setDescripcionEdit(proyecto.descripcion || "");
    setClienteEdit(proyecto.cliente || "");
    setFechaEntregaEdit(proyecto.fechaEntrega || "");
    setHorasEstimadasEdit(proyecto.horasEstimadas || "");
    setMonedaEdit(proyecto.moneda || "ARS");
    setEstadoTrabajoEdit(proyecto.estadoTrabajo || "Pendiente");
    setMontoEdit(proyecto.montoPago || "");
    setEstadoPagoEdit(proyecto.estadoPago || "Impago");
    setMontoSenaEdit(proyecto.montoSena || "");
    setFechaSenaEdit(proyecto.fechaSena || "");
    setFechaCobroPagoFinalEdit(proyecto.fechaCobroPagoFinal || "");
  }

  function guardarEdicion(id) {
    if (!tituloEdit.trim() || !clienteEdit.trim() || !montoEdit) {
      mostrarError("Por favor complete todos los campos vacíos.");
      return;
    }

    editarProyecto(id, {
      titulo: tituloEdit.trim(),
      descripcion: descripcionEdit.trim(),
      cliente: clienteEdit.trim(),
      fechaEntrega: fechaEntregaEdit,
      horasEstimadas: Number(horasEstimadasEdit) || 0,
      moneda: monedaEdit,
      estadoTrabajo: estadoTrabajoEdit,
      montoPago: Number(montoEdit),
      estadoPago: estadoPagoEdit,
      conSena: estadoPagoEdit === "Con seña",
      montoSena: estadoPagoEdit === "Con seña" ? Number(montoSenaEdit) : 0,
      fechaSena: estadoPagoEdit === "Con seña" ? fechaSenaEdit : "",
      fechaCobroPagoFinal: estadoPagoEdit === "Pagado" ? fechaCobroPagoFinalEdit : ""
    });
    setEditandoProyecto(null);
  }

  return (
    <div>
      <div className="caja-filtros">
        <input
          type="text"
          className="input-buscador-reducido"
          placeholder={buscadorEnfocado ? "" : "Explora tus proyectos..."}
          value={busqueda}
          onFocus={() => setBuscadorEnfocado(true)}
          onBlur={() => setBuscadorEnfocado(false)}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="filtro-pago-centro">
          <select value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)}>
            <option value="Todos">Pago: Todos</option>
            <option value="Impago">Impago</option>
            <option value="Con seña">Con seña</option>
            <option value="Pagado">Pagado</option>
          </select>
        </div>

        <div className="filtros-botones-estado">
          {filtrosEstadoLista.map((item) => (
            <button
              key={item.valor}
              type="button"
              className={`btn-filtro-estado ${filtroEstado === item.valor ? "activo" : ""}`}
              onClick={() => manejarClickFiltroEstado(item.valor)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <span className="etiqueta-contador-externo">
        Mostrando {proyectos.length} de {totalProyectos}
      </span>

      {cargando && <p>Actualizando resultados…</p>}

      {!cargando && totalProyectos === 0 && (
        <p className="mensaje-vacio">
          Todavía no hay proyectos. Creá tu primer proyecto para comenzar.
        </p>
      )}

      {!cargando && totalProyectos > 0 && proyectos.length === 0 && (
        <p className="mensaje-vacio">No hay proyectos para mostrar con estos filtros.</p>
      )}

      {!cargando && proyectos.length > 0 && (
        <div className="grilla-proyectos-dos">
          {proyectos.map((proyecto) => {
            const moneda = proyecto.moneda || "ARS";
            const estadoPago = proyecto.estadoPago || "Impago";
            const estadoTrabajoClase = (proyecto.estadoTrabajo || "Pendiente").toLowerCase().replace(/\s+/g, "-");
            const necesitaCobro = estadoPago !== "Pagado";

            return (
              <article key={proyecto.id} className={`tarjeta-proyecto-card ${estadoTrabajoClase}`}>
                <div className="card-cabecera">
                  <div>
                    <h4 className="card-titulo">{proyecto.titulo}</h4>
                    <p className="card-cliente">{proyecto.cliente}</p>
                  </div>
                  <div className="card-monto-derecha">
                    <span className="card-monto-total">
                      {formatearMoneda(proyecto.montoPago, moneda)}
                    </span>
                    <span className="card-estado-pago-sub">
                      {estadoPago === "Con seña"
                        ? `Con seña: ${moneda} $${proyecto.montoSena || 0}`
                        : estadoPago}
                    </span>
                  </div>
                </div>

                <div className="card-detalles-medios">
                  {proyecto.descripcion && (
                    <p className="card-descripcion">{proyecto.descripcion}</p>
                  )}
                  <p className="card-entrega-horas">
                    Entrega: {proyecto.fechaEntrega} - {proyecto.horasEstimadas || 0}hs
                  </p>
                </div>

                {necesitaCobro && (
                  <div className="bloque-cobro-mobile" style={{ display: window.innerWidth <= 768 ? 'block' : 'none', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn-primario"
                      style={{ width: '100%', padding: '10px', fontSize: '12px' }}
                      onClick={() => registrarCobroProyecto(proyecto.id)}
                    >
                      Registrar cobro
                    </button>
                  </div>
                )}

                <div className="card-linea-divisoria"></div>

                <div className="card-fila-inferior">
                 <div className="card-botones-estado">
                  {estadosTarjeta.map((est) => (
                    <button
                      key={est}
                      type="button"
                      className={`btn-estado-card ${
                      proyecto.estadoTrabajo === est ? "seleccionado" : ""
                      }`}
                      onClick={() => cambiarEstadoTrabajo(proyecto.id, est)}
                    >
                    {est}
                    </button>
                  ))}
                </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {necesitaCobro && (
                      <button
                        type="button"
                        className="btn-primario"
                        style={{ display: window.innerWidth <= 768 ? 'none' : 'inline-flex', padding: '6px 12px', fontSize: '11px' }}
                        onClick={() => registrarCobroProyecto(proyecto.id)}
                      >
                        Registrar cobro
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-editar-icono"
                      onClick={() => iniciarEdicion(proyecto)}
                      title="Editar proyecto"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal de Edición */}
      {editandoProyecto && (
        <div className="modal-fondo" onClick={() => setEditandoProyecto(null)}>
          <div className="modal-ventana-rectangular" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecera-titulo">
              <h3>Editar proyecto</h3>
            </div>

            <div className="modal-formulario-dos-cols">
              <div className="modal-cuerpo-grid">
                <div className="columna-modal-izq">
                  <div className="campo">
                    <label>Título*</label>
                    <input value={tituloEdit} onChange={(e) => setTituloEdit(e.target.value)} />
                  </div>
                  <div className="campo">
                    <label>Cliente*</label>
                    <input value={clienteEdit} onChange={(e) => setClienteEdit(e.target.value)} />
                  </div>
                  <div className="fila-dos-inputs">
                    <div className="campo">
                      <label>Entrega*</label>
                      <input type="date" value={fechaEntregaEdit} onChange={(e) => setFechaEntregaEdit(e.target.value)} />
                    </div>
                    <div className="campo">
                      <label>Horas lab. estimadas*</label>
                      <input type="number" value={horasEstimadasEdit} onChange={(e) => setHorasEstimadasEdit(e.target.value)} />
                    </div>
                  </div>
                  <div className="campo">
                    <label>Descripción*</label>
                    <textarea rows="3" value={descripcionEdit} onChange={(e) => setDescripcionEdit(e.target.value)} />
                  </div>
                </div>

                <div className="columna-modal-der">
                  <div className="campo">
                    <label>Estado*</label>
                    <div className="grupo-botones-segmentados">
                      {estadosTrabajoOpciones.map((est) => (
                        <button
                          key={est}
                          type="button"
                          className={`btn-segmento ${estadoTrabajoEdit === est ? "activo" : ""}`}
                          onClick={() => setEstadoTrabajoEdit(est)}
                        >
                          {est}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="campo">
                    <label>Monto acordado*</label>
                    <div className="input-grupo-moneda">
                      <select
                        className="select-moneda-pegado"
                        value={monedaEdit}
                        onChange={(e) => setMonedaEdit(e.target.value)}
                      >
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </select>
                      <input
                        type="number"
                        value={montoEdit}
                        onChange={(e) => setMontoEdit(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="campo">
                    <label>¿Ya cobraste algo?*</label>
                    <div className="grupo-botones-segmentados">
                      {opcionesCobro.map((op) => (
                        <button
                          key={op.valor}
                          type="button"
                          className={`btn-segmento ${estadoPagoEdit === op.valor ? "activo" : ""}`}
                          onClick={() => setEstadoPagoEdit(op.valor)}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {estadoPagoEdit === "Con seña" && (
                    <div className="fila-dos-inputs">
                      <div className="campo">
                        <label>Monto seña*</label>
                        <input type="number" value={montoSenaEdit} onChange={(e) => setMontoSenaEdit(e.target.value)} />
                      </div>
                      <div className="campo">
                        <label>Fecha de cobro de seña*</label>
                        <input type="date" value={fechaSenaEdit} onChange={(e) => setFechaSenaEdit(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-pie-acciones">
                <button
                  type="button"
                  className="btn-peligro"
                  onClick={() => setProyectoAEliminar(editandoProyecto)}
                >
                  <span className="material-symbols-outlined">delete</span>
                  Eliminar
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secundario"
                    onClick={() => setEditandoProyecto(null)}
                  >
                    <span className="material-symbols-outlined">close</span>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primario"
                    onClick={() => guardarEdicion(editandoProyecto.id)}
                  >
                    <span className="material-symbols-outlined">check</span>
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar proyecto */}
      {proyectoAEliminar && (
        <div className="modal-fondo">
          <div className="modal-confirmacion-contenido">
            <h3>¿Desea eliminar el proyecto?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div className="modal-confirmacion-botones">
              <button
                type="button"
                className="btn-secundario"
                onClick={() => setProyectoAEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-peligro"
                onClick={() => {
                  eliminarProyecto(proyectoAEliminar.id);
                  setProyectoAEliminar(null);
                  setEditandoProyecto(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
  setFiltroPago
}) {
  const [buscadorEnfocado, setBuscadorEnfocado] = useState(false);

  // Estados para edición
  const [editandoId, setEditandoId] = useState(null);
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
    { label: "Todos", valor: "Todos" },
    { label: "Pendientes", valor: "Pendiente" },
    { label: "En proceso", valor: "En proceso" },
    { label: "Terminado", valor: "Terminado" }
  ];

  const estadosTarjeta = ["Pendiente", "En proceso", "Terminado"];

  function iniciarEdicion(proyecto) {
    setEditandoId(proyecto.id);
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
    setEditandoId(null);
  }

  return (
    <div>
      {/* Caja de filtros renovada */}
      <div className="caja-filtros">
        {/* Fila 1: Buscador arriba + Mostrando X de X a la derecha */}
        <div className="filtros-fila-superior">
          <input
            type="text"
            className="input-buscador"
            placeholder={buscadorEnfocado ? "" : "Explora tus proyectos..."}
            value={busqueda}
            onFocus={() => setBuscadorEnfocado(true)}
            onBlur={() => setBuscadorEnfocado(false)}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="etiqueta-contador">
            Mostrando {proyectos.length} de {totalProyectos}
          </span>
        </div>

        {/* Fila 2: 4 botones de estado a la izquierda + select de pago a la derecha */}
        <div className="filtros-fila-inferior">
          <div className="filtros-botones-estado">
            {filtrosEstadoLista.map((item) => (
              <button
                key={item.valor}
                type="button"
                className={`btn-filtro-estado ${filtroEstado === item.valor ? "activo" : ""}`}
                onClick={() => setFiltroEstado(item.valor)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="filtro-pago-derecha">
            <select value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)}>
              <option value="Todos">Pago: Todos</option>
              <option value="Impago">Impago</option>
              <option value="Con seña">Con seña</option>
              <option value="Pagado">Pagado</option>
            </select>
          </div>
        </div>
      </div>

      {cargando && <p>Actualizando resultados…</p>}

      {!cargando && totalProyectos === 0 && (
        <p className="mensaje-vacio">
          Todavía no hay proyectos. Creá tu primer proyecto para comenzar a proyectar ingresos.
        </p>
      )}

      {!cargando && totalProyectos > 0 && proyectos.length === 0 && (
        <p className="mensaje-vacio">No hay proyectos para mostrar con estos filtros.</p>
      )}

      {/* Grilla de 3 columnas para las cards */}
      {!cargando && proyectos.length > 0 && (
        <div className="grilla-proyectos-tres">
          {proyectos.map((proyecto) => {
            const moneda = proyecto.moneda || "ARS";
            const estadoPago = proyecto.estadoPago || "Impago";
            const estaEditando = editandoId === proyecto.id;

            return (
              <article key={proyecto.id} className="tarjeta-proyecto-card">
                {estaEditando ? (
                  <div className="formulario-edicion-card">
                    <div className="campo">
                      <label>Título</label>
                      <input value={tituloEdit} onChange={(e) => setTituloEdit(e.target.value)} />
                    </div>
                    <div className="campo">
                      <label>Cliente</label>
                      <input value={clienteEdit} onChange={(e) => setClienteEdit(e.target.value)} />
                    </div>
                    <div className="campo">
                      <label>Descripción</label>
                      <textarea
                        rows="2"
                        value={descripcionEdit}
                        onChange={(e) => setDescripcionEdit(e.target.value)}
                      />
                    </div>
                    <div className="fila-dos-columnas">
                      <div className="campo">
                        <label>Entrega</label>
                        <input
                          type="date"
                          value={fechaEntregaEdit}
                          onChange={(e) => setFechaEntregaEdit(e.target.value)}
                        />
                      </div>
                      <div className="campo">
                        <label>Horas</label>
                        <input
                          type="number"
                          value={horasEstimadasEdit}
                          onChange={(e) => setHorasEstimadasEdit(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="campo">
                      <label>Monto</label>
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
                      <label>Estado de trabajo</label>
                      <select
                        value={estadoTrabajoEdit}
                        onChange={(e) => setEstadoTrabajoEdit(e.target.value)}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En proceso">En proceso</option>
                        <option value="Terminado">Terminado</option>
                      </select>
                    </div>
                    <div className="campo">
                      <label>Estado de pago</label>
                      <select
                        value={estadoPagoEdit}
                        onChange={(e) => setEstadoPagoEdit(e.target.value)}
                      >
                        <option value="Impago">Impago</option>
                        <option value="Con seña">Con seña</option>
                        <option value="Pagado">Pagado</option>
                      </select>
                    </div>

                    {estadoPagoEdit === "Con seña" && (
                      <div className="fila-dos-columnas">
                        <div className="campo">
                          <label>Seña</label>
                          <input
                            type="number"
                            value={montoSenaEdit}
                            onChange={(e) => setMontoSenaEdit(e.target.value)}
                          />
                        </div>
                        <div className="campo">
                          <label>Fecha seña</label>
                          <input
                            type="date"
                            value={fechaSenaEdit}
                            onChange={(e) => setFechaSenaEdit(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {estadoPagoEdit === "Pagado" && (
                      <div className="campo">
                        <label>Fecha cobro</label>
                        <input
                          type="date"
                          value={fechaCobroPagoFinalEdit}
                          onChange={(e) => setFechaCobroPagoFinalEdit(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="card-acciones-inferiores">
                      <button
                        type="button"
                        className="btn-peligro"
                        onClick={() => eliminarProyecto(proyecto.id)}
                      >
                        Eliminar
                      </button>
                      <div className="botones-fila">
                        <button
                          type="button"
                          className="btn-exito"
                          onClick={() => guardarEdicion(proyecto.id)}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="btn-secundario"
                          onClick={() => setEditandoId(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Cabecera de la card: Título/Cliente a la izq | Monto/Cobrado a la der */}
                    <div className="card-cabecera">
                      <div className="card-info-izquierda">
                        <h4 className="card-titulo">{proyecto.titulo}</h4>
                        <p className="card-cliente">{proyecto.cliente}</p>
                      </div>

                      <div className="card-monto-derecha">
                        <span className="card-monto-total">
                          {formatearMoneda(proyecto.montoPago, moneda)}
                        </span>
                        {estadoPago === "Con seña" && (
                          <span className="card-cobrado-sena">
                            Cobrado: {formatearMoneda(proyecto.montoSena, moneda)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Descripción chica y línea de Entrega - Horas */}
                    <div className="card-detalles-medios">
                      {proyecto.descripcion && (
                        <p className="card-descripcion">{proyecto.descripcion}</p>
                      )}
                      <p className="card-entrega-horas">
                        Entrega: {proyecto.fechaEntrega} - {proyecto.horasEstimadas || 0} hs
                      </p>
                    </div>

                    {/* Fila de 3 botones de estado (con .map) + Estado de pago a la derecha */}
                    <div className="card-fila-estados">
                      <div className="card-botones-estado">
                        {estadosTarjeta.map((est) => (
                          <button
                            key={est}
                            type="button"
                            className={`btn-estado-card ${
                              proyecto.estadoTrabajo === est ? "seleccionado" : "no-seleccionado"
                            }`}
                            onClick={() => cambiarEstadoTrabajo(proyecto.id, est)}
                          >
                            {est}
                          </button>
                        ))}
                      </div>

                      <span className="card-badge-pago">{estadoPago}</span>
                    </div>

                    {/* Pie de la card: Registrar cobro (izq, si no es Pagado) + Editar (der) */}
                    <div className="card-acciones-inferiores">
                      <div>
                        {estadoPago !== "Pagado" && (
                          <button
                            type="button"
                            className="btn-primario btn-sm"
                            onClick={() => registrarCobroProyecto(proyecto.id)}
                          >
                            Registrar cobro
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn-editar btn-sm"
                        onClick={() => iniciarEdicion(proyecto)}
                      >
                        Editar
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
import { useState } from "react";
import { formatearMoneda } from "./Finanzas";

export default function ListaProyectos({
  proyectos,
  totalProyectos,
  cargando,
  cambiarEstadoTrabajo,
  eliminarProyecto,
  editarProyecto,
  filtroEstado,
  setFiltroEstado,
  filtroPago,
  setFiltroPago
}) {
  const [editandoId, setEditandoId] = useState(null);
  const [tituloEdit, setTituloEdit] = useState("");
  const [clienteEdit, setClienteEdit] = useState("");
  const [montoEdit, setMontoEdit] = useState("");

  function iniciarEdicion(proyecto) {
    setEditandoId(proyecto.id);
    setTituloEdit(proyecto.titulo);
    setClienteEdit(proyecto.cliente);
    setMontoEdit(proyecto.montoPago);
  }

  function guardarEdicion(id) {
    editarProyecto(id, {
      titulo: tituloEdit.trim(),
      cliente: clienteEdit.trim(),
      montoPago: Number(montoEdit)
    });
    setEditandoId(null);
  }

  return (
    <section>
      <div className="caja-filtros">
        <div className="filtros-encabezado">
          <h3>Filtrar proyectos</h3>
          <span className="etiqueta-contador">
            Mostrando {proyectos.length} de {totalProyectos}
          </span>
        </div>

        <div className="filtros-controles">
          <div>
            <label>Estado: </label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Terminado">Terminado</option>
            </select>
          </div>

          <div>
            <label>Pago: </label>
            <select value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="Impago">Impago</option>
              <option value="Con seña">Con seña</option>
              <option value="Pagado">Pagado</option>
            </select>
          </div>
        </div>
      </div>

      {cargando && <p>Cargando proyectos...</p>}

      {!cargando && proyectos.length === 0 && (
        <p>No hay proyectos para mostrar con estos filtros.</p>
      )}

      {!cargando &&
        proyectos.map((proyecto) => {
          const moneda = proyecto.moneda || "ARS";
          const estadoPago = proyecto.estadoPago || "Impago";

          return (
            <article key={proyecto.id} className="tarjeta-proyecto">
              {editandoId === proyecto.id ? (
                <div className="formulario-edicion">
                  <h4>Editando proyecto</h4>
                  <label>Título:</label>
                  <input value={tituloEdit} onChange={(e) => setTituloEdit(e.target.value)} />

                  <label>Cliente:</label>
                  <input value={clienteEdit} onChange={(e) => setClienteEdit(e.target.value)} />

                  <label>Monto:</label>
                  <input type="number" value={montoEdit} onChange={(e) => setMontoEdit(e.target.value)} />

                  <div className="botones-fila">
                    <button className="btn-exito" onClick={() => guardarEdicion(proyecto.id)}>
                      Guardar
                    </button>
                    <button className="btn-secundario" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{proyecto.titulo}</h3>
                  <p><strong>Cliente:</strong> {proyecto.cliente}</p>
                  <p><strong>Descripción:</strong> {proyecto.descripcion || "Sin descripción"}</p>
                  <p><strong>Entrega:</strong> {proyecto.fechaEntrega}</p>
                  <p><strong>Horas estimadas:</strong> {proyecto.horasEstimadas} hs</p>
                  <p><strong>Monto acordado:</strong> {formatearMoneda(proyecto.montoPago, moneda)}</p>
                  <p>
                    <strong>Pago:</strong> {estadoPago}
                    {estadoPago === "Con seña" &&
                      ` (Seña: ${formatearMoneda(proyecto.montoSena, moneda)})`}
                  </p>

                  <div className="pie-tarjeta">
                    <div>
                      <label><strong>Estado: </strong></label>
                      <select
                        value={proyecto.estadoTrabajo}
                        onChange={(e) => cambiarEstadoTrabajo(proyecto.id, e.target.value)}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En proceso">En proceso</option>
                        <option value="Terminado">Terminado</option>
                      </select>
                    </div>

                    <div className="botones-fila">
                      <button className="btn-editar" onClick={() => iniciarEdicion(proyecto)}>
                        Editar
                      </button>
                      <button className="btn-peligro" onClick={() => eliminarProyecto(proyecto.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}
    </section>
  );
}
import { useState } from "react";

export default function FormularioProyecto({ agregarProyecto, cerrarModal, mostrarError }) {
  const [titulo, setTitulo] = useState("");
  const [cliente, setCliente] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [montoPago, setMontoPago] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [horasEstimadas, setHorasEstimadas] = useState("");
  const [estadoTrabajo, setEstadoTrabajo] = useState("Pendiente");
  const [estadoPago, setEstadoPago] = useState("Impago");

  const [montoSena, setMontoSena] = useState("");
  const [fechaSena, setFechaSena] = useState("");

  const estadosTrabajoOpciones = ["Pendiente", "En proceso", "Terminado"];
  const opcionesCobro = [
    { label: "No", valor: "Impago" },
    { label: "Una seña", valor: "Con seña" },
    { label: "Pagado completo", valor: "Pagado" }
  ];

  function handleSubmit(evento) {
    evento.preventDefault();

    const tituloLimpio = titulo.trim();
    const clienteLimpio = cliente.trim();
    const descLimpia = descripcion.trim();
    const montoNumero = Number(montoPago);
    const horasNumero = Number(horasEstimadas);

    if (!tituloLimpio || !clienteLimpio || !fechaEntrega || !montoPago || !descLimpia || !horasEstimadas) {
      mostrarError("Por favor complete todos los campos vacíos.");
      return;
    }

    if (isNaN(montoNumero) || montoNumero <= 0 || isNaN(horasNumero) || horasNumero < 0) {
      mostrarError("Por favor complete todos los campos vacíos.");
      return;
    }

    let senaNumero = 0;
    if (estadoPago === "Con seña") {
      senaNumero = Number(montoSena);
      if (senaNumero <= 0 || !fechaSena) {
        mostrarError("Por favor complete todos los campos vacíos.");
        return;
      }
    }

    const nuevoProyecto = {
      titulo: tituloLimpio,
      descripcion: descLimpia,
      cliente: clienteLimpio,
      fechaEntrega: fechaEntrega,
      horasEstimadas: horasNumero,
      moneda: moneda,
      estadoTrabajo: estadoTrabajo,
      montoPago: montoNumero,
      estadoPago: estadoPago,
      conSena: estadoPago === "Con seña",
      montoSena: estadoPago === "Con seña" ? senaNumero : 0,
      fechaSena: estadoPago === "Con seña" ? fechaSena : "",
      fechaCobroPagoFinal: estadoPago === "Pagado" ? fechaEntrega : ""
    };

    agregarProyecto(nuevoProyecto);
  }

  return (
    <div className="modal-fondo" onClick={cerrarModal}>
      <div className="modal-ventana-rectangular" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera-titulo">
          <h3>Nuevo proyecto</h3>
        </div>

        <form onSubmit={handleSubmit} className="modal-formulario-dos-cols">
          <div className="modal-cuerpo-grid">
            <div className="columna-modal-izq">
              <div className="campo">
                <label>Título*</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="campo">
                <label>Cliente*</label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                />
              </div>

              <div className="fila-dos-inputs">
                <div className="campo">
                  <label>Entrega*</label>
                  <input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                  />
                </div>
                <div className="campo">
                  <label>Horas lab. estimadas*</label>
                  <input
                    type="number"
                    min="0"
                    value={horasEstimadas}
                    onChange={(e) => setHorasEstimadas(e.target.value)}
                  />
                </div>
              </div>

              <div className="campo">
                <label>Descripción*</label>
                <textarea
                  rows="3"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
            </div>

            <div className="columna-modal-der">
              <div className="campo">
                <label>Estado*</label>
                <div className="grupo-botones-segmentados">
                  {estadosTrabajoOpciones.map((estado) => (
                    <button
                      key={estado}
                      type="button"
                      className={`btn-segmento ${estadoTrabajo === estado ? "activo" : ""}`}
                      onClick={() => setEstadoTrabajo(estado)}
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              </div>

              <div className="campo">
                <label>Monto acordado*</label>
                <div className="input-grupo-moneda">
                  <select
                    className="select-moneda-pegado"
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
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
                      className={`btn-segmento ${estadoPago === op.valor ? "activo" : ""}`}
                      onClick={() => setEstadoPago(op.valor)}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              {estadoPago === "Con seña" && (
                <div className="fila-dos-inputs">
                  <div className="campo">
                    <label>Monto seña*</label>
                    <input
                      type="number"
                      min="0"
                      value={montoSena}
                      onChange={(e) => setMontoSena(e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label>Fecha de cobro de seña*</label>
                    <input
                      type="date"
                      value={fechaSena}
                      onChange={(e) => setFechaSena(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-pie-acciones">
            <button type="button" className="btn-secundario" onClick={cerrarModal}>
              <span className="material-symbols-outlined">close</span>
              Cancelar
            </button>
            <button type="submit" className="btn-primario">
              <span className="material-symbols-outlined">check</span>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useState } from "react";

export default function FormularioProyecto({ agregarProyecto, cerrarModal }) {
  // Valores iniciales por defecto
  const [titulo, setTitulo] = useState("");
  const [cliente, setCliente] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [montoPago, setMontoPago] = useState("");
  const [estadoTrabajo, setEstadoTrabajo] = useState("Pendiente");
  const [estadoPago, setEstadoPago] = useState("Impago");

  // Campos condicionales de cobro
  const [montoSena, setMontoSena] = useState("");
  const [fechaSena, setFechaSena] = useState("");
  const [fechaCobroPagoFinal, setFechaCobroPagoFinal] = useState("");

  // Sección secundaria colapsable
  const [mostrarMasDetalles, setMostrarMasDetalles] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [horasEstimadas, setHorasEstimadas] = useState("");

  // Errores por campo
  const [errores, setErrores] = useState({});

  const estadosTrabajoOpciones = ["Pendiente", "En proceso", "Terminado"];
  const opcionesCobro = [
    { label: "No", valor: "Impago" },
    { label: "Una seña", valor: "Con seña" },
    { label: "Pagado completo", valor: "Pagado" }
  ];

  function handleSubmit(evento) {
    evento.preventDefault();

    const nuevosErrores = {};
    const tituloLimpio = titulo.trim();
    const clienteLimpio = cliente.trim();
    const montoNumero = Number(montoPago);

    if (tituloLimpio === "") {
      nuevosErrores.titulo = "Ingresá un título";
    }
    if (clienteLimpio === "") {
      nuevosErrores.cliente = "Ingresá el cliente";
    }
    if (fechaEntrega === "") {
      nuevosErrores.fechaEntrega = "Elegí una fecha";
    }
    if (!montoPago || montoNumero <= 0) {
      nuevosErrores.montoPago = "Ingresá un monto mayor a 0";
    }

    let senaNumero = 0;
    if (estadoPago === "Con seña") {
      senaNumero = Number(montoSena);
      if (senaNumero <= 0 || senaNumero > montoNumero) {
        nuevosErrores.montoSena = "Monto de seña inválido";
      }
      if (fechaSena === "") {
        nuevosErrores.fechaSena = "Elegí la fecha de seña";
      }
    }

    if (estadoPago === "Pagado" && fechaCobroPagoFinal === "") {
      nuevosErrores.fechaCobroPagoFinal = "Elegí la fecha de cobro";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const nuevoProyecto = {
      titulo: tituloLimpio,
      descripcion: descripcion.trim(),
      cliente: clienteLimpio,
      fechaEntrega: fechaEntrega,
      horasEstimadas: Number(horasEstimadas) || 0,
      moneda: moneda,
      estadoTrabajo: estadoTrabajo,
      montoPago: montoNumero,
      estadoPago: estadoPago,
      conSena: estadoPago === "Con seña",
      montoSena: estadoPago === "Con seña" ? senaNumero : 0,
      fechaSena: estadoPago === "Con seña" ? fechaSena : "",
      fechaCobroPagoFinal: estadoPago === "Pagado" ? fechaCobroPagoFinal : ""
    };

    agregarProyecto(nuevoProyecto);
  }

  return (
    <div className="modal-fondo">
      <div className="modal-ventana">
        <div className="modal-cabecera">
          <h3>Nuevo proyecto</h3>
          <button
            type="button"
            className="btn-cerrar-x"
            onClick={cerrarModal}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-formulario">
          <div className="modal-cuerpo">
            {/* Título */}
            <div className="campo">
              <div className="label-con-error">
                <label>Título *</label>
                {errores.titulo && <span className="error-campo">{errores.titulo}</span>}
              </div>
              <input
                type="text"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (errores.titulo) setErrores({ ...errores, titulo: "" });
                }}
              />
            </div>

            {/* Cliente y Entrega en dos columnas */}
            <div className="fila-dos-columnas">
              <div className="campo">
                <div className="label-con-error">
                  <label>Cliente *</label>
                  {errores.cliente && <span className="error-campo">{errores.cliente}</span>}
                </div>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => {
                    setCliente(e.target.value);
                    if (errores.cliente) setErrores({ ...errores, cliente: "" });
                  }}
                />
              </div>

              <div className="campo">
                <div className="label-con-error">
                  <label>Entrega *</label>
                  {errores.fechaEntrega && <span className="error-campo">{errores.fechaEntrega}</span>}
                </div>
                <input
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => {
                    setFechaEntrega(e.target.value);
                    if (errores.fechaEntrega) setErrores({ ...errores, fechaEntrega: "" });
                  }}
                />
              </div>
            </div>

            {/* Moneda pegada al Monto */}
            <div className="campo">
              <div className="label-con-error">
                <label>Monto *</label>
                {errores.montoPago && <span className="error-campo">{errores.montoPago}</span>}
              </div>
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
                  placeholder="1000"
                  value={montoPago}
                  onChange={(e) => {
                    setMontoPago(e.target.value);
                    if (errores.montoPago) setErrores({ ...errores, montoPago: "" });
                  }}
                />
              </div>
            </div>

            {/* Estado del trabajo en botones segmentados */}
            <div className="campo">
              <label>Estado</label>
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

            {/* Cobro en botones segmentados */}
            <div className="campo">
              <label>¿Ya cobraste algo?</label>
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

            {/* Campos condicionales si eligió "Una seña" */}
            {estadoPago === "Con seña" && (
              <div className="fila-dos-columnas">
                <div className="campo">
                  <div className="label-con-error">
                    <label>Monto seña *</label>
                    {errores.montoSena && <span className="error-campo">{errores.montoSena}</span>}
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={montoSena}
                    onChange={(e) => setMontoSena(e.target.value)}
                  />
                </div>
                <div className="campo">
                  <div className="label-con-error">
                    <label>Fecha seña *</label>
                    {errores.fechaSena && <span className="error-campo">{errores.fechaSena}</span>}
                  </div>
                  <input
                    type="date"
                    value={fechaSena}
                    onChange={(e) => setFechaSena(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Campo condicional si eligió "Pagado completo" */}
            {estadoPago === "Pagado" && (
              <div className="campo">
                <div className="label-con-error">
                  <label>Fecha de cobro *</label>
                  {errores.fechaCobroPagoFinal && (
                    <span className="error-campo">{errores.fechaCobroPagoFinal}</span>
                  )}
                </div>
                <input
                  type="date"
                  value={fechaCobroPagoFinal}
                  onChange={(e) => setFechaCobroPagoFinal(e.target.value)}
                />
              </div>
            )}

            {/* Sección colapsable Más detalles */}
            <div className="seccion-mas-detalles">
              <button
                type="button"
                className="btn-toggle-detalles"
                onClick={() => setMostrarMasDetalles(!mostrarMasDetalles)}
              >
                {mostrarMasDetalles ? "− Ocultar detalles" : "+ Más detalles"}
              </button>

              {mostrarMasDetalles && (
                <div className="contenido-mas-detalles">
                  <div className="campo">
                    <label>Descripción</label>
                    <textarea
                      rows="2"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label>Horas estimadas</label>
                    <input
                      type="number"
                      min="0"
                      value={horasEstimadas}
                      onChange={(e) => setHorasEstimadas(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones fijos al pie del modal */}
          <div className="modal-pie-fijo">
            <button type="button" className="btn-secundario" onClick={cerrarModal}>
              Cancelar
            </button>
            <button type="submit" className="btn-primario">
              Guardar proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
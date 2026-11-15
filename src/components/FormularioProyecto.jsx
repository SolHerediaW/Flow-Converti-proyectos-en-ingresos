import { useState } from "react";

export default function FormularioProyecto({ agregarProyecto, mostrarError }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cliente, setCliente] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [horasEstimadas, setHorasEstimadas] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [estadoTrabajo, setEstadoTrabajo] = useState("");
  const [montoPago, setMontoPago] = useState("");
  const [estadoPago, setEstadoPago] = useState("");
  const [montoSena, setMontoSena] = useState("");
  const [fechaSena, setFechaSena] = useState("");
  const [fechaCobroPagoFinal, setFechaCobroPagoFinal] = useState("");

  function handleSubmit(evento) {
    evento.preventDefault();

    const tituloLimpio = titulo.trim();
    const clienteLimpio = cliente.trim();
    const montoNumero = Number(montoPago);

    if (
      tituloLimpio === "" ||
      clienteLimpio === "" ||
      fechaEntrega === "" ||
      estadoTrabajo === "" ||
      estadoPago === ""
    ) {
      mostrarError("Completá todos los campos obligatorios.");
      return;
    }

    if (montoNumero <= 0) {
      mostrarError("El monto acordado debe ser mayor a cero.");
      return;
    }

    let senaNumero = 0;
    if (estadoPago === "Con seña") {
      senaNumero = Number(montoSena);
      if (senaNumero <= 0 || fechaSena === "") {
        mostrarError("Ingresá un monto de seña válido y su fecha.");
        return;
      }
      if (senaNumero > montoNumero) {
        mostrarError("La seña no puede superar el monto total.");
        return;
      }
    }

    if (estadoPago === "Pagado" && fechaCobroPagoFinal === "") {
      mostrarError("Ingresá la fecha en que se cobró el pago final.");
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

    // Limpiar formulario
    setTitulo("");
    setDescripcion("");
    setCliente("");
    setFechaEntrega("");
    setHorasEstimadas("");
    setMoneda("ARS");
    setEstadoTrabajo("");
    setMontoPago("");
    setEstadoPago("");
    setMontoSena("");
    setFechaSena("");
    setFechaCobroPagoFinal("");
  }

  return (
    <form onSubmit={handleSubmit} className="formulario-caja">
      <h3>Nuevo Proyecto</h3>

      <div className="campo">
        <label>Título del proyecto:</label>
        <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>

      <div className="campo">
        <label>Descripción:</label>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </div>

      <div className="campo">
        <label>Cliente:</label>
        <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} />
      </div>

      <div className="campo">
        <label>Moneda:</label>
        <select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
          <option value="ARS">ARS ($ Pesos)</option>
          <option value="USD">USD ($ Dólares)</option>
        </select>
      </div>

      <div className="campo">
        <label>Fecha de entrega:</label>
        <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
      </div>

      <div className="campo">
        <label>Horas estimadas:</label>
        <input type="number" min="0" value={horasEstimadas} onChange={(e) => setHorasEstimadas(e.target.value)} />
      </div>

      <div className="campo">
        <label>Estado del trabajo:</label>
        <select value={estadoTrabajo} onChange={(e) => setEstadoTrabajo(e.target.value)}>
          <option value="">-- Seleccionar --</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En proceso">En proceso</option>
          <option value="Terminado">Terminado</option>
        </select>
      </div>

      <div className="campo">
        <label>Monto acordado:</label>
        <input type="number" min="0" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} />
      </div>

      <div className="campo">
        <label>Estado de pago:</label>
        <select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
          <option value="">-- Seleccionar --</option>
          <option value="Impago">Impago</option>
          <option value="Con seña">Con seña</option>
          <option value="Pagado">Pagado</option>
        </select>
      </div>

      {estadoPago === "Con seña" && (
        <>
          <div className="campo">
            <label>Monto de la seña:</label>
            <input type="number" min="0" value={montoSena} onChange={(e) => setMontoSena(e.target.value)} />
          </div>
          <div className="campo">
            <label>Fecha en que se cobró la seña:</label>
            <input type="date" value={fechaSena} onChange={(e) => setFechaSena(e.target.value)} />
          </div>
        </>
      )}

      {estadoPago === "Pagado" && (
        <div className="campo">
          <label>Fecha en que se cobró el pago final:</label>
          <input
            type="date"
            value={fechaCobroPagoFinal}
            onChange={(e) => setFechaCobroPagoFinal(e.target.value)}
          />
        </div>
      )}

      <button type="submit" className="btn-primario">Guardar Proyecto</button>
    </form>
  );
}
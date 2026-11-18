export function formatearMoneda(monto, moneda = "ARS") {
  const montoNumero = Number(monto) || 0;

  if (moneda === "USD") {
    return "USD $" + montoNumero.toLocaleString("es-AR");
  } else {
    return "$" + montoNumero.toLocaleString("es-AR");
  }
}

export function cumpleFiltroTiempo(fechaStr, filtroTiempo) {
  if (!fechaStr) {
    return false;
  }

  const fechaProyecto = new Date(fechaStr + "T00:00:00");
  const hoy = new Date();

  if (filtroTiempo === "Este mes") {
    return (
      fechaProyecto.getMonth() === hoy.getMonth() &&
      fechaProyecto.getFullYear() === hoy.getFullYear()
    );
  } else if (filtroTiempo === "Este año") {
    return fechaProyecto.getFullYear() === hoy.getFullYear();
  }

  return true;
}

export function costoCorrespondeAMes(costo, mesSeleccionado) {
  if (!costo.mesInicio) {
    return false;
  }

  if (!costo.recurrente) {
    return costo.mesInicio === mesSeleccionado;
  }

  if (mesSeleccionado < costo.mesInicio) {
    return false;
  }

  if (costo.mesFin !== "" && mesSeleccionado > costo.mesFin) {
    return false;
  }

  return true;
}

export function calcularContadoresFinancieros(proyectos, filtroTiempo) {
  let confirmadosARS = 0;
  let proyeccionARS = 0;
  let confirmadosUSD = 0;
  let proyeccionUSD = 0;

  for (const proyecto of proyectos) {
    const moneda = proyecto.moneda || "ARS";
    const montoTotal = Number(proyecto.montoPago || 0);
    const estadoPago = proyecto.estadoPago || "Impago";
    let cobrado = 0;

    if (estadoPago === "Con seña") {
      const montoSena = Number(proyecto.montoSena || 0);
      const fechaSena = proyecto.fechaSena || proyecto.fechaEntrega;

      if (cumpleFiltroTiempo(fechaSena, filtroTiempo)) {
        if (moneda === "USD") {
          confirmadosUSD = confirmadosUSD + montoSena;
        } else {
          confirmadosARS = confirmadosARS + montoSena;
        }
      }
      cobrado = montoSena;
    } else if (estadoPago === "Pagado") {
      const fechaCobro = proyecto.fechaCobroPagoFinal || proyecto.fechaEntrega;

      if (cumpleFiltroTiempo(fechaCobro, filtroTiempo)) {
        if (moneda === "USD") {
          confirmadosUSD = confirmadosUSD + montoTotal;
        } else {
          confirmadosARS = confirmadosARS + montoTotal;
        }
      }
      cobrado = montoTotal;
    }

    if (estadoPago !== "Pagado") {
      const saldoPendiente = montoTotal - cobrado;
      if (saldoPendiente > 0 && cumpleFiltroTiempo(proyecto.fechaEntrega, filtroTiempo)) {
        if (moneda === "USD") {
          proyeccionUSD = proyeccionUSD + saldoPendiente;
        } else {
          proyeccionARS = proyeccionARS + saldoPendiente;
        }
      }
    }
  }

  return {
    confirmadosARS,
    proyeccionARS,
    confirmadosUSD,
    proyeccionUSD
  };
}
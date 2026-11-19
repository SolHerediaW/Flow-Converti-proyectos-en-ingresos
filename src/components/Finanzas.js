export function formatearMoneda(monto, moneda = "ARS") {
  const montoNumero = Number(monto) || 0;

  if (moneda === "USD") {
    return "USD $" + montoNumero.toLocaleString("es-AR");
  } else {
    return "$" + montoNumero.toLocaleString("es-AR");
  }
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
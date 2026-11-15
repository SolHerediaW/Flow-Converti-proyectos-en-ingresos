import { useState } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { formatearMoneda, costoCorrespondeAMes } from "./Finanzas";

export default function RegistroFinanciero({
  proyectos,
  costos,
  setCostos,
  mostrarExito,
  mostrarError
}) {
  const hoy = new Date();
  const mesInicial = String(hoy.getMonth() + 1).padStart(2, "0");
  const [mesSeleccionado, setMesSeleccionado] = useState(`${hoy.getFullYear()}-${mesInicial}`);

  const [mostrarFormCosto, setMostrarFormCosto] = useState(false);
  const [tituloCosto, setTituloCosto] = useState("");
  const [montoCosto, setMontoCosto] = useState("");
  const [monedaCosto, setMonedaCosto] = useState("ARS");
  const [recurrente, setRecurrente] = useState(false);

  function cambiarMes(direccion) {
    const partes = mesSeleccionado.split("-");
    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const nuevaFecha = new Date(anio, mes - 1 + direccion, 1);
    const nuevoMes = String(nuevaFecha.getMonth() + 1).padStart(2, "0");
    setMesSeleccionado(`${nuevaFecha.getFullYear()}-${nuevoMes}`);
  }

  async function agregarCosto(evento) {
    evento.preventDefault();
    const tituloLimpio = tituloCosto.trim();
    const montoNumero = Number(montoCosto);

    if (tituloLimpio === "" || montoNumero <= 0) {
      mostrarError("Completá el título y un monto válido para el costo.");
      return;
    }

    try {
      const nuevoCosto = {
        titulo: tituloLimpio,
        monto: montoNumero,
        moneda: monedaCosto,
        mesInicio: mesSeleccionado,
        recurrente: recurrente,
        mesFin: ""
      };
      const docRef = await addDoc(collection(db, "costos"), nuevoCosto);
      setCostos((anteriores) => [...anteriores, { id: docRef.id, ...nuevoCosto }]);

      setTituloCosto("");
      setMontoCosto("");
      setRecurrente(false);
      setMostrarFormCosto(false);
      mostrarExito("Costo guardado correctamente.");
    } catch (err) {
      console.error(err);
      mostrarError("No se pudo guardar el costo.");
    }
  }

  async function eliminarCosto(id) {
    try {
      await deleteDoc(doc(db, "costos", id));
      setCostos((anteriores) => anteriores.filter((c) => c.id !== id));
      mostrarExito("Costo eliminado.");
    } catch (err) {
      console.error(err);
      mostrarError("No se pudo eliminar el costo.");
    }
  }

  async function darDeBajaCosto(id) {
    try {
      await updateDoc(doc(db, "costos", id), { mesFin: mesSeleccionado });
      setCostos((anteriores) =>
        anteriores.map((c) => (c.id === id ? { ...c, mesFin: mesSeleccionado } : c))
      );
      mostrarExito("Costo dado de baja a partir de este mes.");
    } catch (err) {
      console.error(err);
      mostrarError("No se pudo dar de baja el costo.");
    }
  }

  // 1. Calcular ingresos del mes seleccionado
  const ingresosDelMes = [];
  let ingresosARS = 0;
  let ingresosUSD = 0;

  for (const p of proyectos) {
    const moneda = p.moneda || "ARS";
    const montoTotal = Number(p.montoPago || 0);
    const estadoPago = p.estadoPago || "Impago";

    if (estadoPago === "Con seña") {
      const sena = Number(p.montoSena || 0);
      const fecha = p.fechaSena || p.fechaEntrega;
      if (fecha && fecha.startsWith(mesSeleccionado)) {
        ingresosDelMes.push({
          id: p.id + "-sena",
          cliente: p.cliente,
          titulo: p.titulo,
          monto: sena,
          moneda: moneda,
          tipo: "Seña",
          fecha: fecha
        });
        if (moneda === "USD") {
          ingresosUSD = ingresosUSD + sena;
        } else {
          ingresosARS = ingresosARS + sena;
        }
      }
    } else if (estadoPago === "Pagado") {
      const fecha = p.fechaCobroPagoFinal || p.fechaEntrega;
      if (fecha && fecha.startsWith(mesSeleccionado)) {
        ingresosDelMes.push({
          id: p.id + "-pago",
          cliente: p.cliente,
          titulo: p.titulo,
          monto: montoTotal,
          moneda: moneda,
          tipo: "Pago total",
          fecha: fecha
        });
        if (moneda === "USD") {
          ingresosUSD = ingresosUSD + montoTotal;
        } else {
          ingresosARS = ingresosARS + montoTotal;
        }
      }
    }
  }

  // 2. Filtrar costos del mes seleccionado
  const costosDelMes = costos.filter((c) => costoCorrespondeAMes(c, mesSeleccionado));
  let costosARS = 0;
  let costosUSD = 0;

  for (const c of costosDelMes) {
    if (c.moneda === "USD") {
      costosUSD = costosUSD + Number(c.monto || 0);
    } else {
      costosARS = costosARS + Number(c.monto || 0);
    }
  }

  // 3. Calcular proyectos terminados pendientes de cobro
  const pendientesCobro = [];
  let porCobrarARS = 0;
  let porCobrarUSD = 0;

  for (const p of proyectos) {
    if (p.estadoTrabajo === "Terminado" && p.estadoPago !== "Pagado") {
      const moneda = p.moneda || "ARS";
      const total = Number(p.montoPago || 0);
      const sena = p.estadoPago === "Con seña" ? Number(p.montoSena || 0) : 0;
      const saldo = total - sena;

      if (saldo > 0) {
        pendientesCobro.push({ ...p, saldo: saldo, moneda: moneda });
        if (moneda === "USD") {
          porCobrarUSD = porCobrarUSD + saldo;
        } else {
          porCobrarARS = porCobrarARS + saldo;
        }
      }
    }
  }

  const gananciaARS = ingresosARS - costosARS;
  const gananciaUSD = ingresosUSD - costosUSD;

  return (
    <section>
      <h2>Registro Financiero</h2>

      <div className="navegador-mes">
        <button className="btn-primario" onClick={() => cambiarMes(-1)}>◀ Anterior</button>
        <span><strong>Período:</strong> {mesSeleccionado}</span>
        <button className="btn-primario" onClick={() => cambiarMes(1)}>Siguiente ▶</button>
      </div>

      <div className="panel-contadores">
        <article className="tarjeta-contador">
          <h3>Resumen ARS</h3>
          <p><strong>Ingresos:</strong> {formatearMoneda(ingresosARS, "ARS")}</p>
          <p><strong>Costos:</strong> {formatearMoneda(costosARS, "ARS")}</p>
          <p className={gananciaARS < 0 ? "monto-rojo" : "monto-verde"}>
            <strong>Ganancia Neta:</strong> {formatearMoneda(gananciaARS, "ARS")}
          </p>
          <p><strong>Por Cobrar:</strong> {formatearMoneda(porCobrarARS, "ARS")}</p>
        </article>

        <article className="tarjeta-contador">
          <h3>Resumen USD</h3>
          <p><strong>Ingresos:</strong> {formatearMoneda(ingresosUSD, "USD")}</p>
          <p><strong>Costos:</strong> {formatearMoneda(costosUSD, "USD")}</p>
          <p className={gananciaUSD < 0 ? "monto-rojo" : "monto-verde"}>
            <strong>Ganancia Neta:</strong> {formatearMoneda(gananciaUSD, "USD")}
          </p>
          <p><strong>Por Cobrar:</strong> {formatearMoneda(porCobrarUSD, "USD")}</p>
        </article>
      </div>

      <div className="seccion-bloque">
        <h3>Ingresos del mes ({mesSeleccionado})</h3>
        {ingresosDelMes.length === 0 ? (
          <p>No hay ingresos registrados en este mes.</p>
        ) : (
          <ul>
            {ingresosDelMes.map((item) => (
              <li key={item.id}>
                <strong>{item.cliente}</strong> - {item.titulo} ({item.tipo}):{" "}
                <strong>{formatearMoneda(item.monto, item.moneda)}</strong> — {item.fecha}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="seccion-bloque">
        <div className="barra-superior">
          <h3>Costos del mes ({mesSeleccionado})</h3>
          <button
            className="btn-exito"
            onClick={() => setMostrarFormCosto(!mostrarFormCosto)}
          >
            {mostrarFormCosto ? "Cancelar" : "+ Agregar costo"}
          </button>
        </div>

        {mostrarFormCosto && (
          <form onSubmit={agregarCosto} className="formulario-caja">
            <div className="campo">
              <label>Título:</label>
              <input type="text" value={tituloCosto} onChange={(e) => setTituloCosto(e.target.value)} />
            </div>
            <div className="campo">
              <label>Monto:</label>
              <input type="number" min="0" value={montoCosto} onChange={(e) => setMontoCosto(e.target.value)} />
            </div>
            <div className="campo">
              <label>Moneda:</label>
              <select value={monedaCosto} onChange={(e) => setMonedaCosto(e.target.value)}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="campo-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={recurrente}
                  onChange={(e) => setRecurrente(e.target.checked)}
                />{" "}
                Costo recurrente mensual
              </label>
            </div>
            <button type="submit" className="btn-primario">Guardar Costo</button>
          </form>
        )}

        {costosDelMes.length === 0 ? (
          <p>No hay costos registrados para este mes.</p>
        ) : (
          <ul>
            {costosDelMes.map((c) => (
              <li key={c.id} className="item-costo">
                <span>
                  <strong>{c.titulo}</strong> - {formatearMoneda(c.monto, c.moneda)}{" "}
                  {c.recurrente && "(Recurrente)"}
                </span>
                <div className="botones-fila">
                  {c.recurrente && c.mesFin === "" && (
                    <button className="btn-editar" onClick={() => darDeBajaCosto(c.id)}>
                      Dar de baja
                    </button>
                  )}
                  <button className="btn-peligro" onClick={() => eliminarCosto(c.id)}>
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="seccion-bloque">
        <h3>Pendientes de cobro (Proyectos terminados)</h3>
        {pendientesCobro.length === 0 ? (
          <p>No hay proyectos terminados pendientes de cobro.</p>
        ) : (
          <ul>
            {pendientesCobro.map((p) => (
              <li key={p.id}>
                <strong>{p.cliente}</strong> - {p.titulo} | Saldo:{" "}
                <strong>{formatearMoneda(p.saldo, p.moneda)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
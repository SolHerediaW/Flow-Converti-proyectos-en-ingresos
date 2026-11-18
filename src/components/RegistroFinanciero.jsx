import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { formatearMoneda, costoCorrespondeAMes } from "./Finanzas";

export default function RegistroFinanciero({
  proyectos,
  costos,
  setCostos,
  registrarCobroProyecto,
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

  // Estados para DolarAPI
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargandoDolar, setCargandoDolar] = useState(true);
  const [errorDolar, setErrorDolar] = useState("");

  useEffect(() => {
    async function obtenerCotizaciones() {
      setCargandoDolar(true);
      setErrorDolar("");
      try {
        const respuesta = await fetch("https://dolarapi.com/v1/dolares");
        if (!respuesta.ok) {
          throw new Error("Error al consultar DolarAPI");
        }
        const datos = await respuesta.json();
        const relevantes = datos.filter((d) =>
          ["oficial", "blue"].includes(d.casa)
        );
        setCotizaciones(relevantes);
      } catch (err) {
        console.error(err);
        setErrorDolar("Sin cotización");
      } finally {
        setCargandoDolar(false);
      }
    }

    obtenerCotizaciones();
  }, []);

  function cambiarMes(direccion) {
    const partes = mesSeleccionado.split("-");
    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const nuevaFecha = new Date(anio, mes - 1 + direccion, 1);
    const nuevoMes = String(nuevaFecha.getMonth() + 1).padStart(2, "0");
    setMesSeleccionado(`${nuevaFecha.getFullYear()}-${nuevoMes}`);
  }

  function formatearPeriodoLegible(periodoStr) {
    const nombresMeses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const [anio, mes] = periodoStr.split("-");
    const nombreMes = nombresMeses[Number(mes) - 1] || mes;
    return `${nombreMes} - ${anio}`;
  }

  async function agregarCosto(evento) {
    evento.preventDefault();
    const tituloLimpio = tituloCosto.trim();
    const montoNumero = Number(montoCosto);

    if (tituloLimpio === "" || montoNumero <= 0) {
      mostrarError("No se pudo guardar el costo. Verificá que todos los campos obligatorios estén completos.");
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
      mostrarExito("Costo registrado.");
    } catch (err) {
      console.error(err);
      mostrarError("No se pudo guardar el costo. Verificá que todos los campos obligatorios estén completos.");
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
          ingresosUSD += sena;
        } else {
          ingresosARS += sena;
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
          ingresosUSD += montoTotal;
        } else {
          ingresosARS += montoTotal;
        }
      }
    }
  }

  // 2. Filtrar costos del mes seleccionado y separar recurrentes de puntuales
  const costosDelMes = costos.filter((c) => costoCorrespondeAMes(c, mesSeleccionado));
  const costosRecurrentes = costosDelMes.filter((c) => c.recurrente);
  const costosPuntuales = costosDelMes.filter((c) => !c.recurrente);

  let costosARS = 0;
  let costosUSD = 0;

  for (const c of costosDelMes) {
    if (c.moneda === "USD") {
      costosUSD += Number(c.monto || 0);
    } else {
      costosARS += Number(c.monto || 0);
    }
  }

  // 3. Calcular proyectos terminados pendientes de cobro (global, sin depender del mes)
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
          porCobrarUSD += saldo;
        } else {
          porCobrarARS += saldo;
        }
      }
    }
  }

  const gananciaARS = ingresosARS - costosARS;
  const gananciaUSD = ingresosUSD - costosUSD;

  return (
    <section>
      {/* Encabezado de página con DolarAPI compacto a la derecha */}
      <div className="barra-superior-financiera">
        <div>
          <h2>Registro financiero</h2>
          <p className="subtitulo-seccion">Analizá ingresos, gastos y ganancias.</p>
        </div>

        <div className="widget-dolar-compacto">
          {cargandoDolar && <span className="texto-mini">Cargando Dólar...</span>}
          {errorDolar && <span className="texto-mini">{errorDolar}</span>}
          {!cargandoDolar && !errorDolar && (
            <div className="dolar-items-fila">
              {cotizaciones.map((dolar) => (
                <div key={dolar.casa} className="dolar-pill">
                  <span className="dolar-nombre">Dólar {dolar.nombre}</span>
                  <span className="dolar-precios">
                    C: <strong>${dolar.compra}</strong> | V: <strong>${dolar.venta}</strong>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navegador de período */}
      <div className="navegador-mes">
        <button className="btn-primario" onClick={() => cambiarMes(-1)}>◀ Anterior</button>
        <span className="periodo-actual-texto">
          <strong>{formatearPeriodoLegible(mesSeleccionado)}</strong>
        </span>
        <button className="btn-primario" onClick={() => cambiarMes(1)}>Siguiente ▶</button>
      </div>

      {/* Dos tarjetas principales: Resultado del mes y Por cobrar */}
      <div className="panel-contadores">
        <article className="tarjeta-contador">
          <h3>Resultado del mes</h3>
          <div className="resultado-destacado">
            <span className="etiqueta-ganancia">Ganancia Neta</span>
            <p className="valor-ganancia-grande">
              ARS: {formatearMoneda(gananciaARS, "ARS")}
            </p>
            <p className="valor-ganancia-grande">
              USD: {formatearMoneda(gananciaUSD, "USD")}
            </p>
          </div>
          <div className="desglose-resultado">
            <p>
              <strong>Ingresos totales:</strong>{" "}
              {formatearMoneda(ingresosARS, "ARS")} | {formatearMoneda(ingresosUSD, "USD")}
            </p>
            <p>
              <strong>Costos totales:</strong>{" "}
              -{formatearMoneda(costosARS, "ARS")} | -{formatearMoneda(costosUSD, "USD")}
            </p>
          </div>
        </article>

        <article className="tarjeta-contador">
          <h3>Por cobrar</h3>
          <p className="subtitulo-tarjeta-mini">Total acumulado de proyectos terminados pendientes</p>
          <div className="resultado-destacado">
            <p className="valor-ganancia-grande">
              ARS: {formatearMoneda(porCobrarARS, "ARS")}
            </p>
            <p className="valor-ganancia-grande">
              USD: {formatearMoneda(porCobrarUSD, "USD")}
            </p>
          </div>
        </article>
      </div>

      {/* Pendientes de cobro con botón Registrar cobro */}
      <div className="seccion-bloque">
        <h3>Pendientes de cobro (Proyectos terminados)</h3>
        {pendientesCobro.length === 0 ? (
          <p>No hay proyectos terminados pendientes de cobro.</p>
        ) : (
          <ul className="lista-limpia">
            {pendientesCobro.map((p) => (
              <li key={p.id} className="item-pendiente-cobro">
                <div>
                  <strong>{p.cliente}</strong> - {p.titulo} | Saldo:{" "}
                  <strong>{formatearMoneda(p.saldo, p.moneda)}</strong>
                </div>
                <button
                  className="btn-primario"
                  onClick={() => registrarCobroProyecto(p.id)}
                >
                  Registrar cobro
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dos columnas lado a lado: Ingresos y Costos */}
      <div className="grilla-ingresos-costos">
        {/* Columna Izquierda: Ingresos */}
        <div className="seccion-bloque">
          <div className="barra-superior">
            <h3>Ingresos</h3>
          </div>
          {ingresosDelMes.length === 0 ? (
            <p>No hay ingresos registrados en este mes.</p>
          ) : (
            <ul className="lista-limpia">
              {ingresosDelMes.map((item) => (
                <li key={item.id} className="item-financiero">
                  <strong>{item.cliente}</strong> - {item.titulo} ({item.tipo}):{" "}
                  <strong>{formatearMoneda(item.monto, item.moneda)}</strong> — {item.fecha}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Columna Derecha: Costos */}
        <div className="seccion-bloque">
          <div className="barra-superior">
            <h3>Costos</h3>
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
            <p className="mensaje-vacio">
              Todavía no registraste costos para este período. Agregá servicios, suscripciones o materiales para calcular tu ganancia real.
            </p>
          ) : (
            <div>
              {costosRecurrentes.length > 0 && (
                <div className="subgrupo-costos">
                  <h4 className="subtitulo-costos">Costos recurrentes (fijos)</h4>
                  <ul className="lista-limpia">
                    {costosRecurrentes.map((c) => (
                      <li key={c.id} className="item-costo">
                        <span>
                          <strong>{c.titulo}</strong>: {formatearMoneda(c.monto, c.moneda)}
                        </span>
                        <div className="botones-fila">
                          {c.mesFin === "" && (
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
                </div>
              )}

              {costosPuntuales.length > 0 && (
                <div className="subgrupo-costos">
                  <h4 className="subtitulo-costos">Costos agregados este mes</h4>
                  <ul className="lista-limpia">
                    {costosPuntuales.map((c) => (
                      <li key={c.id} className="item-costo">
                        <span>
                          <strong>{c.titulo}</strong>: {formatearMoneda(c.monto, c.moneda)}
                        </span>
                        <div className="botones-fila">
                          <button className="btn-peligro" onClick={() => eliminarCosto(c.id)}>
                            Eliminar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
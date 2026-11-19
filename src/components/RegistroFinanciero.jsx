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

  const [editandoCosto, setEditandoCosto] = useState(null);
  const [costoAEliminar, setCostoAEliminar] = useState(null);

  const [tituloCostoEdit, setTituloCostoEdit] = useState("");
  const [montoCostoEdit, setMontoCostoEdit] = useState("");
  const [monedaCostoEdit, setMonedaCostoEdit] = useState("ARS");
  const [recurrenteEdit, setRecurrenteEdit] = useState(false);

  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargandoDolar, setCargandoDolar] = useState(true);
  const [errorDolar, setErrorDolar] = useState("");

  useEffect(() => {
    async function obtenerCotizaciones() {
      setCargandoDolar(true);
      setErrorDolar("");
      try {
        const respuesta = await fetch("https://dolarapi.com/v1/dolares");
        if (!respuesta.ok) throw new Error("Error DolarAPI");
        const datos = await respuesta.json();
        const relevantes = datos.filter((d) => ["oficial", "blue"].includes(d.casa));
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

    if (tituloLimpio === "" || !montoCosto || montoNumero <= 0) {
      mostrarError("Por favor complete todos los campos vacíos.");
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
      mostrarExito("¡Logró guardarse el costo!");
    } catch (err) {
      console.error(err);
      mostrarError("Por favor complete todos los campos vacíos.");
    }
  }

  function iniciarEdicionCosto(costo) {
    setEditandoCosto(costo);
    setTituloCostoEdit(costo.titulo || "");
    setMontoCostoEdit(costo.monto || "");
    setMonedaCostoEdit(costo.moneda || "ARS");
    setRecurrenteEdit(costo.recurrente || false);
  }

  async function guardarEdicionCosto(id) {
    if (!tituloCostoEdit.trim() || !montoCostoEdit || Number(montoCostoEdit) <= 0) {
      mostrarError("Por favor complete todos los campos vacíos.");
      return;
    }

    try {
      const datosActualizados = {
        titulo: tituloCostoEdit.trim(),
        monto: Number(montoCostoEdit),
        moneda: monedaCostoEdit,
        recurrente: recurrenteEdit
      };
      await updateDoc(doc(db, "costos", id), datosActualizados);
      setCostos((anteriores) =>
        anteriores.map((c) => (c.id === id ? { ...c, ...datosActualizados } : c))
      );
      setEditandoCosto(null);
      mostrarExito("¡Logró guardarse el costo!");
    } catch (err) {
      console.error(err);
      mostrarError("Por favor complete todos los campos vacíos.");
    }
  }

  async function eliminarCosto(id) {
    try {
      await deleteDoc(doc(db, "costos", id));
      setCostos((anteriores) => anteriores.filter((c) => c.id !== id));
      setCostoAEliminar(null);
      setEditandoCosto(null);
      mostrarExito("Tu costo se eliminó exitosamente");
    } catch (err) {
      console.error(err);
      mostrarError("No se pudo eliminar el costo.");
    }
  }

  const ingresosDelMes = [];
  let ingresosARS = 0;
  let ingresosUSD = 0;

  for (const p of proyectos) {
    const moneda = p.moneda || "ARS";
    const montoTotal = Number(p.montoPago || 0);
    const estadoPago = p.estadoPago || "Impago";
    const estadoTrabajo = p.estadoTrabajo || "Pendiente";

    if (estadoTrabajo === "Terminado") {
      const fecha = p.fechaCobroPagoFinal || p.fechaEntrega;
      if (fecha && fecha.startsWith(mesSeleccionado)) {
        // Evitamos duplicar si ya se sumó por seña, tomamos el monto total del proyecto terminado
        // O simplemente sumamos el monto total directamente:
        ingresosDelMes.push({
          id: p.id + "-terminado",
          cliente: p.cliente,
          titulo: p.titulo,
          monto: montoTotal,
          moneda: moneda,
          tipo: "Terminado",
          fecha: fecha
        });
        if (moneda === "USD") ingresosUSD += montoTotal;
        else ingresosARS += montoTotal;
      }
    }
  }

  const costosDelMes = costos.filter((c) => costoCorrespondeAMes(c, mesSeleccionado));
  const costosRecurrentes = costosDelMes.filter((c) => c.recurrente);
  const costosPuntuales = costosDelMes.filter((c) => !c.recurrente);

  let costosARS = 0;
  let costosUSD = 0;

  for (const c of costosDelMes) {
    if (c.moneda === "USD") costosUSD += Number(c.monto || 0);
    else costosARS += Number(c.monto || 0);
  }

  const porCobrarProyectos = [];

  for (const p of proyectos) {
    if (p.estadoTrabajo === "Terminado" && p.estadoPago !== "Pagado") {
      const moneda = p.moneda || "ARS";
      const total = Number(p.montoPago || 0);
      const sena = p.estadoPago === "Con seña" ? Number(p.montoSena || 0) : 0;
      const saldo = total - sena;

      if (saldo > 0) {
        porCobrarProyectos.push({ ...p, saldo: saldo, moneda: moneda });
      }
    }
  }

  const gananciaARS = ingresosARS - costosARS;
  const gananciaUSD = ingresosUSD - costosUSD;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="barra-superior-financiera">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icono-vista-circulo financiero">
            <span className="material-symbols-outlined">bar_chart</span>
          </div>
          <div className="textos-vista-titulo">
            <h2>Registro financiero</h2>
            <p>Analizá ingresos, gastos y ganancias</p>
          </div>
        </div>

        <div className="widget-dolar-compacto">
          {cargandoDolar && <span style={{ fontSize: '12px' }}>Cargando Dólar...</span>}
          {errorDolar && <span style={{ fontSize: '12px' }}>{errorDolar}</span>}
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

      <div className="navegador-mes">
        <button className="btn-secundario" onClick={() => cambiarMes(-1)} title="Anterior">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="periodo-actual-texto">
          <strong>{formatearPeriodoLegible(mesSeleccionado)}</strong>
        </span>
        <button className="btn-secundario" onClick={() => cambiarMes(1)} title="Siguiente">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div className="panel-contadores-financieros">
        <article className="tarjeta-resumen-fin">
          <div className="fila-ganancia-top">
            <span className="valor-ganancia-grande">{formatearMoneda(gananciaARS, "ARS")}</span>
            <span className="valor-ganancia-grande">{formatearMoneda(gananciaUSD, "USD")}</span>
          </div>
          <p className="subtitulo-ganancia-blanco">Ganancia Neta</p>
          <div className="linea-gruesa-financiera"></div>
          <div className="desglose-resultado">
            <p>Ingresos totales: {formatearMoneda(ingresosARS, "ARS")} | {formatearMoneda(ingresosUSD, "USD")}</p>
            <p>Costos totales: -{formatearMoneda(costosARS, "ARS")} | -{formatearMoneda(costosUSD, "USD")}</p>
          </div>
        </article>

        <article className="tarjeta-resumen-fin">
          <div className="fila-por-cobrar-top">
            <h3>Por cobrar</h3>
            <span className="subtitulo-derecha-chico">Proyectos terminados cuyo cobro no ha sido registrado</span>
          </div>
          <div className="linea-gruesa-financiera"></div>

          {porCobrarProyectos.length === 0 ? (
            <p style={{ color: '#9D9D9D', fontSize: '13px', marginTop: '8px' }}>No hay proyectos terminados pendientes de cobro.</p>
          ) : (
            <ul className="lista-limpia" style={{ marginTop: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              {porCobrarProyectos.map((p, idx) => (
                <div key={p.id}>
                  <li className="item-fila-financiera">
                    <div>
                      <strong style={{ display: 'block', color: '#FFFFFF' }}>{p.titulo}</strong>
                      <span style={{ fontSize: '11px', color: '#9D9D9D' }}>{p.cliente}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#9D9D9D', display: 'block' }}>Entrega</span>
                      <span style={{ fontSize: '12px', color: '#E0E0E0' }}>{p.fechaEntrega}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#FFFFFF' }}>{formatearMoneda(p.saldo, p.moneda)}</strong>
                    </div>
                    <button
                      className="btn-primario"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                      onClick={() => registrarCobroProyecto(p.id)}
                    >
                      Registrar cobro
                    </button>
                  </li>
                  {idx < porCobrarProyectos.length - 1 && <div className="linea-fina-financiera"></div>}
                </div>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="grilla-ingresos-costos">
        <div className="seccion-bloque">
          <h3>Ingresos</h3>
          <div className="linea-gruesa-financiera"></div>

          {ingresosDelMes.length === 0 ? (
            <p style={{ color: '#9D9D9D', fontSize: '13px' }}>Todavía no registraste ingresos para este período.</p>
          ) : (
            <ul className="lista-limpia">
              {ingresosDelMes.map((item, idx) => (
                <div key={item.id}>
                  <li className="item-fila-financiera">
                    <div>
                      <strong style={{ display: 'block', color: '#FFFFFF' }}>{item.titulo}</strong>
                      <span style={{ fontSize: '11px', color: '#9D9D9D' }}>{item.cliente}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#9D9D9D', display: 'block' }}>Fecha</span>
                      <span style={{ fontSize: '12px', color: '#E0E0E0' }}>{item.fecha}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#2ECC71' }}>+{formatearMoneda(item.monto, item.moneda)}</strong>
                    </div>
                  </li>
                  {idx < ingresosDelMes.length - 1 && <div className="linea-fina-financiera"></div>}
                </div>
              ))}
            </ul>
          )}
        </div>

        <div className="seccion-bloque">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Costos</h3>
            <button
              className="btn-primario"
              onClick={() => setMostrarFormCosto(true)}
            >
              <span className="material-symbols-outlined">add</span>
              Agregar costo
            </button>
          </div>
          <div className="linea-gruesa-financiera"></div>

          {costosDelMes.length === 0 ? (
            <p style={{ color: '#9D9D9D', fontSize: '13px' }}>Todavía no registraste costos para este período.</p>
          ) : (
            <div>
              {costosRecurrentes.length > 0 && (
                <div className="subgrupo-costos">
                  <h4 className="subtitulo-costos">Costos recurrentes (fijos)</h4>
                  <ul className="lista-limpia">
                    {costosRecurrentes.map((c, idx) => (
                      <div key={c.id}>
                        <li className="item-fila-financiera">
                          <div>
                            <strong style={{ display: 'block', color: '#FFFFFF' }}>{c.titulo}</strong>
                            <span style={{ fontSize: '11px', color: '#9D9D9D' }}>Recurrente mensual</span>
                          </div>
                          <div>
                            <strong style={{ color: '#FFB3B3' }}>-{formatearMoneda(c.monto, c.moneda)}</strong>
                          </div>
                          <button
                            type="button"
                            className="btn-editar-icono"
                            onClick={() => iniciarEdicionCosto(c)}
                            title="Editar costo"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                          </button>
                        </li>
                        {idx < costosRecurrentes.length - 1 && <div className="linea-fina-financiera"></div>}
                      </div>
                    ))}
                  </ul>
                </div>
              )}

              {costosPuntuales.length > 0 && (
                <div className="subgrupo-costos">
                  <h4 className="subtitulo-costos">Costos agregados este mes</h4>
                  <ul className="lista-limpia">
                    {costosPuntuales.map((c, idx) => (
                      <div key={c.id}>
                        <li className="item-fila-financiera">
                          <div>
                            <strong style={{ display: 'block', color: '#FFFFFF' }}>{c.titulo}</strong>
                            <span style={{ fontSize: '11px', color: '#9D9D9D' }}>Puntual</span>
                          </div>
                          <div>
                            <strong style={{ color: '#FFB3B3' }}>-{formatearMoneda(c.monto, c.moneda)}</strong>
                          </div>
                          <button
                            type="button"
                            className="btn-editar-icono"
                            onClick={() => iniciarEdicionCosto(c)}
                            title="Editar costo"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                          </button>
                        </li>
                        {idx < costosPuntuales.length - 1 && <div className="linea-fina-financiera"></div>}
                      </div>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Costo */}
      {mostrarFormCosto && (
        <div className="modal-fondo" onClick={() => setMostrarFormCosto(false)}>
          <div className="modal-ventana-rectangular" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecera-titulo">
              <h3>Nuevo costo</h3>
            </div>
            <form onSubmit={agregarCosto} className="modal-formulario-dos-cols">
              <div className="modal-cuerpo-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="campo">
                  <label>Título*</label>
                  <input type="text" value={tituloCosto} onChange={(e) => setTituloCosto(e.target.value)} />
                </div>
                <div className="campo">
                  <label>Monto a pagar*</label>
                  <div className="input-grupo-moneda">
                    <select
                      className="select-moneda-pegado"
                      value={monedaCosto}
                      onChange={(e) => setMonedaCosto(e.target.value)}
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={montoCosto}
                      onChange={(e) => setMontoCosto(e.target.value)}
                    />
                  </div>
                </div>
                <div className="campo" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    checked={recurrente}
                    onChange={(e) => setRecurrente(e.target.checked)}
                  />
                  <label style={{ cursor: 'pointer', margin: 0 }}>Costo recurrente mensual</label>
                </div>
              </div>
              <div className="modal-pie-acciones">
                <button type="button" className="btn-secundario" onClick={() => setMostrarFormCosto(false)}>
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
      )}

      {/* Modal Editar Costo */}
      {editandoCosto && (
        <div className="modal-fondo" onClick={() => setEditandoCosto(null)}>
          <div className="modal-ventana-rectangular" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecera-titulo">
              <h3>Editar costo</h3>
            </div>
            <div className="modal-formulario-dos-cols">
              <div className="modal-cuerpo-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="campo">
                  <label>Título*</label>
                  <input type="text" value={tituloCostoEdit} onChange={(e) => setTituloCostoEdit(e.target.value)} />
                </div>
                <div className="campo">
                  <label>Monto a pagar*</label>
                  <div className="input-grupo-moneda">
                    <select
                      className="select-moneda-pegado"
                      value={monedaCostoEdit}
                      onChange={(e) => setMonedaCostoEdit(e.target.value)}
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={montoCostoEdit}
                      onChange={(e) => setMontoCostoEdit(e.target.value)}
                    />
                  </div>
                </div>
                <div className="campo" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    checked={recurrenteEdit}
                    onChange={(e) => setRecurrenteEdit(e.target.checked)}
                  />
                  <label style={{ cursor: 'pointer', margin: 0 }}>Costo recurrente mensual</label>
                </div>
              </div>
              <div className="modal-pie-acciones">
                <button
                  type="button"
                  className="btn-peligro"
                  onClick={() => setCostoAEliminar(editandoCosto)}
                >
                  <span className="material-symbols-outlined">delete</span>
                  Eliminar
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-secundario" onClick={() => setEditandoCosto(null)}>
                    <span className="material-symbols-outlined">close</span>
                    Cancelar
                  </button>
                  <button type="button" className="btn-primario" onClick={() => guardarEdicionCosto(editandoCosto.id)}>
                    <span className="material-symbols-outlined">check</span>
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar costo */}
      {costoAEliminar && (
        <div className="modal-fondo">
          <div className="modal-confirmacion-contenido">
            <h3>¿Desea eliminar el costo?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div className="modal-confirmacion-botones">
              <button
                type="button"
                className="btn-secundario"
                onClick={() => setCostoAEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-peligro"
                onClick={() => eliminarCosto(costoAEliminar.id)}
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
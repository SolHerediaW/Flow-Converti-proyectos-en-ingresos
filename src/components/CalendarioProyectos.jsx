import { useState } from "react";

export default function CalendarioProyectos({ proyectos }) {
  const [fechaActual, setFechaActual] = useState(new Date());

  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  function cambiarMes(direccion) {
    setFechaActual(new Date(anio, mes + direccion, 1));
  }

  const primerDiaMes = new Date(anio, mes, 1).getDay();
  const totalDiasMes = new Date(anio, mes + 1, 0).getDate();

  const diasSemana = ["D", "L", "M", "M", "X", "V", "S"];

  const celdas = [];
  for (let i = 0; i < primerDiaMes; i++) {
    celdas.push({ tipo: "vacia", id: `vacia-${i}` });
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const mesStr = String(mes + 1).padStart(2, "0");
    const diaStr = String(dia).padStart(2, "0");
    const fechaIso = `${anio}-${mesStr}-${diaStr}`;

    const proyectosDelDia = proyectos.filter((p) => p.fechaEntrega === fechaIso);

    celdas.push({
      tipo: "dia",
      numero: dia,
      fecha: fechaIso,
      proyectos: proyectosDelDia,
      id: `dia-${dia}`
    });
  }

  const hoyIso = new Date().toISOString().split("T")[0];
  const esMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  return (
    <div>
      <div className="calendario-controles-barra">
        <button className="btn-secundario" onClick={() => cambiarMes(-1)} title="Anterior">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="calendario-mes-label">
          <strong>{nombresMeses[mes]} {anio}</strong>
        </span>
        <button className="btn-secundario" onClick={() => cambiarMes(1)} title="Siguiente">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div className="calendario-grilla">
        {diasSemana.map((d, index) => (
          <div key={index} className="calendario-cabecera-dia">
            {d}
          </div>
        ))}

        {celdas.map((celda) => {
          if (celda.tipo === "vacia") {
            return <div key={celda.id} className="calendario-celda vacia"></div>;
          }

          const esHoy = celda.fecha === hoyIso;

          return (
            <div key={celda.id} className={`calendario-celda ${esHoy ? "hoy" : ""}`}>
              <span className="calendario-numero-dia">{celda.numero}</span>
              
              {esMobile ? (
                /* Versión Mobile: Solo líneas de colores */
                <div className="calendario-barras-eventos" style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                  {celda.proyectos.map((p) => {
                    const estadoClase = (p.estadoTrabajo || "Pendiente").toLowerCase().replace(/\s+/g, "-");
                    return (
                      <div
                        key={p.id}
                        className={`calendario-barra-color ${estadoClase}`}
                        style={{
                          height: '5px',
                          borderRadius: '3px',
                          width: '100%',
                          backgroundColor:
                            estadoClase === 'terminado'
                              ? '#2ECC71'
                              : estadoClase === 'en-proceso'
                              ? '#F4C95D'
                              : '#4B7BEC'
                        }}
                        title={`${p.titulo} (${p.estadoTrabajo})`}
                      ></div>
                    );
                  })}
                </div>
              ) : (
                /* Versión Desktop: Etiquetas con título y cliente */
                <div className="calendario-eventos" style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                  {celda.proyectos.map((p) => {
                    const estadoClase = (p.estadoTrabajo || "Pendiente").toLowerCase().replace(/\s+/g, "-");
                    return (
                      <div
                        key={p.id}
                        className={`calendario-evento-item estado-${estadoClase}`}
                        style={{
                          padding: '3px 6px',
                          fontSize: '10px',
                          borderRadius: '6px',
                          backgroundColor:
                            estadoClase === 'terminado'
                              ? 'rgba(46, 204, 113, 0.25)'
                              : estadoClase === 'en-proceso'
                              ? 'rgba(244, 201, 93, 0.25)'
                              : 'rgba(75, 123, 236, 0.25)',
                          borderLeft: `3px solid ${
                            estadoClase === 'terminado'
                              ? '#2ECC71'
                              : estadoClase === 'en-proceso'
                              ? '#F4C95D'
                              : '#4B7BEC'
                          }`,
                          color: '#FFFFFF'
                        }}
                      >
                        <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.titulo}
                        </strong>
                        <span style={{ fontSize: '9px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.cliente}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
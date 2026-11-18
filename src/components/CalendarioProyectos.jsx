import { useState } from "react";

export default function CalendarioProyectos({ proyectos }) {
  const hoy = new Date();
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());
  const [mesActual, setMesActual] = useState(hoy.getMonth());

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  function cambiarMes(direccion) {
    const nuevaFecha = new Date(anioActual, mesActual + direccion, 1);
    setAnioActual(nuevaFecha.getFullYear());
    setMesActual(nuevaFecha.getMonth());
  }

  function volverAHoy() {
    setAnioActual(hoy.getFullYear());
    setMesActual(hoy.getMonth());
  }

  const primerDiaSemana = new Date(anioActual, mesActual, 1).getDay();
  const totalDiasMes = new Date(anioActual, mesActual + 1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) {
    celdas.push(null);
  }
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    celdas.push(dia);
  }

  const mesFormateado = String(mesActual + 1).padStart(2, "0");
  const prefijoMes = `${anioActual}-${mesFormateado}`;

  function obtenerProyectosDelDia(dia) {
    if (!dia) return [];
    const diaFormateado = String(dia).padStart(2, "0");
    const fechaBuscada = `${prefijoMes}-${diaFormateado}`;
    return proyectos.filter((p) => p.fechaEntrega === fechaBuscada);
  }

  const esMesActualReal =
    anioActual === hoy.getFullYear() && mesActual === hoy.getMonth();

  return (
    <div className="calendario-contenedor">
      <div className="calendario-controles-barra">
        <strong className="calendario-mes-label">
          {nombresMeses[mesActual]} - {anioActual}
        </strong>
        <div className="botones-fila">
          <button className="btn-secundario" onClick={() => cambiarMes(-1)}>
            ◀ Anterior
          </button>
          <button className="btn-secundario" onClick={volverAHoy}>
            Hoy
          </button>
          <button className="btn-secundario" onClick={() => cambiarMes(1)}>
            Siguiente ▶
          </button>
        </div>
      </div>

      <div className="calendario-grilla">
        {diasSemana.map((nombreDia) => (
          <div key={nombreDia} className="calendario-cabecera-dia">
            {nombreDia}
          </div>
        ))}

        {celdas.map((dia, index) => {
          const proyectosDia = obtenerProyectosDelDia(dia);
          const esHoy = esMesActualReal && dia === hoy.getDate();

          return (
            <div
              key={index}
              className={`calendario-celda ${!dia ? "vacia" : ""} ${
                esHoy ? "hoy" : ""
              }`}
            >
              {dia && (
                <>
                  <span className="calendario-numero-dia">{dia}</span>
                  <div className="calendario-eventos">
                    {proyectosDia.map((p) => (
                      <div
                        key={p.id}
                        className={`calendario-evento-item estado-${p.estadoTrabajo
                          ?.toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        title={`${p.titulo} - Cliente: ${p.cliente} (${p.estadoTrabajo})`}
                      >
                        <strong>{p.titulo}</strong>
                        <span>{p.cliente}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
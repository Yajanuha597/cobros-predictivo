export enum NivelRiesgo {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO',
}

export const DESCRIPCION_REGLAS_NIVEL_RIESGO =
  'Reglas de clasificacion definidas para el prototipo CobrosPredictivo.';

export function clasificarRiesgo(diasAtraso: number): NivelRiesgo {
  if (diasAtraso <= 0) {
    return NivelRiesgo.BAJO;
  }

  if (diasAtraso <= 30) {
    return NivelRiesgo.MEDIO;
  }

  if (diasAtraso <= 90) {
    return NivelRiesgo.ALTO;
  }

  return NivelRiesgo.CRITICO;
}

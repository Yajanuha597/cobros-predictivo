import { clasificarRiesgo, NivelRiesgo } from './nivel-riesgo';

describe('clasificarRiesgo', () => {
  it('clasifica 0 dias de atraso como BAJO', () => {
    expect(clasificarRiesgo(0)).toBe(NivelRiesgo.BAJO);
  });

  it('clasifica valores negativos como BAJO', () => {
    expect(clasificarRiesgo(-1)).toBe(NivelRiesgo.BAJO);
  });

  it('clasifica 1 dia de atraso como MEDIO', () => {
    expect(clasificarRiesgo(1)).toBe(NivelRiesgo.MEDIO);
  });

  it('clasifica 30 dias de atraso como MEDIO', () => {
    expect(clasificarRiesgo(30)).toBe(NivelRiesgo.MEDIO);
  });

  it('clasifica 31 dias de atraso como ALTO', () => {
    expect(clasificarRiesgo(31)).toBe(NivelRiesgo.ALTO);
  });

  it('clasifica 90 dias de atraso como ALTO', () => {
    expect(clasificarRiesgo(90)).toBe(NivelRiesgo.ALTO);
  });

  it('clasifica 91 dias de atraso como CRITICO', () => {
    expect(clasificarRiesgo(91)).toBe(NivelRiesgo.CRITICO);
  });
});

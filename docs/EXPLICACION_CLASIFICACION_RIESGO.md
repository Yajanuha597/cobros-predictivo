# Explicacion de clasificacion de riesgo

Este documento explica la clasificacion del nivel de riesgo agregada al backend NestJS para el prototipo COBROS-PREDICTIVO.

La regla se identifica expresamente como:

```text
Reglas de clasificación definidas para el prototipo CobrosPredictivo.
```

No debe presentarse como una norma bancaria universal ni como regulacion oficial. Es una regla operativa del prototipo para permitir que n8n reciba una decision ya calculada por el backend.

## 1. Que significa riesgo de mora

El riesgo de mora representa una estimacion operativa del nivel de atencion que requiere una cuota segun sus dias de atraso.

No significa automaticamente que el socio no vaya a pagar. En esta etapa solo ayuda a ordenar la gestion de cobranza y a preparar automatizaciones futuras.

## 2. Diferencia entre diasAtraso y nivelRiesgo

`diasAtraso` es un valor numerico.

Ejemplo:

```text
diasAtraso = 35
```

Indica cuantos dias han pasado desde la fecha de vencimiento de la cuota.

`nivelRiesgo` es una categoria calculada a partir de ese numero.

Ejemplo:

```text
nivelRiesgo = ALTO
```

En resumen:

```text
diasAtraso -> numero
nivelRiesgo -> categoria
```

## 3. Que significa BAJO

`BAJO` representa una cuota sin atraso.

En el prototipo incluye:

- cuotas con `0` dias de atraso;
- cuotas pendientes que vencen manana.

Una cuota que vence manana no esta en mora. Se clasifica como `BAJO` porque corresponde a gestion preventiva.

## 4. Que significa MEDIO

`MEDIO` representa atraso inicial.

Rango:

```text
1 a 30 dias de atraso
```

Este nivel permite identificar cuotas que ya vencieron, pero que aun estan dentro de un rango temprano para acciones de recordatorio.

## 5. Que significa ALTO

`ALTO` representa atraso importante dentro del prototipo.

Rango:

```text
31 a 90 dias de atraso
```

Este nivel indica que la cuota ya tiene una mora considerable y puede requerir una gestion mas insistente.

## 6. Que significa CRITICO

`CRITICO` representa el escalamiento maximo dentro del sistema disenado para el prototipo.

Rango:

```text
mas de 90 dias de atraso
```

No significa que se haya iniciado una accion juridica. Solo indica que, dentro del modelo del prototipo, es el nivel mas alto de atencion.

## 7. Rangos utilizados

Los rangos definidos son:

| diasAtraso        | nivelRiesgo |
| ----------------- | ----------- |
| menor o igual a 0 | BAJO        |
| 1 a 30            | MEDIO       |
| 31 a 90           | ALTO        |
| mayor a 90        | CRITICO     |

Los limites son cerrados donde corresponde:

- `30` pertenece a `MEDIO`;
- `31` pertenece a `ALTO`;
- `90` pertenece a `ALTO`;
- `91` pertenece a `CRITICO`.

## 8. Por que son reglas del prototipo

Estas reglas son una decision tecnica para el prototipo COBROS-PREDICTIVO.

Sirven para:

- validar el flujo backend -> n8n;
- preparar futuras ramas de automatizacion;
- mantener la logica de negocio en NestJS;
- probar escenarios con datos controlados.

No deben confundirse con una politica final de la cooperativa ni con una norma bancaria universal.

## 9. Por que mayor a 90 se escala a CRITICO

En el levantamiento del proyecto se identifico que la cooperativa considera una cartera de alto riesgo cuando una cuota no ha sido pagada despues de 90 dias desde su vencimiento.

El prototipo utiliza cuatro categorias:

```text
BAJO
MEDIO
ALTO
CRITICO
```

Por eso, dentro del prototipo:

```text
31 a 90 dias -> ALTO
mas de 90 dias -> CRITICO
```

`CRITICO` representa el escalamiento maximo del sistema disenado. Esta decision no oculta el dato del cuestionario; lo adapta a una clasificacion de cuatro niveles.

## 10. Diferencia con el dato del cuestionario

El cuestionario usa el termino "alto riesgo" para hablar de cuotas impagas despues de 90 dias.

El prototipo usa `ALTO` y `CRITICO` como categorias internas.

La diferencia es semantica:

```text
Cuestionario:
despues de 90 dias -> alto riesgo para la cooperativa

Prototipo:
31 a 90 dias -> ALTO
mas de 90 dias -> CRITICO
```

Esto permite una lectura mas granular para futuras automatizaciones.

## 11. Por que una cuota que vence manana es BAJO

Una cuota que vence manana todavia no esta atrasada.

El endpoint la incluye porque sirve para gestion preventiva.

En ese caso:

```text
tipoGestion = VENCE_MANANA
diasAtraso = 0
nivelRiesgo = BAJO
```

Esto no significa mora. Significa recordatorio anticipado.

## 12. Por que nivelRiesgo se calcula dinamicamente

`nivelRiesgo` depende de `diasAtraso`.

`diasAtraso` depende de:

```text
fecha actual - fechaVencimiento
```

Como la fecha actual cambia todos los dias, el riesgo tambien puede cambiar.

Ejemplo:

```text
Hoy: 30 dias -> MEDIO
Manana: 31 dias -> ALTO
```

Por eso conviene calcularlo al consultar, no guardarlo como dato fijo.

## 13. Por que no se guarda necesariamente en PostgreSQL

No se agrego una columna `nivelRiesgo` en PostgreSQL.

Motivos:

- es un dato derivado;
- puede quedar desactualizado;
- depende del dia de consulta;
- se evita modificar el esquema mientras `synchronize: true` esta activo;
- se reduce el riesgo de inconsistencias.

La base conserva los datos base:

```text
fechaVencimiento
estado
saldoPendiente
```

NestJS calcula el resultado operativo.

## 14. Como NestJS realiza la clasificacion

El backend calcula primero `diasAtraso`.

Luego llama a una funcion centralizada:

```text
clasificarRiesgo(diasAtraso)
```

La funcion devuelve un valor del enum:

```text
NivelRiesgo.BAJO
NivelRiesgo.MEDIO
NivelRiesgo.ALTO
NivelRiesgo.CRITICO
```

La logica vive en:

```text
backend/src/cuotas/riesgo/nivel-riesgo.ts
```

El endpoint que la expone es:

```text
GET /cuotas/gestion-cobranza
```

## 15. Como llegara el resultado a n8n

n8n consulta:

```text
GET http://backend:3000/cuotas/gestion-cobranza
```

Cada item de la respuesta incluye:

```json
{
  "tipoGestion": "VENCIDA",
  "diasAtraso": 35,
  "nivelRiesgo": "ALTO"
}
```

n8n no necesita recalcular rangos. Solo consume `nivelRiesgo`.

## 16. Por que NestJS clasifica y n8n no

NestJS debe concentrar la logica de negocio.

n8n debe encargarse de orquestar automatizaciones.

Si n8n repitiera reglas como:

```text
if diasAtraso > 30
if diasAtraso <= 90
```

la logica quedaria duplicada.

Eso generaria problemas:

- cambios en rangos en mas de un lugar;
- riesgo de inconsistencias;
- workflows mas dificiles de mantener;
- menor control desde el backend.

La separacion correcta para este prototipo es:

```text
NestJS = logica de negocio
n8n = orquestacion
```

## 17. Flujo completo

El flujo tecnico es:

```text
Cuota
  |
  v
fechaVencimiento
  |
  v
calcular diasAtraso
  |
  v
clasificarRiesgo
  |
  v
nivelRiesgo
  |
  v
HTTP Response
  |
  v
n8n
  |
  v
futuro Switch
```

## 18. Ejemplos actuales

Con los datos de prueba actuales:

```text
Cuota 1
0 dias
BAJO
```

```text
Cuota 2
5 dias
MEDIO
```

```text
Cuota 3
35 dias
ALTO
```

Ejemplo conceptual futuro:

```text
100 dias
CRITICO
```

## 19. Futuro flujo n8n

Despues de esta tarea, el workflow podra continuar asi:

```text
Schedule Trigger
       |
       v
HTTP Request
       |
       v
IF
       |
       v
Split Out
       |
       v
Switch por nivelRiesgo
 |-- BAJO
 |-- MEDIO
 |-- ALTO
 |-- CRITICO
```

El Switch no se crea en esta tarea. Primero se valida que el backend entregue `nivelRiesgo` correctamente.

## 20. Preguntas de defensa

### 1. Que es el riesgo de mora?

Respuesta correcta: es una categoria operativa que indica el nivel de atencion que requiere una cuota segun sus dias de atraso.

Explicacion sencilla: mientras mas dias pasan despues del vencimiento, mayor atencion necesita la cuota.

### 2. Como calcula el sistema los dias de atraso?

Respuesta correcta: compara la fecha actual con la fecha de vencimiento de la cuota.

Explicacion sencilla: si la cuota vencio hace 5 dias, `diasAtraso` vale 5.

### 3. Que diferencia existe entre diasAtraso y nivelRiesgo?

Respuesta correcta: `diasAtraso` es un numero y `nivelRiesgo` es una categoria calculada.

Explicacion sencilla: 35 es el numero; ALTO es la interpretacion.

### 4. Cuales son los cuatro niveles?

Respuesta correcta: BAJO, MEDIO, ALTO y CRITICO.

Explicacion sencilla: son los cuatro grupos usados por el prototipo.

### 5. Por que se utilizaron rangos?

Respuesta correcta: para convertir dias de atraso en categorias faciles de usar por el sistema.

Explicacion sencilla: n8n puede decidir por categoria sin hacer calculos.

### 6. Son normas oficiales?

Respuesta correcta: no, son reglas de clasificacion definidas para el prototipo CobrosPredictivo.

Explicacion sencilla: sirven para probar el sistema, no son una norma bancaria universal.

### 7. Que ocurre con 0 dias?

Respuesta correcta: se clasifica como BAJO.

Explicacion sencilla: no hay atraso; si vence manana, es gestion preventiva.

### 8. Que ocurre con 30 dias?

Respuesta correcta: se clasifica como MEDIO.

Explicacion sencilla: el rango MEDIO llega hasta 30 dias.

### 9. Que ocurre con 31 dias?

Respuesta correcta: se clasifica como ALTO.

Explicacion sencilla: desde 31 dias empieza el rango ALTO.

### 10. Que ocurre con 90 dias?

Respuesta correcta: se clasifica como ALTO.

Explicacion sencilla: el rango ALTO incluye hasta 90 dias.

### 11. Que ocurre con 91 dias?

Respuesta correcta: se clasifica como CRITICO.

Explicacion sencilla: mas de 90 dias sube al nivel maximo del prototipo.

### 12. Por que no se almacena necesariamente nivelRiesgo?

Respuesta correcta: porque es un dato derivado que puede cambiar con el tiempo.

Explicacion sencilla: hoy una cuota puede ser MEDIO y manana ALTO.

### 13. Por que NestJS clasifica y n8n no?

Respuesta correcta: porque NestJS concentra la logica de negocio y n8n orquesta automatizaciones.

Explicacion sencilla: asi no repetimos reglas en varios lugares.

### 14. Que funcion tendra posteriormente Switch?

Respuesta correcta: separar el flujo de n8n segun `nivelRiesgo`.

Explicacion sencilla: cada nivel podria tener una accion diferente.

### 15. Que representa CRITICO?

Respuesta correcta: el escalamiento maximo dentro del prototipo.

Explicacion sencilla: significa que la cuota paso de 90 dias de atraso.

### 16. Como se relaciona esto con el cuestionario de la cooperativa?

Respuesta correcta: el cuestionario habla de alto riesgo despues de 90 dias, mientras el prototipo usa CRITICO para ese tramo.

Explicacion sencilla: el prototipo agrega una categoria mas para diferenciar mejor los casos.

### 17. Por que una cuota que vence manana es BAJO?

Respuesta correcta: porque todavia no esta vencida y tiene `diasAtraso = 0`.

Explicacion sencilla: es un recordatorio preventivo, no una mora.

### 18. Donde esta la funcion de clasificacion?

Respuesta correcta: en `backend/src/cuotas/riesgo/nivel-riesgo.ts`.

Explicacion sencilla: existe un solo archivo principal para cambiar los rangos.

### 19. Por que se creo un enum?

Respuesta correcta: para evitar strings repetidos y mantener valores tipados.

Explicacion sencilla: el codigo usa `NivelRiesgo.ALTO` en vez de escribir "ALTO" a mano en varios lugares.

### 20. Que se debe probar despues?

Respuesta correcta: el Switch futuro de n8n y las acciones asociadas a cada nivel.

Explicacion sencilla: primero se valido que el backend entregue la categoria; luego se automatizan decisiones.

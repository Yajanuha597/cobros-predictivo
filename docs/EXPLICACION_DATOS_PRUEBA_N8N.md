# Explicacion de datos de prueba para n8n

Este documento explica los datos controlados creados para probar el workflow:

```text
CobrosPredictivo - Gestion automatica de cuotas
```

La prueba se preparo para validar la rama TRUE del nodo IF de n8n:

```text
{{ $json.cuotas.length }} > 0
```

No se implemento clasificacion de riesgo, correo, WhatsApp, pagos, cobros ni nuevos nodos de n8n.

## 1. Por que necesitamos datos de prueba

El endpoint:

```text
GET /cuotas/gestion-cobranza
```

devuelve cuotas pendientes que vencen manana y cuotas vencidas. Si la base de datos esta vacia, el endpoint responde correctamente, pero devuelve:

```json
{
  "cuotas": []
}
```

Eso sirve para probar la rama FALSE del IF, pero no sirve para probar la rama TRUE. Para probar la rama TRUE necesitamos que la API devuelva al menos una cuota real que cumpla las condiciones.

Por eso se crearon datos controlados:

- un cliente ficticio;
- un prestamo ficticio;
- cuatro cuotas con escenarios especificos.

## 2. Por que no debemos probar automatizaciones solo con arrays vacios

Un array vacio prueba una situacion valida:

```text
No hay cuotas para gestionar.
```

Pero una automatizacion de cobranza tambien debe probar:

- que existen datos;
- que los datos llegan con la estructura correcta;
- que n8n puede leer `cuotas.length`;
- que n8n puede acceder a cuota, prestamo y cliente;
- que una cuota pagada queda fuera;
- que `diasAtraso` se calcula bien.

Si solo probamos con arrays vacios, el workflow parece estable, pero todavia no sabemos si funcionara cuando existan cuotas reales para gestionar.

## 3. Cliente de prueba creado

Se creo durante esta prueba un cliente claramente ficticio:

```text
id: 1
nombres: Cliente Prueba
apellidos: Cobros Predictivo
identificacion: PRUEBA-N8N-001
email: cliente.prueba.n8n@example.com
telefono: 0999990001
direccion: Direccion de prueba para n8n
estado: activo
```

Este cliente no representa a una persona real. Es un dato de laboratorio para validar el flujo.

## 4. Prestamo de prueba creado

Se creo durante esta prueba un prestamo asociado al cliente de prueba:

```text
id: 1
clienteId: 1
monto: 1000
fechaInicio: 2026-08-07
numeroCuotas: 4
estado: ACTIVO
```

Este prestamo permite asociar las cuatro cuotas de prueba.

## 5. Cuotas creadas

La fecha de referencia que devolvio el backend fue:

```text
fechaReferencia: 2026-08-07
fechaManana: 2026-08-08
```

Con esa referencia se crearon cuatro cuotas.

### Cuota A: vence manana

```text
id: 1
numeroCuota: 1
fechaVencimiento: 2026-08-08
monto: 250
saldoPendiente: 250
estado: PENDIENTE
```

Resultado esperado:

```text
Debe aparecer en /cuotas/gestion-cobranza.
diasAtraso = 0.
tipoGestion = VENCE_MANANA.
```

### Cuota B: vencida hace 5 dias

```text
id: 2
numeroCuota: 2
fechaVencimiento: 2026-08-02
monto: 250
saldoPendiente: 250
estado: PENDIENTE
```

Resultado esperado:

```text
Debe aparecer en /cuotas/gestion-cobranza.
diasAtraso = 5.
tipoGestion = VENCIDA.
```

### Cuota C: vencida hace 35 dias

```text
id: 3
numeroCuota: 3
fechaVencimiento: 2026-07-03
monto: 250
saldoPendiente: 250
estado: VENCIDA
```

Resultado esperado:

```text
Debe aparecer en /cuotas/gestion-cobranza.
diasAtraso = 35.
tipoGestion = VENCIDA.
```

### Cuota D: pagada

```text
id: 4
numeroCuota: 4
fechaVencimiento: 2026-07-28
monto: 250
saldoPendiente: 0
estado: PAGADA
```

Resultado esperado:

```text
NO debe aparecer en /cuotas/gestion-cobranza.
```

## 6. Que representa cada escenario

### Escenario A

Representa el recordatorio preventivo. La cuota vence manana, por eso n8n podria enviar un recordatorio antes del vencimiento en una etapa posterior.

### Escenario B

Representa una cuota recientemente vencida. Sirve para probar que `diasAtraso` se calcula y que el sistema detecta atraso corto.

### Escenario C

Representa una cuota con atraso mayor. Todavia no clasificamos riesgo, pero este dato servira despues para diferenciar casos mas urgentes.

### Escenario D

Representa una cuota pagada. Aunque su fecha ya paso, no debe procesarse porque ya no requiere cobranza.

## 7. Como funcionan las relaciones

El modelo queda asi:

```text
Cliente
  |
  | 1:N
  v
Prestamo
  |
  | 1:N
  v
Cuota
```

En PostgreSQL:

```text
prestamos.cliente_id -> clientes.id
cuotas.prestamo_id -> prestamos.id
```

En esta prueba:

```text
Cliente 1
  |
  v
Prestamo 1
  |
  v
Cuotas 1, 2, 3, 4
```

La API confirma:

```text
cuotas.prestamoId = 1
cuotas.prestamo.id = 1
cuotas.prestamo.cliente.id = 1
```

## 8. Como se calcula diasAtraso

`diasAtraso` no se guarda en base de datos.

Se calcula dinamicamente en el backend usando:

```text
fechaReferencia - fechaVencimiento
```

Ejemplos de esta prueba:

```text
fechaReferencia: 2026-08-07
Cuota B: 2026-08-02 -> diasAtraso = 5
Cuota C: 2026-07-03 -> diasAtraso = 35
Cuota A: 2026-08-08 -> diasAtraso = 0
```

Si una cuota vence manana, no tiene atraso, por eso `diasAtraso` es `0`.

## 9. Por que una cuota PAGADA no aparece

El endpoint de gestion de cobranza esta pensado para cuotas que requieren accion.

Una cuota `PAGADA` no requiere recordatorio ni cobranza. Por eso queda excluida aunque su fecha de vencimiento este en el pasado.

Esto evita que n8n procese cuotas que ya fueron resueltas.

## 10. Como n8n obtiene estos datos

n8n no consulta PostgreSQL directamente.

n8n llama al backend NestJS:

```text
GET http://backend:3000/cuotas/gestion-cobranza
```

El backend:

1. consulta cuotas;
2. carga prestamo y cliente;
3. calcula `diasAtraso`;
4. devuelve JSON listo para que n8n lo procese.

Flujo:

```text
n8n
  |
  v
HTTP Request
  |
  v
NestJS Backend
  |
  v
CuotasService
  |
  v
TypeORM
  |
  v
PostgreSQL
```

## 11. Que esperamos que ocurra en el IF

La respuesta actual tiene:

```text
cuotas.length = 3
```

Por tanto:

```text
{{ $json.cuotas.length }} > 0
```

debe evaluar:

```text
TRUE
```

Eso permite probar la rama TRUE del workflow.

## 12. Que vamos a probar despues

Despues de revisar estos datos, el siguiente paso sera configurar los nodos posteriores en n8n.

Todavia no se debe conectar:

- correo;
- WhatsApp;
- clasificacion de riesgo;
- pagos;
- cobros reales.

Primero hay que comprobar que n8n lee correctamente los items de `cuotas`.

## 13. Datos reales, datos de prueba y datos simulados

### Datos reales

Son datos de clientes y operaciones verdaderas de la cooperativa.

Ejemplo:

```text
Un socio real con su prestamo real y cuotas reales.
```

No deben usarse para pruebas iniciales porque podrian activar procesos equivocados o exponer informacion personal.

### Datos de prueba

Son datos guardados en la base de datos, pero creados de manera controlada y ficticia.

Ejemplo:

```text
Cliente Prueba Cobros Predictivo
```

Estos datos pasan por la API real, DTOs reales, services reales, TypeORM real y PostgreSQL real.

Son ideales para probar integraciones.

### Datos simulados

Son datos inventados en memoria o escritos a mano sin pasar por la base real.

Ejemplo:

```json
{
  "cuotas": []
}
```

Sirven para disenar una idea, pero no validan que el sistema real funcione.

## 14. Por que usamos datos de prueba controlados antes de correo o WhatsApp

Correo y WhatsApp son canales externos. Si se conectan demasiado pronto, podemos:

- enviar mensajes por error;
- usar datos equivocados;
- probar con informacion real sin querer;
- generar ruido en una automatizacion aun incompleta.

Los datos de prueba controlados permiten validar primero:

- API;
- relaciones;
- fechas;
- dias de atraso;
- respuesta JSON;
- condicion IF de n8n.

Cuando eso funciona, recien tiene sentido avanzar a notificaciones.

## 15. Explicacion DevOps

### Donde esta PostgreSQL

PostgreSQL esta ejecutandose en Docker como:

```text
cobros_postgres
```

### Por que esta dentro de Docker

Docker permite levantar PostgreSQL con la misma configuracion en local o servidor, sin instalar PostgreSQL manualmente en el sistema operativo.

### Que volumen conserva los datos

El volumen configurado es:

```text
postgres_data
```

Ese volumen guarda los datos aunque se recree el contenedor.

### Como backend llega a PostgreSQL

El backend usa variables de entorno:

```text
DB_HOST=postgres
DB_PORT=5432
```

Dentro de Docker, `postgres` es el nombre del servicio y funciona como hostname.

### Como n8n llega a backend

n8n llama:

```text
http://backend:3000
```

`backend` es el nombre del servicio dentro de la red Docker.

### Por que n8n no utiliza localhost

Dentro del contenedor n8n, `localhost` significa el propio contenedor n8n, no el backend.

Por eso debe usar:

```text
http://backend:3000
```

### Que funcion tiene cobros_network

`cobros_network` es la red Docker compartida.

Permite que estos servicios se resuelvan por nombre:

```text
n8n -> backend
backend -> postgres
```

## 16. Preguntas de defensa

### 1. Por que se utilizaron datos de prueba?

Respuesta correcta: para validar el flujo real sin usar informacion personal ni datos productivos.

Explicacion sencilla: necesitamos probar la automatizacion con datos que parezcan reales, pero que sean ficticios y controlados.

### 2. Por que una cuota pagada no se procesa?

Respuesta correcta: porque no requiere cobranza.

Explicacion sencilla: si ya esta pagada, n8n no debe enviar recordatorios.

### 3. Que significa diasAtraso?

Respuesta correcta: es la cantidad de dias entre la fecha de vencimiento y la fecha actual cuando la cuota ya vencio.

Explicacion sencilla: si vencio hace 5 dias, `diasAtraso` es 5.

### 4. Como se relaciona una cuota con un prestamo?

Respuesta correcta: mediante `cuotas.prestamo_id`.

Explicacion sencilla: cada cuota guarda el id del prestamo al que pertenece.

### 5. Como sabe n8n que cuotas procesar?

Respuesta correcta: consulta el endpoint `/cuotas/gestion-cobranza`.

Explicacion sencilla: el backend ya filtra cuotas vencidas o que vencen manana.

### 6. Por que n8n consulta NestJS y no PostgreSQL directamente?

Respuesta correcta: porque NestJS centraliza la logica de negocio y entrega una respuesta preparada.

Explicacion sencilla: n8n no necesita saber SQL ni reglas internas de la base.

### 7. Que ocurre si no hay cuotas?

Respuesta correcta: el endpoint devuelve `cuotas: []`.

Explicacion sencilla: el IF de n8n evalua FALSE.

### 8. Que ocurre si `cuotas.length > 0`?

Respuesta correcta: el IF de n8n evalua TRUE.

Explicacion sencilla: el workflow puede continuar por la rama de procesamiento.

### 9. Por que se creo una cuota que vence manana?

Respuesta correcta: para probar recordatorio preventivo 24 horas antes.

Explicacion sencilla: el sistema debe poder avisar antes de que exista atraso.

### 10. Por que se creo una cuota vencida hace 35 dias?

Respuesta correcta: para probar un caso de atraso mayor.

Explicacion sencilla: despues servira para clasificar riesgo, aunque todavia no se implemento.

### 11. Por que no se implemento clasificacion de riesgo?

Respuesta correcta: porque esta tarea solo prepara datos de prueba.

Explicacion sencilla: primero validamos datos y flujo TRUE; despues vendran las reglas.

### 12. Por que se uso la API REST para crear datos?

Respuesta correcta: para validar DTOs, controllers, services, repositories y TypeORM.

Explicacion sencilla: asi probamos el camino real de la aplicacion.

### 13. Por que no se uso informacion personal real?

Respuesta correcta: por seguridad y privacidad.

Explicacion sencilla: en pruebas no debemos exponer ni procesar datos reales.

### 14. Que valida esta prueba respecto a relaciones?

Respuesta correcta: valida Cliente -> Prestamo -> Cuotas.

Explicacion sencilla: las cuotas apuntan al prestamo correcto y el prestamo apunta al cliente correcto.

### 15. Que se debe probar despues?

Respuesta correcta: los nodos siguientes de n8n para procesar cada cuota.

Explicacion sencilla: ahora que el IF puede ser TRUE, podemos construir la siguiente parte del workflow.

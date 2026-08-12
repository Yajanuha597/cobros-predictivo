# Explicacion del modulo Cuotas

Este documento explica el modulo `Cuotas` implementado en el backend de CobrosPredictivo. La explicacion esta basada en el codigo real agregado en:

- `backend/src/cuotas/`
- `backend/src/prestamos/entities/prestamo.entity.ts`
- `backend/src/app.module.ts`

No se implementaron pagos, cobros, correo, WhatsApp, notificaciones reales, clasificacion de riesgo ni nodos de n8n en esta etapa.

## 1. Problema que estamos solucionando

El proyecto ya tenia:

```text
Cliente
  |
  | 1:N
  v
Prestamo
```

Pero un prestamo necesita dividirse en cuotas para que el sistema pueda saber:

- que cuota vence;
- cuando vence;
- cuanto debe pagar el cliente;
- cuanto saldo queda pendiente;
- si la cuota esta pendiente, pagada o vencida.

Con este modulo ahora tenemos:

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

Esto prepara el camino para que mas adelante n8n consulte cuotas proximas o vencidas y active un flujo de cobranza automatica.

## 2. Estructura creada

Se creo esta estructura:

```text
backend/src/cuotas/
|-- dto/
|   |-- create-cuota.dto.ts
|   `-- update-cuota.dto.ts
|-- entities/
|   `-- cuota.entity.ts
|-- repositories/
|   `-- cuota.repository.ts
|-- cuotas.controller.ts
|-- cuotas.service.ts
`-- cuotas.module.ts
```

### `cuotas.module.ts`

Agrupa el modulo `Cuotas` para que NestJS lo pueda cargar.

Registra:

- `Cuota`, entidad nueva.
- `Prestamo`, porque una cuota pertenece a un prestamo.
- `CuotasController`, que expone endpoints HTTP.
- `CuotasService`, que contiene la logica.
- `CuotaRepository`, que consulta la tabla `cuotas`.
- `PrestamoRepository`, que valida que el prestamo exista.

### `cuotas.controller.ts`

Expone los endpoints:

- `GET /cuotas`
- `GET /cuotas/gestion-cobranza`
- `GET /cuotas/:id`
- `POST /cuotas`
- `PATCH /cuotas/:id`
- `DELETE /cuotas/:id`

Importante: `GET /cuotas/gestion-cobranza` esta definido antes de `GET /cuotas/:id` para que NestJS no interprete `gestion-cobranza` como si fuera un id.

### `cuotas.service.ts`

Contiene la logica de negocio:

- crear cuotas;
- listar cuotas;
- buscar cuotas por id;
- actualizar cuotas;
- eliminar cuotas;
- validar que el prestamo exista;
- validar que `saldoPendiente` no sea mayor que `monto`;
- consultar cuotas para gestion de cobranza;
- calcular `diasAtraso` dinamicamente.

### `cuota.repository.ts`

Encapsula el uso de TypeORM:

- `repository.find()`
- `repository.findOne()`
- `repository.create()`
- `repository.merge()`
- `repository.save()`
- `repository.remove()`

Tambien consulta relaciones:

```text
Cuota -> Prestamo -> Cliente
```

### `cuota.entity.ts`

Define la tabla `cuotas`, sus columnas y la relacion con `Prestamo`.

### `create-cuota.dto.ts`

Define que datos se aceptan para crear una cuota.

### `update-cuota.dto.ts`

Define que datos se aceptan para actualizar una cuota.

## 3. Entity: `cuota.entity.ts`

Codigo real:

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Prestamo } from "../../prestamos/entities/prestamo.entity";

export const CUOTA_ESTADOS = ["PENDIENTE", "PAGADA", "VENCIDA"] as const;
export type CuotaEstado = (typeof CUOTA_ESTADOS)[number];

@Entity("cuotas")
export class Cuota {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "prestamo_id" })
  prestamoId!: number;

  @ManyToOne(() => Prestamo, (prestamo) => prestamo.cuotas, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "prestamo_id" })
  prestamo!: Prestamo;

  @Column({ name: "numero_cuota", type: "int" })
  numeroCuota!: number;

  @Column({ name: "fecha_vencimiento", type: "date" })
  fechaVencimiento!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  monto!: number;

  @Column({ name: "saldo_pendiente", type: "numeric", precision: 12, scale: 2 })
  saldoPendiente!: number;

  @Column({ length: 30, default: "PENDIENTE" })
  estado!: CuotaEstado;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
```

### Imports de TypeORM

```ts
import { ... } from 'typeorm';
```

Estos decoradores le dicen a TypeORM como convertir una clase TypeScript en una tabla PostgreSQL.

### `Column`

Sirve para declarar columnas normales.

Ejemplo:

```ts
@Column({ name: 'fecha_vencimiento', type: 'date' })
fechaVencimiento!: string;
```

### `CreateDateColumn`

Crea automaticamente la fecha de creacion.

### `Entity`

Marca la clase como tabla de base de datos.

### `JoinColumn`

Define el nombre de la columna que guarda la clave foranea.

### `ManyToOne`

Declara que muchas cuotas pertenecen a un prestamo.

### `PrimaryGeneratedColumn`

Crea una clave primaria autoincremental.

### `UpdateDateColumn`

Actualiza automaticamente la fecha de ultima modificacion.

### Import de `Prestamo`

```ts
import { Prestamo } from "../../prestamos/entities/prestamo.entity";
```

Se necesita porque la cuota debe pertenecer a un prestamo.

### `CUOTA_ESTADOS`

```ts
export const CUOTA_ESTADOS = ["PENDIENTE", "PAGADA", "VENCIDA"] as const;
```

Define los estados validos de una cuota:

- `PENDIENTE`
- `PAGADA`
- `VENCIDA`

Se uso una solucion simple y coherente con el proyecto: texto validado por DTO. No se creo un enum de PostgreSQL porque el proyecto actual usa campos `estado` simples como texto o booleano.

### `CuotaEstado`

```ts
export type CuotaEstado = (typeof CUOTA_ESTADOS)[number];
```

Crea un tipo TypeScript basado en los valores de `CUOTA_ESTADOS`.

### `@Entity('cuotas')`

```ts
@Entity('cuotas')
```

Indica que esta clase representa la tabla `cuotas`.

### `id`

```ts
@PrimaryGeneratedColumn()
id!: number;
```

Es la clave primaria. PostgreSQL genera automaticamente el valor.

### `prestamoId`

```ts
@Column({ name: 'prestamo_id' })
prestamoId!: number;
```

Guarda el id del prestamo al que pertenece la cuota.

En TypeScript se llama `prestamoId`. En PostgreSQL se guarda como `prestamo_id`.

### Relacion `prestamo`

```ts
@ManyToOne(() => Prestamo, (prestamo) => prestamo.cuotas, {
  nullable: false,
  onDelete: 'RESTRICT',
})
@JoinColumn({ name: 'prestamo_id' })
prestamo!: Prestamo;
```

Esto dice:

- una cuota pertenece a un prestamo;
- `nullable: false`: no puede existir una cuota sin prestamo;
- `onDelete: 'RESTRICT'`: no se permite borrar automaticamente un prestamo si tiene cuotas;
- `JoinColumn`: la FK esta en `prestamo_id`.

### `numeroCuota`

```ts
@Column({ name: 'numero_cuota', type: 'int' })
numeroCuota!: number;
```

Guarda el numero de cuota. Ejemplo: cuota 1, cuota 2, cuota 3.

### `fechaVencimiento`

```ts
@Column({ name: 'fecha_vencimiento', type: 'date' })
fechaVencimiento!: string;
```

Guarda la fecha de vencimiento de la cuota.

Este campo permite calcular despues si la cuota:

- vence manana;
- ya esta vencida;
- cuantos dias de atraso tiene.

### `monto`

```ts
@Column({ type: 'numeric', precision: 12, scale: 2 })
monto!: number;
```

Guarda el valor de la cuota.

- `numeric`: decimal en PostgreSQL.
- `precision: 12`: hasta 12 digitos.
- `scale: 2`: hasta 2 decimales.

### `saldoPendiente`

```ts
@Column({ name: 'saldo_pendiente', type: 'numeric', precision: 12, scale: 2 })
saldoPendiente!: number;
```

Guarda cuanto falta pagar de esa cuota.

Puede ser:

- igual al monto si no se ha pagado nada;
- menor al monto si hubo un abono parcial en el futuro;
- cero si luego se implementa pagos y queda pagada.

En esta etapa no se implementa pagos.

### `estado`

```ts
@Column({ length: 30, default: 'PENDIENTE' })
estado!: CuotaEstado;
```

Guarda el estado de la cuota. Si no se envia estado, queda `PENDIENTE`.

Estados permitidos:

- `PENDIENTE`
- `PAGADA`
- `VENCIDA`

### `createdAt`

```ts
@CreateDateColumn({ name: 'created_at' })
createdAt!: Date;
```

Fecha de creacion automatica.

### `updatedAt`

```ts
@UpdateDateColumn({ name: 'updated_at' })
updatedAt!: Date;
```

Fecha de actualizacion automatica.

## 4. Relacion Cliente -> Prestamo -> Cuota

El modelo ahora queda asi:

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

### Ejemplo

Cliente:

```text
Juan Perez
```

Prestamo:

```text
$1.000
```

Cuotas:

```text
Cuota 1: $333.33
Cuota 2: $333.33
Cuota 3: $333.34
```

### Donde quedan las FK en PostgreSQL

En la tabla `prestamos` queda:

```text
cliente_id
```

Esto relaciona:

```text
Prestamo -> Cliente
```

En la tabla `cuotas` queda:

```text
prestamo_id
```

Esto relaciona:

```text
Cuota -> Prestamo
```

Ejemplo conceptual:

Tabla `clientes`:

```text
id | nombres | apellidos
1  | Juan    | Perez
```

Tabla `prestamos`:

```text
id | cliente_id | monto
1  | 1          | 1000.00
```

Tabla `cuotas`:

```text
id | prestamo_id | numero_cuota | monto  | fecha_vencimiento
1  | 1           | 1            | 333.33 | 2026-09-07
2  | 1           | 2            | 333.33 | 2026-10-07
3  | 1           | 3            | 333.34 | 2026-11-07
```

Asi PostgreSQL sabe:

- la cuota pertenece al prestamo `1`;
- el prestamo `1` pertenece al cliente `1`;
- por lo tanto, la cuota pertenece indirectamente a Juan Perez.

## 5. DTOs

DTO significa `Data Transfer Object`.

Un DTO define que datos acepta el backend desde una peticion HTTP.

### `CreateCuotaDto`

Campos que recibe:

```ts
prestamoId!: number;
numeroCuota!: number;
fechaVencimiento!: string;
monto!: number;
saldoPendiente!: number;
estado?: CuotaEstado;
```

Validaciones:

- `prestamoId`: entero mayor o igual a 1.
- `numeroCuota`: entero mayor o igual a 1.
- `fechaVencimiento`: fecha valida.
- `monto`: numero mayor o igual a 0.01, maximo 2 decimales.
- `saldoPendiente`: numero mayor o igual a 0, maximo 2 decimales.
- `estado`: opcional, pero si se envia debe ser `PENDIENTE`, `PAGADA` o `VENCIDA`.

### `UpdateCuotaDto`

Tiene los mismos campos, pero todos son opcionales.

Esto permite actualizar solo una parte de la cuota.

Ejemplo:

```json
{
  "estado": "VENCIDA"
}
```

### Por que existen

Existen para:

- evitar datos mal formados;
- validar campos antes de llegar a la base de datos;
- mantener el controller limpio;
- documentar que espera recibir el backend.

## 6. Controller

Archivo: `backend/src/cuotas/cuotas.controller.ts`

### `@Controller('cuotas')`

Define la ruta base:

```text
/cuotas
```

### `GET /cuotas`

```ts
@Get()
findAll() {
  return this.cuotasService.findAll();
}
```

Lista todas las cuotas.

### `GET /cuotas/gestion-cobranza`

```ts
@Get('gestion-cobranza')
findGestionCobranza() {
  return this.cuotasService.findGestionCobranza();
}
```

Devuelve cuotas que n8n podra procesar despues.

Busca:

- cuotas que vencen manana;
- cuotas vencidas.

No envia correos, no llama n8n y no cambia datos.

### `GET /cuotas/:id`

```ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.cuotasService.findOne(id);
}
```

Busca una cuota por id.

### `POST /cuotas`

```ts
@Post()
create(@Body() body: CreateCuotaDto) {
  return this.cuotasService.create(body);
}
```

Crea una cuota.

### `PATCH /cuotas/:id`

```ts
@Patch(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: UpdateCuotaDto,
) {
  return this.cuotasService.update(id, body);
}
```

Actualiza parcialmente una cuota.

### `DELETE /cuotas/:id`

```ts
@Delete(':id')
remove(@Param('id', ParseIntPipe) id: number) {
  return this.cuotasService.remove(id);
}
```

Elimina una cuota.

## 7. Service

Archivo: `backend/src/cuotas/cuotas.service.ts`

### Constantes

```ts
const TIMEZONE = "America/Guayaquil";
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
```

`TIMEZONE` se usa para calcular la fecha actual segun Ecuador.

`MILLISECONDS_PER_DAY` se usa para calcular diferencia de dias.

### Constructor

```ts
constructor(
  private readonly cuotaRepository: CuotaRepository,
  private readonly prestamoRepository: PrestamoRepository,
) {}
```

El service usa:

- `CuotaRepository`: para trabajar con cuotas.
- `PrestamoRepository`: para comprobar que el prestamo exista.

### `findAll()`

Lista todas las cuotas.

Devuelve:

```json
{
  "success": true,
  "message": "Cuotas obtenidas correctamente",
  "cuotas": []
}
```

### `findOne(id)`

Busca una cuota por id.

Si no existe, lanza:

```text
Cuota no encontrada
```

### `findGestionCobranza()`

Este es el metodo pensado para n8n en una etapa posterior.

Hace esto:

1. Calcula la fecha actual en `America/Guayaquil`.
2. Calcula la fecha de manana.
3. Busca cuotas vencidas y cuotas que vencen manana.
4. Convierte cada cuota en una respuesta limpia para n8n.
5. Calcula `diasAtraso` dinamicamente.

No modifica la base de datos.

### `create(data)`

Flujo:

1. Valida que `saldoPendiente` no sea mayor que `monto`.
2. Extrae `prestamoId`.
3. Busca el prestamo.
4. Si el prestamo no existe, responde `Prestamo no encontrado`.
5. Crea la cuota.
6. Guarda la cuota.

### `update(id, data)`

Flujo:

1. Busca la cuota.
2. Si llega `prestamoId`, valida que ese prestamo exista.
3. Calcula el monto efectivo y saldo pendiente efectivo.
4. Valida que el saldo no supere el monto.
5. Mezcla los cambios.
6. Guarda.

### `remove(id)`

Busca la cuota y la elimina.

### `findCuotaById(id)`

Funcion privada para evitar repetir:

```text
si no existe cuota -> Cuota no encontrada
```

### `findPrestamoById(id)`

Funcion privada para evitar crear cuotas asociadas a prestamos inexistentes.

### `validateSaldoPendiente(monto, saldoPendiente)`

Evita un dato financiero inconsistente.

No permite:

```text
saldoPendiente > monto
```

Ejemplo invalido:

```json
{
  "monto": 100,
  "saldoPendiente": 150
}
```

### `toGestionCobranzaItem(cuota, today, tomorrow)`

Transforma una entidad `Cuota` completa en un objeto pensado para n8n.

Devuelve:

- datos de la cuota;
- datos del prestamo;
- datos del cliente;
- `tipoGestion`;
- `diasAtraso`.

### `calculateDiasAtraso(fechaVencimiento, today)`

Calcula los dias de atraso sin guardarlos en base de datos.

Ejemplo:

```text
fecha actual: 2026-08-10
fecha vencimiento: 2026-08-05
diasAtraso: 5
```

Si la cuota vence manana, devuelve `0`.

### Por que `diasAtraso` no se guarda como columna

Porque es un dato derivado.

Si hoy una cuota tiene 1 dia de atraso, manana tendra 2. Si se guardara en una columna, podria quedar desactualizado.

Por eso se calcula dinamicamente con:

```text
fecha actual - fecha vencimiento
```

## 8. Repository

Archivo: `backend/src/cuotas/repositories/cuota.repository.ts`

### `findAll()`

Usa:

```ts
repository.find();
```

Tambien trae relaciones:

```ts
relations: {
  prestamo: {
    cliente: true,
  },
}
```

Esto significa:

```text
Cuota -> Prestamo -> Cliente
```

### `findById(id)`

Busca una cuota por id y tambien trae prestamo y cliente.

### `findForGestionCobranza(today, tomorrow)`

Consulta cuotas para cobranza.

Condiciones:

1. Cuotas con estado `PENDIENTE` o `VENCIDA` cuya `fechaVencimiento` sea menor que hoy.
2. Cuotas `PENDIENTE` cuya `fechaVencimiento` sea manana.

No trae cuotas `PAGADA`.

### `create(data, prestamo)`

Crea un objeto cuota en memoria.

Si no llega estado, usa:

```text
PENDIENTE
```

### `merge(cuota, data, prestamo?)`

Combina la cuota existente con los cambios.

Si se envia un nuevo prestamo, actualiza la relacion.

### `save(cuota)`

Guarda en PostgreSQL.

### `delete(cuota)`

Elimina la cuota usando `repository.remove()`.

## 9. Endpoint para n8n

Se implemento:

```text
GET /cuotas/gestion-cobranza
```

URL interna futura desde n8n:

```text
http://backend:3000/cuotas/gestion-cobranza
```

### Que consulta

Consulta cuotas:

- vencidas;
- pendientes que vencen manana.

### Que devuelve

Devuelve informacion suficiente para que n8n pueda decidir que hacer despues:

- cuota;
- prestamo;
- cliente;
- identificacion;
- nombres;
- apellidos;
- email;
- telefono;
- numero de cuota;
- fecha de vencimiento;
- monto;
- saldo pendiente;
- estado;
- dias de atraso.

### Que NO hace todavia

No hace:

- envio de correos;
- envio de WhatsApp;
- clasificacion de riesgo;
- cambios de estado;
- registro de cobros;
- registro de pagos;
- ejecucion de workflow n8n.

### Flujo futuro

```text
n8n
 |
 v
HTTP Request
 |
 v
NestJS
 |
 v
CuotasService
 |
 v
TypeORM
 |
 v
PostgreSQL
 |
 v
Cuota + Prestamo + Cliente
 |
 v
respuesta JSON
 |
 v
n8n
```

## 10. Ejemplos Postman

Base local:

```text
http://localhost:3000
```

### Crear cuota

Metodo:

```text
POST
```

URL:

```text
http://localhost:3000/cuotas
```

Body:

```json
{
  "prestamoId": 1,
  "numeroCuota": 1,
  "fechaVencimiento": "2026-09-07",
  "monto": 333.33,
  "saldoPendiente": 333.33,
  "estado": "PENDIENTE"
}
```

Respuesta esperada si el prestamo existe:

```json
{
  "success": true,
  "message": "Cuota creada correctamente",
  "cuota": {}
}
```

Si el prestamo no existe:

```text
Prestamo no encontrado
```

### Listar cuotas

Metodo:

```text
GET
```

URL:

```text
http://localhost:3000/cuotas
```

Respuesta esperada:

```json
{
  "success": true,
  "message": "Cuotas obtenidas correctamente",
  "cuotas": []
}
```

### Obtener una cuota

Metodo:

```text
GET
```

URL:

```text
http://localhost:3000/cuotas/1
```

Respuesta esperada si existe:

```json
{
  "success": true,
  "message": "Cuota obtenida correctamente",
  "cuota": {}
}
```

### Actualizar una cuota

Metodo:

```text
PATCH
```

URL:

```text
http://localhost:3000/cuotas/1
```

Body:

```json
{
  "saldoPendiente": 200
}
```

Respuesta esperada:

```json
{
  "success": true,
  "message": "Cuota actualizada correctamente",
  "cuota": {}
}
```

### Eliminar una cuota

Metodo:

```text
DELETE
```

URL:

```text
http://localhost:3000/cuotas/1
```

Respuesta esperada:

```json
{
  "success": true,
  "message": "Cuota eliminada correctamente"
}
```

### Gestion de cobranza

Metodo:

```text
GET
```

URL:

```text
http://localhost:3000/cuotas/gestion-cobranza
```

Respuesta esperada:

```json
{
  "success": true,
  "message": "Cuotas para gestion de cobranza obtenidas correctamente",
  "fechaReferencia": "2026-08-07",
  "fechaManana": "2026-08-08",
  "cuotas": []
}
```

## 11. Ejemplo de datos conceptual

No insertar estos datos manualmente; es solo un ejemplo.

Cliente:

```text
Juan Perez
```

Prestamo:

```text
$1.000
```

Tres cuotas:

```text
Cuota 1
prestamo_id: 1
numero_cuota: 1
fecha_vencimiento: 2026-09-07
monto: 333.33
saldo_pendiente: 333.33
estado: PENDIENTE

Cuota 2
prestamo_id: 1
numero_cuota: 2
fecha_vencimiento: 2026-10-07
monto: 333.33
saldo_pendiente: 333.33
estado: PENDIENTE

Cuota 3
prestamo_id: 1
numero_cuota: 3
fecha_vencimiento: 2026-11-07
monto: 333.34
saldo_pendiente: 333.34
estado: PENDIENTE
```

## 12. Preguntas para defensa

### 1. Que es la entidad `Cuota`?

Respuesta: es la clase TypeScript que representa la tabla `cuotas`.

Explicacion sencilla: cada objeto `Cuota` corresponde a un registro en PostgreSQL.

### 2. Por que una cuota pertenece a un prestamo?

Respuesta: porque una cuota es una parte de pago de un prestamo especifico.

Explicacion sencilla: si no sabemos el prestamo, la cuota no tiene contexto financiero.

### 3. Que relacion se implemento?

Respuesta: `Prestamo 1 ---- N Cuotas`.

Explicacion sencilla: un prestamo puede tener muchas cuotas, pero cada cuota pertenece a un solo prestamo.

### 4. Donde se guarda la FK entre cuota y prestamo?

Respuesta: en la tabla `cuotas`, columna `prestamo_id`.

Explicacion sencilla: cada cuota guarda el id del prestamo al que pertenece.

### 5. Que hace `@ManyToOne`?

Respuesta: indica que muchas cuotas pertenecen a un prestamo.

Explicacion sencilla: varias filas de `cuotas` pueden tener el mismo `prestamo_id`.

### 6. Que hace `@OneToMany` en `Prestamo`?

Respuesta: representa que un prestamo tiene una lista de cuotas.

Explicacion sencilla: desde un prestamo se puede navegar hacia sus cuotas.

### 7. Que es un DTO?

Respuesta: una clase que define y valida datos de entrada.

Explicacion sencilla: evita que el backend reciba datos incompletos o invalidos.

### 8. Que valida `CreateCuotaDto`?

Respuesta: valida prestamo, numero de cuota, fecha, monto, saldo y estado.

Explicacion sencilla: comprueba que los datos para crear una cuota tengan sentido.

### 9. Por que `UpdateCuotaDto` tiene campos opcionales?

Respuesta: porque una actualizacion parcial no necesita enviar todos los campos.

Explicacion sencilla: se puede actualizar solo `saldoPendiente`, por ejemplo.

### 10. Que hace el Controller?

Respuesta: recibe peticiones HTTP y llama al service.

Explicacion sencilla: `POST /cuotas` entra al controller y luego pasa al service.

### 11. Que hace el Service?

Respuesta: contiene la logica del modulo.

Explicacion sencilla: valida que exista el prestamo y que el saldo pendiente no supere el monto.

### 12. Que hace el Repository?

Respuesta: usa TypeORM para consultar y guardar en PostgreSQL.

Explicacion sencilla: encapsula llamadas como `find`, `save` y `remove`.

### 13. Que es TypeORM?

Respuesta: un ORM que conecta clases TypeScript con tablas de base de datos.

Explicacion sencilla: permite usar entidades en vez de escribir SQL manual en cada operacion.

### 14. Para que sirve `fechaVencimiento`?

Respuesta: indica cuando debe pagarse la cuota.

Explicacion sencilla: con esa fecha podemos saber si vence manana o si ya esta atrasada.

### 15. Que es `diasAtraso`?

Respuesta: la cantidad de dias entre la fecha actual y la fecha de vencimiento cuando la cuota ya vencio.

Explicacion sencilla: si hoy es 10 y vencio el 5, tiene 5 dias de atraso.

### 16. Por que `diasAtraso` se calcula dinamicamente?

Respuesta: porque cambia todos los dias.

Explicacion sencilla: guardarlo en base podria dejarlo desactualizado.

### 17. Para que sirve `GET /cuotas/gestion-cobranza`?

Respuesta: devuelve cuotas vencidas o que vencen manana.

Explicacion sencilla: n8n podra consultar ese endpoint antes de enviar recordatorios.

### 18. Por que n8n no consulta directamente PostgreSQL?

Respuesta: porque es mejor pasar por el backend, que centraliza reglas, relaciones y formato de respuesta.

Explicacion sencilla: NestJS protege la logica del sistema y evita duplicarla dentro de n8n.

### 19. Por que todavia no clasificamos riesgo?

Respuesta: porque primero necesitabamos cuotas y dias de atraso.

Explicacion sencilla: el riesgo se podra calcular despues usando la informacion de cuotas vencidas.

### 20. Como se contempla el recordatorio 24 horas antes?

Respuesta: el endpoint incluye cuotas pendientes que vencen manana.

Explicacion sencilla: si el workflow corre a las 08:00, puede detectar cuotas que vencen al dia siguiente y preparar recordatorios.

## 13. Cambios realizados

### Archivos creados

- `backend/src/cuotas/dto/create-cuota.dto.ts`
- `backend/src/cuotas/dto/update-cuota.dto.ts`
- `backend/src/cuotas/entities/cuota.entity.ts`
- `backend/src/cuotas/repositories/cuota.repository.ts`
- `backend/src/cuotas/cuotas.controller.ts`
- `backend/src/cuotas/cuotas.service.ts`
- `backend/src/cuotas/cuotas.module.ts`
- `docs/EXPLICACION_MODULO_CUOTAS.md`

### Archivos modificados

- `backend/src/prestamos/entities/prestamo.entity.ts`
- `backend/src/app.module.ts`

### Cambio en `prestamo.entity.ts`

Que se cambio:

Se agrego la relacion inversa:

```ts
@OneToMany(() => Cuota, (cuota) => cuota.prestamo)
cuotas!: Cuota[];
```

Por que:

Para que `Prestamo` pueda navegar hacia sus cuotas.

Que ocurriria si no se hiciera:

La cuota podria apuntar al prestamo, pero el prestamo no tendria representada la lista de cuotas.

### Cambio en `app.module.ts`

Que se cambio:

Se importo y registro `CuotasModule`.

Por que:

Para que NestJS cargue el modulo y exponga los endpoints `/cuotas`.

Que ocurriria si no se hiciera:

El codigo existiria, pero NestJS no registraria los endpoints del modulo.

## 14. Decisiones tecnicas tomadas

### Estados como texto validado

Se uso texto validado con:

```text
PENDIENTE
PAGADA
VENCIDA
```

Esto mantiene una solucion simple y coherente con el proyecto actual.

### `diasAtraso` dinamico

No se creo columna para `diasAtraso` porque es un dato derivado de:

```text
fecha actual - fecha vencimiento
```

Se calcula solo en la respuesta de `GET /cuotas/gestion-cobranza`.

### Endpoint para n8n

Se implemento un endpoint de solo lectura:

```text
GET /cuotas/gestion-cobranza
```

No ejecuta n8n ni envia notificaciones.

### No se implemento riesgo

Aunque el endpoint devuelve `diasAtraso`, no clasifica `BAJO`, `MEDIO`, `ALTO` ni `CRITICO`.

Eso queda para una etapa posterior.

## 15. Siguiente paso recomendado

Revisar el modulo `Cuotas` y, cuando se autorice, construir el siguiente paso: conectar n8n con `GET /cuotas/gestion-cobranza` mediante un nodo HTTP Request.

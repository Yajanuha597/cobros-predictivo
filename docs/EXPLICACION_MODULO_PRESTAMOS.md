# Explicacion del modulo Prestamos

Este documento explica el modulo `Prestamos` implementado en el backend de CobrosPredictivo. La explicacion esta basada en el codigo real agregado en:

- `backend/src/prestamos/`
- `backend/src/clientes/entities/cliente.entity.ts`
- `backend/src/app.module.ts`

No se implementaron cuotas, pagos, cobros, riesgo, notificaciones ni workflows de n8n en esta etapa.

## A. Que problema estamos solucionando

CobrosPredictivo ya tenia clientes registrados, pero todavia no tenia prestamos. Sin prestamos no podemos saber cuanto dinero recibio un cliente, desde que fecha, en cuantas cuotas debe pagar ni si ese prestamo sigue activo.

El flujo futuro del sistema sera:

```text
Cliente
  |
  v
Prestamo
  |
  v
Cuotas
  |
  v
n8n
  |
  v
Cobranza automatica
```

En esta etapa solo se implementa la parte `Cliente -> Prestamo`.

La idea es que un cliente pueda tener varios prestamos. Mas adelante, cada prestamo tendra cuotas. Despues n8n podra consultar cuotas proximas o vencidas y preparar procesos de cobranza automatica.

Ejemplo sencillo:

- Cliente: Juan Perez
- Prestamo 1: 1000 dolares
- Prestamo 2: 500 dolares

Juan es un solo cliente, pero puede tener mas de un prestamo asociado.

## B. Estructura creada

Se creo esta estructura:

```text
backend/src/prestamos/
|-- dto/
|   |-- create-prestamo.dto.ts
|   `-- update-prestamo.dto.ts
|-- entities/
|   `-- prestamo.entity.ts
|-- repositories/
|   `-- prestamo.repository.ts
|-- prestamos.controller.ts
|-- prestamos.service.ts
`-- prestamos.module.ts
```

### `prestamos.module.ts`

Es el archivo que agrupa todo lo necesario para que NestJS conozca el modulo de prestamos.

Registra:

- `Prestamo`, la entidad nueva.
- `Cliente`, porque un prestamo necesita validar y relacionarse con un cliente.
- `PrestamosController`, que recibe las peticiones HTTP.
- `PrestamosService`, que contiene la logica.
- `PrestamoRepository`, que usa TypeORM para hablar con PostgreSQL.
- `ClienteRepository`, que permite buscar si el cliente existe.

### `prestamos.controller.ts`

Define los endpoints:

- `POST /prestamos`
- `GET /prestamos`
- `GET /prestamos/:id`
- `PATCH /prestamos/:id`
- `DELETE /prestamos/:id`

El controller no guarda datos directamente. Solo recibe la peticion y llama al service.

### `prestamos.service.ts`

Contiene la logica principal:

- Buscar todos los prestamos.
- Buscar un prestamo por id.
- Crear un prestamo.
- Actualizar un prestamo.
- Eliminar un prestamo.
- Validar que el cliente exista antes de crear o reasignar un prestamo.

### `prestamo.repository.ts`

Encapsula las llamadas directas a TypeORM:

- `repository.find()`
- `repository.findOne()`
- `repository.create()`
- `repository.merge()`
- `repository.save()`
- `repository.remove()`

Este archivo mantiene el mismo estilo del modulo `Clientes`, donde tambien existe un repository propio.

### `prestamo.entity.ts`

Define la tabla `prestamos` y sus columnas en PostgreSQL.

Tambien define la relacion:

```text
Cliente 1 ---- N Prestamos
```

### `create-prestamo.dto.ts`

Define que datos se pueden recibir para crear un prestamo.

### `update-prestamo.dto.ts`

Define que datos se pueden recibir para actualizar un prestamo.

## C. Entity: `prestamo.entity.ts`

Archivo real:

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

import { Cliente } from "../../clientes/entities/cliente.entity";

@Entity("prestamos")
export class Prestamo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "cliente_id" })
  clienteId!: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.prestamos, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "cliente_id" })
  cliente!: Cliente;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  monto!: number;

  @Column({ name: "fecha_inicio", type: "date" })
  fechaInicio!: string;

  @Column({ name: "numero_cuotas", type: "int" })
  numeroCuotas!: number;

  @Column({ length: 30, default: "ACTIVO" })
  estado!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
```

### Imports

```ts
import { ... } from 'typeorm';
```

Trae decoradores de TypeORM. Un decorador es una instruccion especial que le dice a TypeORM como debe mapear una clase de TypeScript a una tabla de PostgreSQL.

### `Column`

Sirve para declarar una columna normal en la tabla.

### `CreateDateColumn`

Crea automaticamente la fecha de creacion del registro.

### `Entity`

Marca la clase como una entidad de base de datos.

### `JoinColumn`

Indica el nombre de la columna que se usara como clave foranea para la relacion con clientes.

### `ManyToOne`

Indica que muchos prestamos pertenecen a un cliente.

### `PrimaryGeneratedColumn`

Crea una clave primaria autoincremental.

### `UpdateDateColumn`

Actualiza automaticamente la fecha de modificacion del registro.

### Import de `Cliente`

```ts
import { Cliente } from "../../clientes/entities/cliente.entity";
```

Se importa la entidad `Cliente` porque `Prestamo` necesita relacionarse con ella.

### `@Entity('prestamos')`

```ts
@Entity('prestamos')
```

Esto le dice a TypeORM que la clase `Prestamo` representa la tabla `prestamos` en PostgreSQL.

### `export class Prestamo`

```ts
export class Prestamo {
```

Define la clase TypeScript que usara NestJS y TypeORM para trabajar con prestamos.

### `id`

```ts
@PrimaryGeneratedColumn()
id!: number;
```

`id` es la clave primaria. PostgreSQL genera automaticamente el valor. Cada prestamo tendra un `id` unico.

### `clienteId`

```ts
@Column({ name: 'cliente_id' })
clienteId!: number;
```

Esta columna guarda el id del cliente al que pertenece el prestamo. En PostgreSQL la columna se llama `cliente_id`; en TypeScript la propiedad se llama `clienteId`.

### Relacion `cliente`

```ts
@ManyToOne(() => Cliente, (cliente) => cliente.prestamos, {
  nullable: false,
  onDelete: 'RESTRICT',
})
@JoinColumn({ name: 'cliente_id' })
cliente!: Cliente;
```

Esto declara que cada prestamo pertenece a un solo cliente.

- `nullable: false`: un prestamo no puede existir sin cliente.
- `onDelete: 'RESTRICT'`: si un cliente tiene prestamos, PostgreSQL no debe permitir borrarlo automaticamente.
- `@JoinColumn({ name: 'cliente_id' })`: la clave foranea queda en la columna `cliente_id`.

### `monto`

```ts
@Column({ type: 'numeric', precision: 12, scale: 2 })
monto!: number;
```

Representa el valor del prestamo.

- `numeric`: tipo decimal en PostgreSQL.
- `precision: 12`: permite hasta 12 digitos en total.
- `scale: 2`: permite 2 decimales.

Ejemplos validos:

- `1000`
- `1000.50`
- `25000.75`

### `fechaInicio`

```ts
@Column({ name: 'fecha_inicio', type: 'date' })
fechaInicio!: string;
```

Guarda la fecha de inicio del prestamo.

En PostgreSQL la columna se llama `fecha_inicio`. En TypeScript se usa `fechaInicio`.

### `numeroCuotas`

```ts
@Column({ name: 'numero_cuotas', type: 'int' })
numeroCuotas!: number;
```

Guarda cuantas cuotas tendra el prestamo. Todavia no se crean cuotas; solo se guarda el numero planificado.

### `estado`

```ts
@Column({ length: 30, default: 'ACTIVO' })
estado!: string;
```

Guarda el estado del prestamo. Si el frontend o Postman no envian estado, se guarda `ACTIVO`.

En esta etapa no se implemento una logica especial de estados. Es un campo simple de texto para mantener el modulo minimo.

### `createdAt`

```ts
@CreateDateColumn({ name: 'created_at' })
createdAt!: Date;
```

Guarda automaticamente cuando se creo el prestamo.

### `updatedAt`

```ts
@UpdateDateColumn({ name: 'updated_at' })
updatedAt!: Date;
```

Guarda automaticamente cuando se actualizo el prestamo por ultima vez.

## D. Relaciones TypeORM

La relacion implementada es:

```text
Cliente 1 ---- N Prestamos
```

Esto significa:

- Un cliente puede tener muchos prestamos.
- Un prestamo pertenece a un solo cliente.

### Que es 1:N

`1:N` significa "uno a muchos".

Ejemplo:

```text
Cliente:
Juan

Prestamos:
- Prestamo de 1000
- Prestamo de 500
- Prestamo de 300
```

Juan es un cliente. Ese cliente puede tener varios prestamos.

### Que es `OneToMany`

`OneToMany` se coloca en el lado "uno" de la relacion.

En este proyecto se agrego en `Cliente`:

```ts
@OneToMany(() => Prestamo, (prestamo) => prestamo.cliente)
prestamos!: Prestamo[];
```

Esto significa: un cliente tiene una lista de prestamos.

### Que es `ManyToOne`

`ManyToOne` se coloca en el lado "muchos" de la relacion.

En este proyecto se agrego en `Prestamo`:

```ts
@ManyToOne(() => Cliente, (cliente) => cliente.prestamos, {
  nullable: false,
  onDelete: 'RESTRICT',
})
@JoinColumn({ name: 'cliente_id' })
cliente!: Cliente;
```

Esto significa: muchos prestamos pueden apuntar al mismo cliente.

### Cual va en Cliente

En `Cliente` va `OneToMany`, porque un cliente puede tener muchos prestamos.

### Cual va en Prestamo

En `Prestamo` va `ManyToOne`, porque cada prestamo pertenece a un cliente.

### Que pasa en PostgreSQL

PostgreSQL no guarda una lista dentro del cliente. Lo que hace es guardar una columna `cliente_id` en la tabla `prestamos`.

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
2  | 1          | 500.00
```

Los dos prestamos tienen `cliente_id = 1`, por eso pertenecen a Juan.

### Donde queda la clave foranea

La clave foranea queda en `prestamos.cliente_id`.

Eso ocurre por:

```ts
@JoinColumn({ name: 'cliente_id' })
```

### Como sabe TypeORM que un prestamo pertenece a un cliente

TypeORM lo sabe porque:

1. `Prestamo` tiene `clienteId`.
2. `Prestamo` tiene una relacion `cliente`.
3. `@JoinColumn` dice que esa relacion usa la columna `cliente_id`.
4. `ManyToOne` apunta a la entidad `Cliente`.

## E. DTO

DTO significa `Data Transfer Object`, u objeto de transferencia de datos.

Es una clase que define que datos aceptamos desde una peticion HTTP.

Sin DTO, cualquier body podria llegar al controller sin estructura clara. Con DTO podemos validar.

### `create-prestamo.dto.ts`

Define los datos necesarios para crear un prestamo:

```ts
export class CreatePrestamoDto {
  clienteId!: number;
  monto!: number;
  fechaInicio!: string;
  numeroCuotas!: number;
  estado?: string;
}
```

Validaciones reales:

- `clienteId`: entero mayor o igual a 1.
- `monto`: numero con maximo 2 decimales y mayor o igual a 0.01.
- `fechaInicio`: fecha valida en formato ISO.
- `numeroCuotas`: entero mayor o igual a 1.
- `estado`: texto opcional de maximo 30 caracteres.

### `update-prestamo.dto.ts`

Define los datos permitidos para actualizar un prestamo.

La diferencia principal es que todos los campos son opcionales:

```ts
export class UpdatePrestamoDto {
  clienteId?: number;
  monto?: number;
  fechaInicio?: string;
  numeroCuotas?: number;
  estado?: string;
}
```

Esto permite actualizar solo un campo.

Ejemplo:

```json
{
  "estado": "CANCELADO"
}
```

### Que recibe el frontend

El frontend o Postman envia JSON.

Ejemplo:

```json
{
  "clienteId": 1,
  "monto": 1000,
  "fechaInicio": "2026-08-07",
  "numeroCuotas": 12
}
```

### Que llega al controller

El controller recibe ese JSON convertido en `CreatePrestamoDto` o `UpdatePrestamoDto`, segun el endpoint.

## F. Controller

El controller real es `prestamos.controller.ts`.

### `@Controller('prestamos')`

```ts
@Controller('prestamos')
```

Define la ruta base. Todos los endpoints empiezan con `/prestamos`.

### Constructor

```ts
constructor(private readonly prestamosService: PrestamosService) {}
```

NestJS inyecta el service para que el controller pueda llamar la logica.

### `GET /prestamos`

```ts
@Get()
findAll() {
  return this.prestamosService.findAll();
}
```

Devuelve todos los prestamos.

### `GET /prestamos/:id`

```ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.prestamosService.findOne(id);
}
```

Busca un prestamo por id.

- `@Param('id')`: lee el valor de la URL.
- `ParseIntPipe`: convierte el id a numero entero.

### `POST /prestamos`

```ts
@Post()
create(@Body() body: CreatePrestamoDto) {
  return this.prestamosService.create(body);
}
```

Crea un prestamo nuevo.

- `@Body()`: lee el JSON enviado en la peticion.

### `PATCH /prestamos/:id`

```ts
@Patch(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: UpdatePrestamoDto,
) {
  return this.prestamosService.update(id, body);
}
```

Actualiza parcialmente un prestamo.

### `DELETE /prestamos/:id`

```ts
@Delete(':id')
remove(@Param('id', ParseIntPipe) id: number) {
  return this.prestamosService.remove(id);
}
```

Elimina un prestamo por id.

## G. Service

El service real es `prestamos.service.ts`.

### Constructor

```ts
constructor(
  private readonly prestamoRepository: PrestamoRepository,
  private readonly clienteRepository: ClienteRepository,
) {}
```

El service necesita dos repositories:

- `PrestamoRepository`: para trabajar con prestamos.
- `ClienteRepository`: para verificar que el cliente exista.

### `findAll()`

```ts
async findAll(): Promise<PrestamosResponse> {
  const prestamos = await this.prestamoRepository.findAll();

  return {
    success: true,
    message: 'Prestamos obtenidos correctamente',
    prestamos,
  };
}
```

Busca todos los prestamos y devuelve una respuesta con:

- `success`
- `message`
- `prestamos`

### `findOne(id)`

```ts
async findOne(id: number): Promise<PrestamoResponse> {
  const prestamo = await this.findPrestamoById(id);

  return {
    success: true,
    message: 'Prestamo obtenido correctamente',
    prestamo,
  };
}
```

Busca un prestamo por id. Si no existe, lanza `NotFoundException`.

### `create(data)`

```ts
async create(data: CreatePrestamoDto): Promise<PrestamoResponse> {
  const { clienteId, ...prestamoData } = data;
  const cliente = await this.findClienteById(clienteId);
  const prestamo = this.prestamoRepository.create(prestamoData, cliente);
  const savedPrestamo = await this.prestamoRepository.save(prestamo);

  return {
    success: true,
    message: 'Prestamo creado correctamente',
    prestamo: savedPrestamo,
  };
}
```

Recorrido:

1. Extrae `clienteId`.
2. Busca si el cliente existe.
3. Crea el objeto prestamo.
4. Guarda el prestamo.
5. Devuelve la respuesta.

Si el cliente no existe, no se crea el prestamo.

### `update(id, data)`

```ts
async update(id: number, data: UpdatePrestamoDto): Promise<PrestamoResponse> {
  const prestamo = await this.findPrestamoById(id);
  const { clienteId, ...prestamoData } = data;
  const cliente =
    clienteId === undefined ? undefined : await this.findClienteById(clienteId);

  const updatedPrestamo = this.prestamoRepository.merge(
    prestamo,
    prestamoData,
    cliente,
  );
  const savedPrestamo = await this.prestamoRepository.save(updatedPrestamo);

  return {
    success: true,
    message: 'Prestamo actualizado correctamente',
    prestamo: savedPrestamo,
  };
}
```

Recorrido:

1. Busca el prestamo.
2. Si llega `clienteId`, valida que ese cliente exista.
3. Mezcla los cambios.
4. Guarda el prestamo actualizado.
5. Devuelve la respuesta.

### `remove(id)`

```ts
async remove(id: number): Promise<{ success: boolean; message: string }> {
  const prestamo = await this.findPrestamoById(id);

  await this.prestamoRepository.delete(prestamo);

  return {
    success: true,
    message: 'Prestamo eliminado correctamente',
  };
}
```

Busca el prestamo y lo elimina.

### `findPrestamoById(id)`

```ts
private async findPrestamoById(id: number): Promise<Prestamo> {
  const prestamo = await this.prestamoRepository.findById(id);

  if (!prestamo) {
    throw new NotFoundException('Prestamo no encontrado');
  }

  return prestamo;
}
```

Es una funcion privada para no repetir la validacion de existencia.

### `findClienteById(id)`

```ts
private async findClienteById(id: number): Promise<Cliente> {
  const cliente = await this.clienteRepository.findById(id);

  if (!cliente) {
    throw new NotFoundException('Cliente no encontrado');
  }

  return cliente;
}
```

Evita crear o mover un prestamo a un cliente inexistente.

## H. Repository

TypeORM usa repositories para comunicarse con PostgreSQL.

En este proyecto se creo `PrestamoRepository`.

### `repository.find()`

```ts
return this.repository.find({
  relations: {
    cliente: true,
  },
  order: {
    id: "DESC",
  },
});
```

Busca todos los prestamos.

- `relations: { cliente: true }`: tambien trae el cliente asociado.
- `order: { id: 'DESC' }`: ordena del mas nuevo al mas antiguo.

### `repository.findOne()`

```ts
return this.repository.findOne({
  where: { id },
  relations: {
    cliente: true,
  },
});
```

Busca un solo prestamo por id.

### `repository.create()`

```ts
return this.repository.create({
  ...data,
  estado: data.estado ?? "ACTIVO",
  cliente,
  clienteId: cliente.id,
});
```

Crea un objeto `Prestamo` en memoria. Todavia no lo guarda en PostgreSQL.

Si no viene `estado`, usa `ACTIVO`.

### `repository.merge()`

```ts
const updatedPrestamo = this.repository.merge(prestamo, data);
```

Combina el prestamo existente con los datos nuevos.

### `repository.save()`

```ts
return this.repository.save(prestamo);
```

Guarda el prestamo en PostgreSQL.

Si es nuevo, hace un insert. Si ya existe, hace un update.

### `repository.remove()`

```ts
await this.repository.remove(prestamo);
```

Elimina el registro de PostgreSQL.

## I. Flujo completo de `POST /prestamos`

Representacion:

```text
Frontend/Postman
      |
      v
Controller
      |
      v
DTO
      |
      v
Service
      |
      v
Repository
      |
      v
TypeORM
      |
      v
PostgreSQL
```

Paso a paso:

1. Frontend o Postman envia un `POST /prestamos`.
2. El body llega al controller.
3. NestJS valida el body usando `CreatePrestamoDto`.
4. El controller llama a `prestamosService.create(body)`.
5. El service extrae `clienteId`.
6. El service busca el cliente con `ClienteRepository`.
7. Si el cliente no existe, responde con error `Cliente no encontrado`.
8. Si el cliente existe, el service pide al `PrestamoRepository` crear el prestamo.
9. TypeORM prepara el objeto `Prestamo`.
10. `repository.save()` guarda el registro en PostgreSQL.
11. PostgreSQL guarda el prestamo en la tabla `prestamos`.
12. El backend responde:

```json
{
  "success": true,
  "message": "Prestamo creado correctamente",
  "prestamo": {
    "clienteId": 1,
    "monto": 1000,
    "fechaInicio": "2026-08-07",
    "numeroCuotas": 12,
    "estado": "ACTIVO"
  }
}
```

La respuesta real tambien puede incluir campos generados como `id`, `createdAt` y `updatedAt`.

## J. Ejemplo practico

JSON para crear un prestamo:

```json
{
  "clienteId": 1,
  "monto": 1000.5,
  "fechaInicio": "2026-08-07",
  "numeroCuotas": 12,
  "estado": "ACTIVO"
}
```

Campo por campo:

- `clienteId`: id del cliente que recibira el prestamo. Debe existir en la tabla `clientes`.
- `monto`: cantidad prestada.
- `fechaInicio`: fecha en la que inicia el prestamo.
- `numeroCuotas`: cantidad de cuotas planificadas.
- `estado`: estado inicial del prestamo. Es opcional; si no se envia, se guarda `ACTIVO`.

Ejemplo minimo valido:

```json
{
  "clienteId": 1,
  "monto": 1000,
  "fechaInicio": "2026-08-07",
  "numeroCuotas": 12
}
```

## K. Como probarlo con Postman

Asumiendo backend local en:

```text
http://localhost:3000
```

Desde n8n dentro de Docker, el hostname interno seria:

```text
http://backend:3000
```

### Crear prestamo

Metodo:

```text
POST
```

URL:

```text
http://localhost:3000/prestamos
```

Body:

```json
{
  "clienteId": 1,
  "monto": 1000,
  "fechaInicio": "2026-08-07",
  "numeroCuotas": 12
}
```

Resultado esperado si el cliente existe:

```json
{
  "success": true,
  "message": "Prestamo creado correctamente",
  "prestamo": {}
}
```

El objeto `prestamo` contendra los datos guardados y campos generados por la base.

Resultado esperado si el cliente no existe:

```text
Cliente no encontrado
```

NestJS devolvera una respuesta HTTP 404.

### Listar prestamos

Metodo:

```text
GET
```

URL:

```text
http://localhost:3000/prestamos
```

Resultado esperado:

```json
{
  "success": true,
  "message": "Prestamos obtenidos correctamente",
  "prestamos": []
}
```

### Obtener prestamo por id

Metodo:

```text
GET
```

URL:

```text
http://localhost:3000/prestamos/1
```

Resultado esperado si existe:

```json
{
  "success": true,
  "message": "Prestamo obtenido correctamente",
  "prestamo": {}
}
```

Resultado esperado si no existe:

```text
Prestamo no encontrado
```

NestJS devolvera una respuesta HTTP 404.

### Actualizar prestamo

Metodo:

```text
PATCH
```

URL:

```text
http://localhost:3000/prestamos/1
```

Body de ejemplo:

```json
{
  "monto": 1200,
  "numeroCuotas": 10
}
```

Resultado esperado:

```json
{
  "success": true,
  "message": "Prestamo actualizado correctamente",
  "prestamo": {}
}
```

### Eliminar prestamo

Metodo:

```text
DELETE
```

URL:

```text
http://localhost:3000/prestamos/1
```

Resultado esperado:

```json
{
  "success": true,
  "message": "Prestamo eliminado correctamente"
}
```

## L. Relacion con n8n

Todavia no conectamos n8n porque el workflow necesita cuotas, y las cuotas todavia no existen.

El flujo que falta construir despues es:

```text
Cliente
  |
  v
Prestamo
  |
  v
Cuotas
  |
  v
Endpoint cuotas proximas/vencidas
  |
  v
n8n
```

El modulo `Prestamos` es necesario porque las cuotas deben pertenecer a un prestamo. Sin prestamo, una cuota no tendria contexto financiero.

## M. Preguntas para defensa

### 1. Por que utilizo NestJS?

Respuesta correcta: porque NestJS permite organizar el backend en modulos, controllers y services de forma clara.

Explicacion sencilla: NestJS ayuda a separar responsabilidades. El controller recibe peticiones, el service contiene logica y el repository trabaja con la base de datos.

### 2. Que es una entidad?

Respuesta correcta: una entidad es una clase TypeScript que representa una tabla de la base de datos.

Explicacion sencilla: `Prestamo` es una clase, pero TypeORM la convierte en la tabla `prestamos`.

### 3. Que es un DTO?

Respuesta correcta: un DTO define la forma de los datos que entran al backend.

Explicacion sencilla: `CreatePrestamoDto` dice que para crear un prestamo deben llegar datos como `clienteId`, `monto`, `fechaInicio` y `numeroCuotas`.

### 4. Que hace el Controller?

Respuesta correcta: recibe las peticiones HTTP y llama al service correspondiente.

Explicacion sencilla: cuando llega `POST /prestamos`, el controller recibe el body y lo pasa a `PrestamosService.create()`.

### 5. Que hace el Service?

Respuesta correcta: contiene la logica de negocio.

Explicacion sencilla: el service valida que el cliente exista antes de guardar el prestamo.

### 6. Que es TypeORM?

Respuesta correcta: TypeORM es un ORM que conecta clases TypeScript con tablas de base de datos.

Explicacion sencilla: permite trabajar con `repository.save()` en lugar de escribir manualmente un `INSERT INTO prestamos`.

### 7. Que significa una relacion uno a muchos?

Respuesta correcta: significa que un registro de una tabla puede relacionarse con muchos registros de otra tabla.

Explicacion sencilla: un cliente puede tener muchos prestamos.

### 8. Donde se guarda la FK?

Respuesta correcta: se guarda en la tabla `prestamos`, en la columna `cliente_id`.

Explicacion sencilla: cada prestamo guarda el id del cliente al que pertenece.

### 9. Por que Prestamo pertenece a Cliente?

Respuesta correcta: porque un prestamo no tiene sentido sin saber que cliente lo recibio.

Explicacion sencilla: si prestamos 1000 dolares, necesitamos saber a que cliente se le presto.

### 10. Por que no se conecto n8n todavia?

Respuesta correcta: porque n8n necesita consultar cuotas proximas o vencidas, y todavia no existe el modulo de cuotas.

Explicacion sencilla: primero se crea Cliente, luego Prestamo, despues Cuotas y recien ahi n8n puede automatizar cobranza.

### 11. Que hace `@ManyToOne`?

Respuesta correcta: indica que muchos prestamos pueden pertenecer a un cliente.

Explicacion sencilla: varios registros de `prestamos` pueden tener el mismo `cliente_id`.

### 12. Que hace `@OneToMany`?

Respuesta correcta: indica que un cliente puede tener una lista de prestamos.

Explicacion sencilla: desde `Cliente` podemos representar `prestamos` como un arreglo.

### 13. Por que se valida que el cliente exista?

Respuesta correcta: para evitar crear prestamos huerfanos sin cliente real.

Explicacion sencilla: si llega `clienteId: 99` y no existe ese cliente, el backend devuelve `Cliente no encontrado`.

### 14. Que hace `repository.save()`?

Respuesta correcta: guarda un registro en la base de datos.

Explicacion sencilla: si el prestamo es nuevo, lo inserta; si ya existe, lo actualiza.

### 15. Por que se registro `PrestamosModule` en `AppModule`?

Respuesta correcta: para que NestJS cargue el modulo y sus endpoints.

Explicacion sencilla: si no se registra, NestJS no conoce `PrestamosController` y `/prestamos` no existiria.

## Cambios realizados

### Archivos creados

- `backend/src/prestamos/dto/create-prestamo.dto.ts`
- `backend/src/prestamos/dto/update-prestamo.dto.ts`
- `backend/src/prestamos/entities/prestamo.entity.ts`
- `backend/src/prestamos/repositories/prestamo.repository.ts`
- `backend/src/prestamos/prestamos.controller.ts`
- `backend/src/prestamos/prestamos.service.ts`
- `backend/src/prestamos/prestamos.module.ts`
- `docs/EXPLICACION_MODULO_PRESTAMOS.md`

### Archivos modificados

- `backend/src/clientes/entities/cliente.entity.ts`
- `backend/src/app.module.ts`

### Cambio en `cliente.entity.ts`

Que se cambio:

Se agrego `OneToMany` y la propiedad:

```ts
@OneToMany(() => Prestamo, (prestamo) => prestamo.cliente)
prestamos!: Prestamo[];
```

Por que:

Para que `Cliente` conozca su relacion con muchos prestamos.

Que pasaria si no se hace:

`Prestamo` podria apuntar a `Cliente`, pero la entidad `Cliente` no tendria representada la lista inversa de prestamos.

### Cambio en `app.module.ts`

Que se cambio:

Se importo y registro `PrestamosModule`.

Por que:

Para que NestJS cargue el modulo y active los endpoints `/prestamos`.

Que pasaria si no se hace:

Los archivos existirian, pero NestJS no expondria las rutas del modulo.

## Siguiente paso recomendado

El siguiente paso, cuando se autorice, es implementar el modulo `Cuotas`, relacionandolo con `Prestamo`.

Sin cuotas, n8n todavia no puede consultar vencimientos ni automatizar cobranza.

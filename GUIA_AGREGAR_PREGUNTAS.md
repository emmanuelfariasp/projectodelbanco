# Guía rápida para agregar preguntas

## 1. Elegir dónde agregar

Neurociencias:

```text
data/neuro/clase1.json
data/neuro/clase2.json
data/neuro/clase12.json
```

Fisiología:

```text
data/fisio/fisio_cap75_aleatorio.json
data/fisio/fisio_cuestionario_1.json
data/fisio/fisio_cuestionario_dificiles.json
```

## 2. Copiar el modelo de pregunta

```json
{
  "id": "clase12_026",
  "q": "Pregunta aquí...",
  "topic": "Tema",
  "options": [
    "Alternativa A",
    "Alternativa B",
    "Alternativa C",
    "Alternativa D"
  ],
  "answer": 0,
  "exp": "Explicación de la respuesta."
}
```

## 3. Cuidar las comas

Entre una pregunta y otra tiene que haber una coma:

```json
{
  "id": "pregunta_001"
},
{
  "id": "pregunta_002"
}
```

La última pregunta del archivo no lleva coma después.

## 4. Correcta por número

```text
A = 0
B = 1
C = 2
D = 3
E = 4
```

## 5. Subir al GitHub

Después de editar el JSON, haz `Commit changes`. Luego abre el sitio y presiona:

```text
Ctrl + F5
```


## Unidad V - Fisiología renal

Los capítulos 25 a 31 están en `data/fisio/unidad_v_limpia_v417/`. Cada archivo corresponde a un capítulo. Ejemplo: `data/fisio/unidad_v_limpia_v417/cap25.json`.


## Microbiología
Las preguntas de Microbiología están en:

```text
data/microbiologia/virologia/
data/microbiologia/parasitologia/
data/microbiologia/artropodes/
data/microbiologia/serpientes/
```

Para conservar el análisis por letras del gabarito, estas preguntas usan `keepOptionOrder: true`, por lo que las alternativas no se mezclan.

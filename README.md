# Banco de cuestiones 4º semestre - V4

Esta versión separa el sitio en archivos de código y archivos de preguntas.

## Estructura principal

```text
bancodecuestiones/
├── index.html
├── README.md
├── css/
│   ├── style-v4.css
│   └── style.css / style-v3.css  # antiguos, no obligatorios
├── js/
│   ├── data-loader.js
│   ├── app.js
│   ├── storage.js
│   ├── simulado.js
│   └── questions.js # solo aviso de compatibilidad
└── data/
    ├── manifest.json
    ├── plantilla-bloque.json
    ├── neuro/
    │   ├── clase1.json
    │   ├── clase2.json
    │   └── ...
    └── fisio/
        ├── fisio_cap75_aleatorio.json
        ├── fisio_cap76_aleatorio.json
        └── ...
```

## Cómo agregar preguntas a un bloque existente

Ejemplo: para agregar una pregunta en Neurociencias, Clase 12, abre:

```text
data/neuro/clase12.json
```

Dentro de `questions`, agrega una nueva pregunta siguiendo este formato:

```json
{
  "id": "clase12_026",
  "q": "Escribe aquí la pregunta.",
  "topic": "Diagnóstico",
  "options": [
    "Alternativa A",
    "Alternativa B",
    "Alternativa C",
    "Alternativa D"
  ],
  "answer": 1,
  "exp": "Explicación clara de la respuesta correcta."
}
```

### Regla de la respuesta correcta

```text
0 = A
1 = B
2 = C
3 = D
4 = E
```

No necesitas cambiar manualmente el número de preguntas. La V4 cuenta las preguntas automáticamente.

## Cómo agregar un bloque nuevo

1. Copia `data/plantilla-bloque.json`.
2. Pega el archivo en `data/neuro/` o `data/fisio/`.
3. Cambia el nombre del archivo, por ejemplo:

```text
data/neuro/clase13.json
```

4. Edita `data/manifest.json` y agrega el nuevo bloque en la lista de `sections` del área correspondiente:

```json
{
  "key": "clase13",
  "file": "data/neuro/clase13.json"
}
```

## Importante

- No abras el `index.html` directamente desde tu computadora para probar la V4, porque algunos navegadores bloquean la carga de JSON local.
- Para probar localmente, usa un servidor local:

```bash
python -m http.server 8000
```

Luego abre:

```text
http://localhost:8000
```

En GitHub Pages funcionará normalmente.


## V4.1 - Modo simulado

En modo simulado no se muestran aciertos, errores ni lista de preguntas durante el intento. La corrección aparece solamente al finalizar.

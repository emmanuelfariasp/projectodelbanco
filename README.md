# Banco de cuestiones 4º semestre - V4.19

Versión V4.19 - Unidad V renal reemplazada con nuevas preguntas importantes.

## Estructura

```text
index.html
README.md
GUIA_AGREGAR_PREGUNTAS.md
css/style-v4.css
js/data-loader.js
js/storage.js
js/simulado.js
js/app.js
data/manifest.json
data/neuro/*.json
data/fisio/*.json
Cuestionario_Neurociencia_Final.pdf
pdf_fisiologia_banco_completo_790_preguntas_2_columnas_emmanuel.pdf
pdf_fisiologia_renal_unidad_v_350_preguntas_2_columnas_emmanuel.pdf
```

## Conteo actual

- Neurociencias: 15 bloques, 600 preguntas.
- Fisiología Unidad XIV: 11 bloques, 790 preguntas.
- Fisiología Unidad V: 7 bloques, 350 preguntas.

## PDFs usados por el sitio

- Neurociencias: `Cuestionario_Neurociencia_Final.pdf`
- Fisiología Unidad XIV: `pdf_fisiologia_banco_completo_790_preguntas_2_columnas_emmanuel.pdf`
- Fisiología Unidad V: `pdf_fisiologia_renal_unidad_v_350_preguntas_2_columnas_emmanuel.pdf`

## Cómo agregar preguntas

Edita los archivos JSON dentro de `data/fisio/` o `data/neuro/`. No necesitas tocar `app.js` para agregar nuevas preguntas.

## Verificación V4.12

- JSON validado.
- IDs únicos.
- Respuestas dentro del rango correcto.
- Archivos referenciados por el sitio presentes.
- Modo simulado mantiene progreso, lista y feedback ocultos durante el intento.


## V4.14

- Fisiología ahora se divide en dos unidades: Unidad XIV - Endocrinología y reproducción, y Unidad V - Los líquidos corporales y los riñones.
- Unidad V incluye 7 bloques nuevos, capítulos 25 a 31, con 50 preguntas por capítulo.
- Para agregar preguntas renales, edita los archivos en `data/fisio/unidad_v_v419/`.


## V4.17

- Se retiró la frase repetida "señale la alternativa correcta según el capítulo" de las preguntas de la Unidad V.
- Se mantuvieron 350 preguntas renales: 50 por capítulo, capítulos 25 a 31.
- Se verificaron JSON, IDs, respuestas, conteos y coherencia básica entre alternativa correcta y explicación.


## V4.18

- Se agregaron 43 preguntas al bloque Fisiología - Unidad XIV - Capítulo 82.
- El bloque Capítulo 82 pasó de 25 a 68 preguntas.
- El PDF de la Unidad XIV fue actualizado a 790 preguntas.


## V4.19

- Se reemplazaron todas las preguntas de Fisiología Unidad V renal.
- Cada capítulo 25-31 ahora usa el nuevo PDF de preguntas importantes correspondiente.
- Se mantiene la Unidad V con 7 bloques y 350 preguntas.
- PDF de la Unidad V renal actualizado en 2 columnas.


## V4.20
- Agrega Microbiología al menú principal.
- Microbiología se divide en Virología, Parasitología, Artrópodos y Serpientes.
- Incluye 230 preguntas del PDF de Microbiología II, con 10 preguntas por clase y explicaciones detalladas.

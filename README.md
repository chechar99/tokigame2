# Toki — Una aventura en Córdoba

Juego de plataformas en **HTML5 + JavaScript** (sin build ni dependencias). Corré con Toki por las Sierras y Barrio Docta, juntá sogas, esquivá el agua y volvé a casa.

## Jugar en local

Abrí `index.html` en el navegador, o serví la carpeta con cualquier servidor estático:

```bash
cd tokigame2
python3 -m http.server 8080
```

Luego entrá a [http://localhost:8080](http://localhost:8080).

En móvil conviene **landscape**; el juego pide girar el celular si está en vertical.

## Controles

| Plataforma | Saltar | Ladrar | Otros |
|------------|--------|--------|--------|
| Teclado | Espacio, ↑, W o Z | X, C, B, Shift o → | Enter: acción · P / Esc: pausa · M: mute · I: intro |
| Táctil | Botón derecho / mitad derecha | Botón izquierdo / mitad izquierda | Doble salto: dos toques de salto |

## GitHub Pages

1. Subí este repo a GitHub (rama `main`).
2. **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, branch **`main`**, folder **`/ (root)`**.
3. La URL será `https://<usuario>.github.io/<repo>/` (por ejemplo `https://chechar99.github.io/tokigame2/`).

No hace falta compilar nada: `index.html` en la raíz y rutas relativas alcanzan.

## Estructura

```
index.html      Entrada y canvas
style.css       Estilos y aviso de rotación
manifest.json   PWA básica (landscape, fullscreen)
js/engine.js    Motor (canvas, input, texto pixel)
js/art.js       Sprites y fondos
js/audio.js     Música y efectos (Web Audio)
js/game.js      Mecánicas, niveles, HUD
js/scenes.js    Menús, intro, game over, victoria
js/main.js      Bucle principal
```

## Licencia

Proyecto personal; agregá la licencia que prefieras si lo publicás.

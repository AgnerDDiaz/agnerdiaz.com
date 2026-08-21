# Capturas de proyectos

Suelta aquí las capturas de cada app, dentro de la carpeta de su proyecto:

    public/img/projects/finclarity/1.png
    public/img/projects/finclarity/2.png
    public/img/projects/mercaverde/1.png
    ...

Luego, en el archivo del proyecto (`src/content/projects/<slug>.md`), añade la
lista `screenshots` en el frontmatter. La primera es la portada del hero; el
resto van a la galería:

    screenshots:
      - src: /img/projects/finclarity/1.png
        alt: Pantalla de inicio
        caption:
          es: Dashboard con el resumen del mes
          en: Dashboard with the monthly summary
      - src: /img/projects/finclarity/2.png
        alt: Registro de transacción

Formato recomendado: PNG/JPG de captura de teléfono en vertical (relación ~9:19.5).
Mientras no haya capturas, se muestran marcos de teléfono con "Captura próximamente".

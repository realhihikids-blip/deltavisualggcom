# DELTA VISUALS — сайт (GitHub Pages)

Статический сайт: только HTML, CSS и JS. Сервер не нужен.

## Структура
```
index.html              страница
css/style.css           стили
js/main.js              GSAP: прелоадер, Lenis, ScrollTrigger, курсор, магнитные кнопки, горизонтальный скролл
js/scene.js             Three.js: шейдерные частицы + wireframe-«дельта», реакция на мышь и скролл
js/demo.js              интерактивный ClickGUI + HUD-редактор (drag, колесо = масштаб, R = сброс)
js/aura.js              песочница ауры (Canvas 2D)
assets/icon.png         иконка мода
downloads/…0.3.0.jar    ваш мод для скачивания
.nojekyll               отключает Jekyll на Pages
```

## Библиотеки
Подключены по CDN с точными версиями (gsap 3.12.5, lenis 1.1.13, three r128).
Если одна не загрузится, сайт всё равно работает: эффекты, которым она нужна, просто отключаются.

Хотите хранить их локально:
```
mkdir js/vendor && cd js/vendor
curl -LO https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js
curl -LO https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js
curl -LO https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js
curl -LO https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
```
Затем в конце `index.html` замените четыре адреса `https://…` на `js/vendor/gsap.min.js` и т.д.

## Деплой
См. инструкцию в чате: репозиторий → Settings → Pages → Deploy from a branch → main / (root).

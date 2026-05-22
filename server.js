const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PAGES = ['/', '/historias', '/subir', '/login', '/perfil'];
PAGES.forEach(route => {
  const file = route === '/' ? 'index' : route.slice(1);
  app.get(route, (_, res) => res.sendFile(path.join(__dirname, 'public', `${file}.html`)));
});

app.get('/historia/:id', (_, res) => res.sendFile(path.join(__dirname, 'public', 'detalle.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`));

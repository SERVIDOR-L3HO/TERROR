const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/historias', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'historias.html'));
});

app.get('/subir', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'subir.html'));
});

app.get('/historia/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'detalle.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de Terror corriendo en http://0.0.0.0:${PORT}`);
});

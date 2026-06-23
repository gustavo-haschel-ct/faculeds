const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const ALUNO = process.env.ALUNO || 'Aluno';

app.get('/', (req, res) => {
  res.json({
    disciplina: 'Sistemas Operacionais',
    aluno: ALUNO,
    hostname: os.hostname(),
    plataforma: os.platform(),
    arquitetura: os.arch()
  });
});

app.get('/info', (req, res) => {
  res.json({
    pid: process.pid,
    uptime: Math.floor(process.uptime()),
    cpus: os.cpus().length
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Aluno: ${ALUNO}`);
  console.log(`Plataforma: ${os.platform()} | Arch: ${os.arch()}`);
});

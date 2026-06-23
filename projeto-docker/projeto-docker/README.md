# Projeto Docker — Sistemas Operacionais

## Estrutura do Projeto

```
projeto-docker/
├── docker-compose.yml
├── README.md
├── evidencias/
│   ├── docker-ps.txt
│   ├── docker-stats.txt
│   ├── docker-inspect-app.txt
│   ├── logs-app.txt
│   └── print-navegador.png
└── app/
    ├── Dockerfile
    ├── package.json
    └── server.js
```

---

## Como Executar

```bash
# Clonar / extrair o projeto e entrar na pasta
cd projeto-docker

# Construir e subir os containers
docker compose up --build -d

# Verificar se os containers estão rodando
docker ps

# Acessar a aplicação
curl http://localhost:3000
curl http://localhost:3000/info

# Parar os containers
docker compose down
```

---

## Rotas da Aplicação

| Rota | Descrição |
|------|-----------|
| `GET /` | Informações do sistema e do aluno |
| `GET /info` | Informações do processo Node.js |

### Exemplo — `/`
```json
{
  "disciplina": "Sistemas Operacionais",
  "aluno": "Seu Nome",
  "hostname": "a3f1b2c4d5e6",
  "plataforma": "linux",
  "arquitetura": "x64"
}
```

### Exemplo — `/info`
```json
{
  "pid": 1,
  "uptime": 123,
  "cpus": 4
}
```

---

## Questionário

### 1. Qual a diferença entre imagem e container?

Uma **imagem Docker** é um modelo estático e somente leitura que contém o sistema de arquivos, dependências e instruções de execução de uma aplicação. Ela funciona como uma "receita" ou classe no paradigma orientado a objetos — não executa nada por si só.

Um **container** é uma instância em execução de uma imagem. É o processo isolado que o Docker cria a partir da imagem, com seu próprio espaço de nomes (namespaces) de processos, rede e sistema de arquivos. Se a imagem é a classe, o container é o objeto instanciado. Múltiplos containers podem ser criados a partir de uma mesma imagem.

---

### 2. Qual processo está executando dentro do container?

O processo principal é o **`node server.js`**, que inicia o servidor Express na porta 3000. Por causa da instrução `CMD ["node", "server.js"]` no Dockerfile, este processo recebe o **PID 1** dentro do container — o processo raiz de todo o namespace de processos daquele container. Pode ser verificado com:

```bash
docker exec so-app ps aux
```

---

### 3. O container possui kernel próprio? Justifique.

**Não.** O container **não possui kernel próprio**. Esta é uma das diferenças fundamentais entre containers e máquinas virtuais.

O container compartilha o kernel do sistema operacional hospedeiro (host). O Docker utiliza recursos do próprio kernel Linux — especificamente os **namespaces** (para isolamento de processos, rede, sistema de arquivos, usuários etc.) e os **cgroups** (para limitação de recursos como CPU e memória) — para criar o isolamento entre containers.

Isso torna os containers muito mais leves do que VMs: não há overhead de emulação de hardware nem de um kernel adicional em execução.

---

### 4. Qual recurso foi limitado na sua infraestrutura?

O recurso limitado foi a **memória RAM**. No `docker-compose.yml`, a diretiva `deploy.resources.limits.memory: 128M` impõe um teto de **128 MB** para cada serviço (`app` e `db`).

Esse limite é implementado internamente pelo Docker via **cgroups** do kernel Linux, que impedem que o processo ultrapasse a quantidade de memória definida. Caso o container tente alocar mais do que 128 MB, o kernel aciona o OOM Killer (Out Of Memory Killer) e encerra o processo.

```yaml
deploy:
  resources:
    limits:
      memory: 128M
```

---

### 5. Qual a finalidade do volume Docker utilizado?

O volume `so-db-data`, montado em `/var/lib/mysql` dentro do container do MySQL, serve para garantir a **persistência dos dados do banco de dados**.

Por padrão, todo dado gravado dentro de um container é perdido quando ele é removido, pois a camada de escrita do container é efêmera. Com o volume, o MySQL grava seus arquivos num local gerenciado pelo Docker no sistema de arquivos do host. Assim, mesmo que o container `so-db` seja destruído e recriado, os dados do banco permanecem intactos.

```yaml
volumes:
  - so-db-data:/var/lib/mysql
```

---

### 6. Qual a finalidade da rede Docker criada?

A rede `so-network` (driver `bridge`) foi criada para:

1. **Isolar** os containers do projeto de outros containers e do host, aumentando a segurança.
2. **Permitir comunicação interna** entre os containers pelo nome do serviço como hostname — por exemplo, o `app` pode conectar-se ao `db` simplesmente usando o hostname `db`, sem precisar conhecer o IP dinâmico do container.
3. **Controlar o tráfego**: apenas containers na mesma rede podem se comunicar diretamente; o banco de dados não fica exposto externamente.

Sem uma rede dedicada, os containers estariam na rede padrão do Docker, sem o isolamento adequado para o projeto.

---

### 7. Por que executar aplicações como usuário não-root?

Executar como `root` dentro de um container é um risco de segurança grave. Se um atacante explorar uma vulnerabilidade na aplicação, ele terá privilégios de root **dentro do container** — e dependendo da configuração, isso pode ser aproveitado para escapar do isolamento e comprometer o sistema host.

Ao criar um usuário não-root (`appuser`) e executar o Node.js com ele:

- O processo não tem permissão para modificar arquivos do sistema;
- Não consegue abrir portas privilegiadas (abaixo de 1024) sem capabilities extras;
- O raio de impacto de uma exploração é drasticamente reduzido;
- Segue o **princípio do menor privilégio**, uma das bases da segurança em SO.

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

---

### 8. Por que Docker não é uma máquina virtual?

| Característica | Máquina Virtual (VM) | Container Docker |
|---|---|---|
| **Kernel** | Próprio (virtualizado) | Compartilhado com o host |
| **Overhead** | Alto (emulação de hardware) | Baixo (isolamento por namespaces) |
| **Inicialização** | Minutos | Segundos ou menos |
| **Tamanho** | Gigabytes (inclui SO completo) | Megabytes (apenas a aplicação) |
| **Isolamento** | Hardware virtualizado | Namespaces + cgroups do kernel |

Uma VM virtualiza o **hardware**, simulando CPUs, memória e discos para que um SO completo rode sobre eles. O Docker, por outro lado, virtualiza apenas o **espaço do usuário** — usa o kernel do host diretamente e isola processos com funcionalidades nativas do Linux (namespaces e cgroups). Por isso, o Docker é considerado uma **virtualização leve** ou **conteinerização**, não uma virtualização completa de hardware.

---

### 9. O que representa o PID exibido na rota `/info`?

O **PID (Process Identifier)** é o número único que o sistema operacional atribui a cada processo em execução.

Na rota `/info`, o valor exibido é `process.pid` do Node.js. Dentro do container, esse valor é **1** (ou muito próximo disso) porque o processo Node.js é o **processo inicial** do namespace de processos do container — equivalente ao `init` ou `systemd` em um sistema Linux convencional.

Esse PID 1 dentro do container corresponde a um PID diferente (e maior) no host, pois os namespaces de PID mapeiam os identificadores de forma independente. Isso ilustra como o SO gerencia processos e como o Docker usa namespaces para criar a ilusão de isolamento.

---

### 10. Cite três conceitos de Sistemas Operacionais presentes neste projeto

1. **Processos e Gerenciamento de Processos**
   O Node.js executa como um processo com PID próprio dentro de um namespace isolado. O Docker utiliza namespaces de PID do kernel Linux para criar esse isolamento, de modo que cada container tem sua própria árvore de processos começando em PID 1. Isso reflete diretamente a abstração de processo do SO.

2. **Gerenciamento de Recursos (cgroups)**
   O limite de 128 MB de memória é implementado via **Control Groups (cgroups)** do kernel Linux. Os cgroups são o mecanismo do SO para agrupar processos e aplicar limites de uso de recursos (memória, CPU, I/O). Isso demonstra o papel do SO como gerenciador de recursos.

3. **Sistema de Arquivos e Persistência (Volumes)**
   O volume Docker mapeia um diretório do host para dentro do container, utilizando funcionalidades do VFS (Virtual File System) do kernel. Isso exemplifica como o SO abstrai o armazenamento físico, fornecendo uma interface uniforme de sistema de arquivos independente do hardware subjacente. A persistência dos dados do MySQL depende diretamente desse mecanismo.

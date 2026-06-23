# Imagem base oficial do Node.js (Alpine para menor tamanho)
FROM node:18-alpine

# Metadados da imagem
LABEL maintainer="Sistemas Operacionais"
LABEL description="Aplicacao web Node.js para projeto Docker"

# Definir diretorio de trabalho dentro do container
WORKDIR /app

# Copiar arquivos de dependencias primeiro (cache de camadas)
COPY package.json ./

# Instalar dependencias como root (necessario para npm install)
RUN npm install --production

# Copiar o restante do codigo da aplicacao
COPY server.js ./

# Criar usuario nao-root para execucao segura
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Ajustar permissoes do diretorio de trabalho
RUN chown -R appuser:appgroup /app

# Trocar para usuario nao-root
USER appuser

# Expor porta da aplicacao
EXPOSE 3000

# Comando de inicializacao
CMD ["node", "server.js"]

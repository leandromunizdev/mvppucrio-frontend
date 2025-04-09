# Utiliza a imagem leve do Nginx baseada no Alpine Linux
FROM nginx:alpine

# Remove os arquivos padrão da página inicial do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos estáticos da aplicação para o diretório do Nginx
COPY . /usr/share/nginx/html/

# Expõe a porta 80 (padrão do Nginx)
EXPOSE 80

# Comando para iniciar o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]

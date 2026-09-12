# Stage 1: Build the Vue 2 application
FROM node:20-alpine AS build-stage
WORKDIR /app

# Bypass corporate / university firewall SSL interception proxies (avoids UNABLE_TO_VERIFY_LEAF_SIGNATURE and silent npm hang)
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm config set strict-ssl false

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

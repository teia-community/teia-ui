FROM node:16 AS builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .
RUN : \
    && npm install; npm run build \
    && echo "add_header x-teia-commit-hash $(git rev-parse HEAD);" > /header.conf

FROM openresty/openresty:alpine-fat
EXPOSE 80
COPY .github/workflows/nginx.conf /etc/nginx/conf.d/default.conf
COPY .github/workflows/previews.lua /lua/previews.lua
COPY --from=builder /usr/src/app/build/ /usr/local/openresty/nginx/html/
COPY --from=builder /header.conf /header.conf

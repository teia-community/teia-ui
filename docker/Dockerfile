FROM node:22 AS builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .
RUN : \
    && npm install; npm run build \
    && echo "add_header x-teia-commit-hash $(git rev-parse HEAD);" > /header.conf

FROM openresty/openresty:alpine
EXPOSE 80
COPY docker/nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY docker/lua /lua
COPY docker/shared.conf /shared.conf
COPY --from=builder /usr/src/app/build/ /usr/local/openresty/nginx/html/
COPY --from=builder /header.conf /header.conf

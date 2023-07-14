FROM node:16 AS builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .
RUN : \
    && npm install; npm run build \
    && echo "add_header x-teia-commit-hash $(git rev-parse HEAD);" > /header.conf

FROM openresty/openresty:alpine
EXPOSE 80
RUN mkdir /lua; wget -O /lua/ustring.lua https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-Scribunto/master/includes/Engines/LuaCommon/lualib/ustring/ustring.lua
COPY .github/workflows/nginx.conf /etc/nginx/conf.d/default.conf
COPY .github/workflows/previews.lua /lua/previews.lua
COPY --from=builder /usr/src/app/build/ /usr/local/openresty/nginx/html/
COPY --from=builder /header.conf /header.conf

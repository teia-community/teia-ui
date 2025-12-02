FROM node:24 AS builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .
RUN : \
    && npm install; npm run build \
    && echo "add_header x-teia-commit-hash $(git rev-parse HEAD);" > /header.conf

FROM openresty/openresty:alpine
EXPOSE 80
RUN : \
    && mkdir /lua \
    && wget -O /lua/ustring.lua https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-Scribunto/master/includes/Engines/LuaCommon/lualib/ustring/ustring.lua \
    && wget -O /lua/hmac.lua https://raw.githubusercontent.com/jkeys089/lua-resty-hmac/master/lib/resty/hmac.lua
COPY docker/nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY docker/previews.lua /lua/previews.lua
COPY docker/shared.conf /shared.conf
COPY --from=builder /usr/src/app/build/ /usr/local/openresty/nginx/html/
COPY --from=builder /header.conf /header.conf

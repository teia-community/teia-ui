FROM node:16 AS builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .
RUN : \
    && npm install; npm run build \
    && echo "add_header x-teia-commit-hash $(git rev-parse HEAD);" > /header.conf

FROM nginx:alpine
COPY --from=builder /usr/src/app/build/ /var/www/html/
COPY --from=builder /header.conf /header.conf

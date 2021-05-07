# syntax=docker/dockerfile:1

FROM node:current-alpine

WORKDIR /opt/tmp

RUN apk update && apk upgrade

RUN apk add --no-cache \
    sudo \
    curl \
    build-base \
    g++ \
    libpng \
    libpng-dev \
    jpeg-dev \
    pango-dev \
    cairo-dev \
    giflib-dev \
    python \
    make \
    fftw-dev \
    ;

RUN apk --no-cache add ca-certificates wget  && \
    wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub && \
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.29-r0/glibc-2.29-r0.apk && \
    apk add glibc-2.29-r0.apk \
    ;

RUN ln -snf /usr/share/zoneinfo/Europe/Berlin /etc/localtime

WORKDIR /opt/src
COPY . .

RUN npm install
RUN npm run build
RUN npm install pm2 -g

CMD ["pm2-runtime", "build/app.js", "-i", "-1"]
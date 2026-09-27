default:
    @just --list

setup:
    npm ci

build:
    npm run build

check:
    npm run qa:fixture
    npm test
    npm run build

dev: build
    npm run dev

lan: build
    HOST=0.0.0.0 npm start

container:
    docker compose up -d

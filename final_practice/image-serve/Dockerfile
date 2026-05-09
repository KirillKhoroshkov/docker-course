# Образ сборки
FROM golang:1.26-alpine AS builder

# Указываем рабочую директорию
WORKDIR /app

# Копируем исходники и собираем приложение
COPY . .
RUN go build -o server .

# Образ запуска
FROM alpine:3.23

# Указываем рабочую директорию
WORKDIR /app

# Копируем исполняемый файл
COPY --from=builder /app/server .

# Запускаем приложение
CMD ["./server"]

FROM golang:1.23 AS builder
WORKDIR /app
RUN go mod init app
COPY app.go .
RUN go build -o /app/app

FROM scratch
COPY --from=builder /app/app /app/app
CMD ["/app/app"]

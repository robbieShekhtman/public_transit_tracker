FROM golang:1.23.4

WORKDIR /root/

COPY go.mod go.sum ./
RUN go mod download

COPY . .


RUN go build -o main .

EXPOSE 8080

CMD ["./main"]

package main

import (
	"log"
	"public_transport_tracker/handlers"
	"public_transport_tracker/parser"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	db, err := parser.ConnectDB()
	if err != nil {
		log.Fatal(err)
	}

	r := handlers.SetupRouter(db)

	port := ":8080"

	log.Println("Starting server on http://localhost" + port)
	r.Run(port)
}

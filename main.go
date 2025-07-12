package main

import (
	"log"
	"public_transport_tracker/handlers"
	"public_transport_tracker/parser"

	"github.com/gin-gonic/gin"
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

	r := gin.Default()
	r.SetTrustedProxies([]string{"127.0.0.1"})
	r.GET("/routes", handlers.GetRoutes(db))
	r.GET("/stops", handlers.GetStops(db))
	r.GET("/stops/:stop_id", handlers.GetStopByID(db))
	r.GET("/routes/:route_id/trips", handlers.GetTripsByRouteID(db))

	port := ":8080"

	log.Println("Starting server on http://localhost" + port)
	r.Run(port)
}

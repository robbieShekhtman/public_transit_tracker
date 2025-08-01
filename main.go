package main

import (
	"log"
	"net/http"
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

	r := handlers.SetupRouter(db)

	port := ":8080"

	r.Static("/static", "./frontend")
	r.LoadHTMLFiles("frontend/index.html")

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})

	log.Println("Starting server on http://localhost" + port)
	r.Run(port)
}

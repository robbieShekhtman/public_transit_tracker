package main

import (
	"log"
	"net/http"
	"public_transport_tracker/cache"
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

	err = cache.InitializeRedis()
	if err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
		log.Println("Continuing without Redis caching...")
	} else {
		log.Println("Redis caching enabled")
	}

	db, err := parser.ConnectDB()
	if err != nil {
		log.Fatal(err)
	}

	err = parser.LoadGTFS(db, "data/")
	if err != nil {
		log.Fatal(err)
	}

	r := handlers.SetupRouter(db)

	port := ":8080"

	r.Static("/static", "./frontend")
	r.LoadHTMLFiles("frontend/index.html", "frontend/dashboard.html")

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})

	r.GET("/dashboard.html", func(c *gin.Context) {
		c.HTML(http.StatusOK, "dashboard.html", nil)
	})

	log.Println("Starting server on http://localhost" + port)
	r.Run(port)
}

package main

import (
	"log"
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

	parser.LoadStops(db, "data/gtfs_static/stops.txt")
	parser.LoadRoutes(db, "data/gtfs_static/routes.txt")
	parser.LoadTrips(db, "data/gtfs_static/trips.txt")
	parser.LoadStopTimes(db, "data/gtfs_static/stop_times.txt")
}

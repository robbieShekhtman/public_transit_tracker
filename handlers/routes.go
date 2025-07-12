package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Route struct {
	RouteID   string `json:"route_id"`
	ShortName string `json:"short_name"`
	LongName  string `json:"long_name"`
	RouteType int    `json:"route_type"`
}

func GetRoutes(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query("SELECT route_id, route_short_name, route_long_name, route_type FROM routes")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var routes []Route
		for rows.Next() {
			var r Route
			if err := rows.Scan(&r.RouteID, &r.ShortName, &r.LongName, &r.RouteType); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			routes = append(routes, r)
		}
		c.JSON(http.StatusOK, routes)
	}
}

type Stop struct {
	StopID string   `json:"stop_id"`
	Name   string   `json:"stop_name"`
	Lat    *float64 `json:"lat,omitempty"`
	Lon    *float64 `json:"lon,omitempty"`
}

func GetStops(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query("SELECT stop_id, stop_name, stop_lat, stop_lon FROM stops")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var stops []Stop
		for rows.Next() {
			var (
				id   string
				name string
				lat  sql.NullFloat64
				lon  sql.NullFloat64
			)

			err := rows.Scan(&id, &name, &lat, &lon)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			s := Stop{
				StopID: id,
				Name:   name,
			}

			if lat.Valid {
				s.Lat = &lat.Float64
			}
			if lon.Valid {
				s.Lon = &lon.Float64
			}

			stops = append(stops, s)
		}

		c.JSON(http.StatusOK, stops)
	}
}

func GetStopByID(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("stop_id")

		var s Stop
		err := db.QueryRow("SELECT stop_id, stop_name, stop_lat, stop_lon FROM stops WHERE stop_id = $1", id).
			Scan(&s.StopID, &s.Name, &s.Lat, &s.Lon)

		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Stop not found"})
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, s)
	}
}

type Trip struct {
	TripID    string `json:"trip_id"`
	RouteID   string `json:"route_id"`
	ServiceID string `json:"service_id"`
	Headsign  string `json:"trip_headsign"`
}

func GetTripsByRouteID(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		routeID := c.Param("route_id")
		rows, err := db.Query("SELECT trip_id, route_id, service_id, trip_headsign FROM trips WHERE route_id = $1", routeID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var trips []Trip
		for rows.Next() {
			var t Trip
			if err := rows.Scan(&t.TripID, &t.RouteID, &t.ServiceID, &t.Headsign); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			trips = append(trips, t)
		}
		c.JSON(http.StatusOK, trips)
	}
}

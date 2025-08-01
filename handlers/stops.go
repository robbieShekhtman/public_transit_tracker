package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

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

func GetStopsByRoute(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		routeID := c.Param("route_id")
		if routeID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Route ID is required"})
			return
		}
		query := `
			SELECT MIN(s.stop_id) as stop_id, s.stop_name, MIN(s.stop_lat) as stop_lat, MIN(s.stop_lon) as stop_lon
			FROM stops s
			WHERE s.stop_id IN (
				SELECT DISTINCT st.stop_id
				FROM stop_times st
				JOIN trips t ON st.trip_id = t.trip_id
				WHERE t.route_id = $1
			)
			GROUP BY s.stop_name
			ORDER BY s.stop_name
		`

		rows, err := db.Query(query, routeID)
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

		if len(stops) == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "No stops found for this route"})
			return
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

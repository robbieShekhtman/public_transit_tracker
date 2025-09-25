package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"public_transport_tracker/cache"
	"time"

	"github.com/gin-gonic/gin"
)

type RouteConnectivityResponse struct {
	RouteID     string `json:"route_id"`
	FromStopID  string `json:"from_stop_id"`
	ToStopID    string `json:"to_stop_id"`
	IsConnected bool   `json:"is_connected"`
}

func GetStopConnectivity(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		fromStopID := c.Query("from_stop")
		toStopID := c.Query("to_stop")

		if fromStopID == "" || toStopID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Both from_stop and to_stop parameters are required"})
			return
		}

		cacheKey := fmt.Sprintf("stop_connectivity:%s:%s", fromStopID, toStopID)

		var routes []RouteConnectivityResponse
		err := cache.Get(cacheKey, &routes)
		if err == nil {
			c.JSON(http.StatusOK, gin.H{"connecting_routes": routes})
			return
		}

		var fromStopExists, toStopExists bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM stops WHERE stop_id = $1)", fromStopID).Scan(&fromStopExists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM stops WHERE stop_id = $1)", toStopID).Scan(&toStopExists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if !fromStopExists {
			c.JSON(http.StatusNotFound, gin.H{"error": "From stop not found"})
			return
		}
		if !toStopExists {
			c.JSON(http.StatusNotFound, gin.H{"error": "To stop not found"})
			return
		}

		query := `
			SELECT DISTINCT t.route_id, 
				MIN(CASE WHEN st1.stop_id = $1 THEN st1.stop_sequence END) as from_sequence,
				MIN(CASE WHEN st2.stop_id = $2 THEN st2.stop_sequence END) as to_sequence
			FROM trips t
			JOIN stop_times st1 ON t.trip_id = st1.trip_id AND st1.stop_id = $1
			JOIN stop_times st2 ON t.trip_id = st2.trip_id AND st2.stop_id = $2
			GROUP BY t.route_id
			HAVING MIN(CASE WHEN st1.stop_id = $1 THEN st1.stop_sequence END) < 
				   MIN(CASE WHEN st2.stop_id = $2 THEN st2.stop_sequence END)
			ORDER BY t.route_id
		`

		rows, err := db.Query(query, fromStopID, toStopID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		routes = []RouteConnectivityResponse{}
		for rows.Next() {
			var routeID string
			var fromSequence, toSequence int

			err := rows.Scan(&routeID, &fromSequence, &toSequence)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			response := RouteConnectivityResponse{
				RouteID:     routeID,
				FromStopID:  fromStopID,
				ToStopID:    toStopID,
				IsConnected: true,
			}

			routes = append(routes, response)
		}

		cache.Set(cacheKey, routes, 6*time.Hour)

		c.JSON(http.StatusOK, gin.H{"connecting_routes": routes})
	}
}

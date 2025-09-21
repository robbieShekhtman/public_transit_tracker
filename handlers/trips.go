package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"public_transport_tracker/cache"
	"time"

	"github.com/gin-gonic/gin"
)

type Trip struct {
	TripID    string `json:"trip_id"`
	RouteID   string `json:"route_id"`
	ServiceID string `json:"service_id"`
	Headsign  string `json:"trip_headsign"`
}

func GetTripsByRouteID(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		routeID := c.Param("route_id")
		cacheKey := fmt.Sprintf("routes:%s:trips", routeID)

		var trips []Trip
		err := cache.Get(cacheKey, &trips)
		if err == nil {
			c.JSON(http.StatusOK, trips)
			return
		}

		rows, err := db.Query("SELECT trip_id, route_id, service_id, trip_headsign FROM trips WHERE route_id = $1", routeID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		trips = []Trip{}
		for rows.Next() {
			var t Trip
			if err := rows.Scan(&t.TripID, &t.RouteID, &t.ServiceID, &t.Headsign); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			trips = append(trips, t)
		}

		cache.Set(cacheKey, trips, 12*time.Hour)

		c.JSON(http.StatusOK, trips)
	}
}

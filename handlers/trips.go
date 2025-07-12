package handlers

import (
	"database/sql"
	"net/http"

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

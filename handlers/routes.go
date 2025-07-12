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

package handlers

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	r := gin.Default()
	r.SetTrustedProxies([]string{"127.0.0.1"})

	api := r.Group("/")

	api.GET("/routes", GetRoutes(db))
	api.GET("/routes/:route_id/trips", GetTripsByRouteID(db))
	api.GET("/stops", GetStops(db))
	api.GET("/stops/:stop_id", GetStopByID(db))
	api.GET("/live/:route_id", GetLiveVehicles())

	return r
}

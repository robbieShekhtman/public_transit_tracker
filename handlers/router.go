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
	api.GET("/routes/:route_id/stops", GetStopsByRoute(db))
	api.GET("/stops", GetStops(db))
	api.GET("/stops/:stop_id", GetStopByID(db))
	api.GET("/live/:route_id", GetLiveVehicles())
	api.GET("/alerts", GetAlerts())
	api.GET("/trip-updates/:route_id", GetTripUpdates())
	api.POST("/users", CreateUser(db))
	api.GET("/users/:id", GetUserByID(db))
	api.GET("/users/username/:username", GetUserByUsername(db))
	api.POST("/users/:id/favorites", AddFavorite(db))
	api.GET("/users/:id/favorites", GetFavorites(db))
	api.DELETE("/users/:id/favorites/:type/:item_id", DeleteFavorite(db))

	return r
}

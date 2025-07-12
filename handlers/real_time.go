package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

type VehicleFeed struct {
	Entity []struct {
		ID      string `json:"id"`
		Vehicle struct {
			CurrentStatus       string `json:"current_status"`
			CurrentStopSequence int    `json:"current_stop_sequence"`
			OccupancyPercentage int    `json:"occupancy_percentage"`
			OccupancyStatus     string `json:"occupancy_status"`
			StopID              string `json:"stop_id"`
			Timestamp           int64  `json:"timestamp"`
			Position            struct {
				Latitude  float64 `json:"latitude"`
				Longitude float64 `json:"longitude"`
				Bearing   float64 `json:"bearing"`
			} `json:"position"`
			Trip struct {
				StartTime            string `json:"start_time"`
				RouteID              string `json:"route_id"`
				DirectionID          int    `json:"direction_id"`
				TripID               string `json:"trip_id"`
				ScheduleRelationship string `json:"schedule_relationship"`
				StartDate            string `json:"start_date"`
				LastTrip             bool   `json:"last_trip"`
				Revenue              bool   `json:"revenue"`
			} `json:"trip"`
			Vehicle struct {
				ID    string `json:"id"`
				Label string `json:"label"`
			} `json:"vehicle"`
		} `json:"vehicle"`
	} `json:"entity"`
}

type LiveVehicle struct {
	VehicleID    string  `json:"vehicle_id"`
	VehicleLabel string  `json:"label"`
	RouteID      string  `json:"route_id"`
	TripID       string  `json:"trip_id"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	Bearing      float64 `json:"bearing"`
	Occupancy    string  `json:"occupancy_status"`
	OccupancyPct int     `json:"occupancy_percentage"`
	CurrentStop  string  `json:"stop_id"`
	StopSeq      int     `json:"current_stop_sequence"`
	DirectionID  int     `json:"direction_id"`
	Timestamp    int64   `json:"timestamp"`
	Status       string  `json:"status"`
}

func GetLiveVehicles() gin.HandlerFunc {
	return func(c *gin.Context) {
		routeID := c.Param("route_id")
		feedURL := "https://cdn.mbta.com/realtime/VehiclePositions_enhanced.json"

		resp, err := http.Get(feedURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer resp.Body.Close()

		var feed VehicleFeed
		err = json.NewDecoder(resp.Body).Decode(&feed)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var result []LiveVehicle
		for _, item := range feed.Entity {
			v := item.Vehicle
			if v.Trip.RouteID == routeID {
				result = append(result, LiveVehicle{
					VehicleID:    v.Vehicle.ID,
					VehicleLabel: v.Vehicle.Label,
					RouteID:      v.Trip.RouteID,
					TripID:       v.Trip.TripID,
					Latitude:     v.Position.Latitude,
					Longitude:    v.Position.Longitude,
					Bearing:      v.Position.Bearing,
					Occupancy:    v.OccupancyStatus,
					OccupancyPct: v.OccupancyPercentage,
					CurrentStop:  v.StopID,
					StopSeq:      v.CurrentStopSequence,
					DirectionID:  v.Trip.DirectionID,
					Timestamp:    v.Timestamp,
					Status:       v.CurrentStatus,
				})
			}
		}

		c.JSON(http.StatusOK, result)
	}
}

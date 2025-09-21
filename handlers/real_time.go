package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"public_transport_tracker/cache"
	"time"

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
		cacheKey := fmt.Sprintf("live:%s", routeID)

		var result []LiveVehicle
		err := cache.Get(cacheKey, &result)
		if err == nil {
			c.JSON(http.StatusOK, result)
			return
		}

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

		result = []LiveVehicle{}
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

		cache.Set(cacheKey, result, 10*time.Second)

		c.JSON(http.StatusOK, result)
	}
}

type AlertFeed struct {
	Entity []struct {
		ID    string `json:"id"`
		Alert struct {
			HeaderText struct {
				Translation []struct {
					Text string `json:"text"`
				} `json:"translation"`
			} `json:"header_text"`
			DescriptionText struct {
				Translation []struct {
					Text string `json:"text"`
				} `json:"translation"`
			} `json:"description_text"`
			Effect         string `json:"effect"`
			InformedEntity []struct {
				RouteID string `json:"route_id"`
				StopID  string `json:"stop_id"`
			} `json:"informed_entity"`
			ActivePeriod []struct {
				Start int64 `json:"start"`
				End   int64 `json:"end"`
			} `json:"active_period"`
		} `json:"alert"`
	} `json:"entity"`
}

func GetAlerts() gin.HandlerFunc {
	return func(c *gin.Context) {
		cacheKey := "alerts:all"

		var alerts []interface{}
		err := cache.Get(cacheKey, &alerts)
		if err == nil {
			c.JSON(http.StatusOK, alerts)
			return
		}

		url := "https://cdn.mbta.com/realtime/Alerts_enhanced.json"
		resp, err := http.Get(url)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer resp.Body.Close()

		var feed AlertFeed
		err = json.NewDecoder(resp.Body).Decode(&feed)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		alerts = make([]interface{}, len(feed.Entity))
		for i, entity := range feed.Entity {
			alerts[i] = entity
		}

		cache.Set(cacheKey, alerts, 60*time.Second)

		c.JSON(http.StatusOK, alerts)
	}
}

type TripUpdateFeed struct {
	Entity []struct {
		TripUpdate struct {
			Trip struct {
				TripID  string `json:"trip_id"`
				RouteID string `json:"route_id"`
			} `json:"trip"`
			StopTimeUpdate []struct {
				StopID  string `json:"stop_id"`
				Arrival struct {
					Time        int64 `json:"time"`
					Uncertainty int   `json:"uncertainty"`
				} `json:"arrival"`
			} `json:"stop_time_update"`
		} `json:"trip_update"`
	} `json:"entity"`
}

func GetTripUpdates() gin.HandlerFunc {
	return func(c *gin.Context) {
		routeID := c.Param("route_id")
		cacheKey := fmt.Sprintf("trip-updates:%s", routeID)

		var result []interface{}
		err := cache.Get(cacheKey, &result)
		if err == nil {
			c.JSON(http.StatusOK, result)
			return
		}

		url := "https://cdn.mbta.com/realtime/TripUpdates_enhanced.json"

		resp, err := http.Get(url)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer resp.Body.Close()

		var feed TripUpdateFeed
		err = json.NewDecoder(resp.Body).Decode(&feed)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		result = []interface{}{}
		for _, item := range feed.Entity {
			if item.TripUpdate.Trip.RouteID == routeID {
				result = append(result, item)
			}
		}

		cache.Set(cacheKey, result, 10*time.Second)

		c.JSON(http.StatusOK, result)
	}
}

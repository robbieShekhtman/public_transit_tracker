package handlers

import (
	"database/sql"
	"net/http"
	"public_transport_tracker/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

func AddFavorite(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("id")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var req struct {
			ItemID string `json:"item_id"`
			Type   string `json:"type"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.Type != "route" && req.Type != "stop" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Type must be 'route' or 'stop'"})
			return
		}

		fav, err := models.AddFavorite(db, userID, req.ItemID, req.Type)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, fav)
	}
}

func GetFavorites(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("id")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		favorites, err := models.GetFavorites(db, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, favorites)
	}
}

func DeleteFavorite(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {

		userIDStr := c.Param("id")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		itemType := c.Param("type")
		itemID := c.Param("item_id")

		if itemType != "route" && itemType != "stop" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Type must be 'route' or 'stop'"})
			return
		}

		err = models.DeleteFavorite(db, userID, itemID, itemType)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Favorite deleted successfully"})
	}
}

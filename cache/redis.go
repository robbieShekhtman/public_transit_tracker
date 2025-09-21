package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	RedisClient *redis.Client
	ctx         = context.Background()
)

func InitializeRedis() error {
	host := os.Getenv("REDIS_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("REDIS_PORT")
	if port == "" {
		port = "6379"
	}

	password := os.Getenv("REDIS_PASSWORD")
	if password == "" {
		password = ""
	}

	db := os.Getenv("REDIS_DB")
	if db == "" {
		db = "0"
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
		DB:       0,
	})

	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		log.Printf("Failed to connect to Redis: %v", err)
		return err
	}

	log.Println("Successfully connected to Redis")
	return nil
}

func Get(key string, dest interface{}) error {
	if RedisClient == nil {
		return fmt.Errorf("redis client not initialized")
	}

	val, err := RedisClient.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return fmt.Errorf("key not found")
		}
		return err
	}

	return json.Unmarshal([]byte(val), dest)
}

func Set(key string, value interface{}, ttl time.Duration) error {
	if RedisClient == nil {
		return fmt.Errorf("redis client not initialized")
	}

	jsonData, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return RedisClient.Set(ctx, key, jsonData, ttl).Err()
}

func Delete(key string) error {
	if RedisClient == nil {
		return fmt.Errorf("redis client not initialized")
	}

	return RedisClient.Del(ctx, key).Err()
}

func Health() error {
	if RedisClient == nil {
		return fmt.Errorf("redis client not initialized")
	}

	_, err := RedisClient.Ping(ctx).Result()
	return err
}

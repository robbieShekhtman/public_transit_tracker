package parser

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strconv"

	_ "github.com/lib/pq"
)

func ConnectDB() (*sql.DB, error) {
	host := os.Getenv("PGHOST")
	port := os.Getenv("PGPORT")
	user := os.Getenv("PGUSER")
	password := os.Getenv("PGPASSWORD")
	dbname := os.Getenv("PGDATABASE")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	return sql.Open("postgres", connStr)
}

func LoadStops(db *sql.DB, filePath string) error {
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer f.Close()

	reader := csv.NewReader(f)
	rows, err := reader.ReadAll()
	if err != nil {
		return err
	}

	for i, row := range rows {
		if i == 0 {
			continue
		}

		lat, lon := sql.NullFloat64{}, sql.NullFloat64{}

		if row[4] != "" {
			if v, err := strconv.ParseFloat(row[4], 64); err == nil {
				lat = sql.NullFloat64{Float64: v, Valid: true}
			}
		}
		if row[5] != "" {
			if v, err := strconv.ParseFloat(row[5], 64); err == nil {
				lon = sql.NullFloat64{Float64: v, Valid: true}
			}
		}

		_, err = db.Exec(`
            INSERT INTO stops (stop_id, stop_name, stop_lat, stop_lon)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (stop_id) DO NOTHING;
        `, row[0], row[2], lat, lon)

		if err != nil {
			log.Printf("insert error stops at line %d: %v\n", i, err)
		}
	}

	fmt.Printf("Loaded %d stops\n", len(rows)-1)
	return nil
}

func LoadRoutes(db *sql.DB, filePath string) error {
	f, _ := os.Open(filePath)
	defer f.Close()
	reader := csv.NewReader(f)
	rows, _ := reader.ReadAll()

	for i, row := range rows {
		if i == 0 {
			continue
		}

		routeType := sql.NullInt64{}
		if row[5] != "" {
			if v, err := strconv.ParseInt(row[5], 10, 64); err == nil {
				routeType = sql.NullInt64{Int64: v, Valid: true}
			}
		}

		_, err := db.Exec(`
            INSERT INTO routes (route_id, agency_id, route_short_name, route_long_name, route_type)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (route_id) DO NOTHING;
        `, row[0], row[1], row[2], row[3], routeType)

		if err != nil {
			log.Printf("route insert error at line %d: %v", i, err)
		}
	}

	fmt.Printf("Loaded %d routes\n", len(rows)-1)
	return nil
}

func LoadTrips(db *sql.DB, filePath string) error {
	f, _ := os.Open(filePath)
	defer f.Close()
	reader := csv.NewReader(f)
	rows, _ := reader.ReadAll()

	for i, row := range rows {
		if i == 0 {
			continue
		}

		tripHeadsign := sql.NullString{}
		if len(row) > 3 && row[3] != "" {
			tripHeadsign = sql.NullString{String: row[3], Valid: true}
		}

		_, err := db.Exec(`
            INSERT INTO trips (trip_id, route_id, service_id, trip_headsign)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (trip_id) DO NOTHING;
        `, row[2], row[0], row[1], tripHeadsign)

		if err != nil {
			log.Printf("trip insert error at line %d: %v", i, err)
		}
	}

	fmt.Printf("Loaded %d trips\n", len(rows)-1)
	return nil
}

func LoadStopTimes(db *sql.DB, filePath string) error {
	f, _ := os.Open(filePath)
	defer f.Close()
	reader := csv.NewReader(f)
	rows, _ := reader.ReadAll()

	for i, row := range rows {
		if i == 0 {
			continue
		}

		stopSequence := sql.NullInt64{}
		if len(row) > 4 && row[4] != "" {
			if v, err := strconv.ParseInt(row[4], 10, 64); err == nil {
				stopSequence = sql.NullInt64{Int64: v, Valid: true}
			}
		}

		arrival := sql.NullString{}
		if len(row) > 1 && row[1] != "" {
			arrival = sql.NullString{String: row[1], Valid: true}
		}

		departure := sql.NullString{}
		if len(row) > 2 && row[2] != "" {
			departure = sql.NullString{String: row[2], Valid: true}
		}

		_, err := db.Exec(`
            INSERT INTO stop_times (trip_id, arrival_time, departure_time, stop_id, stop_sequence)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING;
        `, row[0], arrival, departure, row[3], stopSequence)

		if err != nil {
			log.Printf("stop times insert error at line %d: %v", i, err)
		}
	}

	fmt.Printf("Loaded %d stop_times\n", len(rows)-1)
	return nil
}

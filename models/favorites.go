package models

import "database/sql"

type Favorite struct {
	ID     int    `json:"id"`
	Type   string `json:"type"`
	ItemID string `json:"item_id"`
}

func AddFavorite(db *sql.DB, userID int, itemID, itemType string) (Favorite, error) {
	var f Favorite
	err := db.QueryRow(`
		INSERT INTO favorites (user_id, item_id, type)
		VALUES ($1, $2, $3)
		RETURNING id, item_id, type
	`, userID, itemID, itemType).Scan(&f.ID, &f.ItemID, &f.Type)

	return f, err
}

func GetFavorites(db *sql.DB, userID int) ([]Favorite, error) {
	rows, err := db.Query(`
        SELECT id, item_id, type 
        FROM favorites 
        WHERE user_id = $1
    `, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var favorites []Favorite
	for rows.Next() {
		var f Favorite
		if err := rows.Scan(&f.ID, &f.ItemID, &f.Type); err != nil {
			return nil, err
		}
		favorites = append(favorites, f)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return favorites, nil
}

func DeleteFavorite(db *sql.DB, userID int, itemID string, itemType string) error {
	_, err := db.Exec(`
		DELETE FROM favorites 
		WHERE user_id = $1 AND item_id = $2 AND type = $3
	`, userID, itemID, itemType)

	return err
}

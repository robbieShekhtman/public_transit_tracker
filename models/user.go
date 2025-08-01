package models

import "database/sql"

type User struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	CreatedAt string `json:"created_at"`
}

func CreateUser(db *sql.DB, username string) (User, error) {
	var u User
	err := db.QueryRow(`
        INSERT INTO users (username) 
        VALUES ($1)
        RETURNING id, username, created_at
    `, username).Scan(&u.ID, &u.Username, &u.CreatedAt)

	return u, err
}

func GetUserByID(db *sql.DB, id int) (User, error) {
	var u User
	err := db.QueryRow(`
        SELECT id, username, created_at 
        FROM users 
        WHERE id = $1
    `, id).Scan(&u.ID, &u.Username, &u.CreatedAt)

	return u, err
}

func GetUserByUsername(db *sql.DB, username string) (User, error) {
	var u User
	err := db.QueryRow(`
        SELECT id, username, created_at 
        FROM users 
        WHERE username = $1
    `, username).Scan(&u.ID, &u.Username, &u.CreatedAt)

	return u, err
}

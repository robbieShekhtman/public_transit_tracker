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
func GetAllUsers(db *sql.DB) ([]User, error) {
	var users []User

	rows, err := db.Query(`SELECT id, username, created_at FROM users`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Username, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
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

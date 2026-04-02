package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"

	"notification-service/db"
	"notification-service/kafka"
	"notification-service/models"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[Notification-Service] No .env file found, using environment variables")
	}

	db.Connect()
	kafka.StartConsumer()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", withCORS(handleHealth))
	mux.HandleFunc("/notifications", withCORS(handleNotifications))
	mux.HandleFunc("/notifications/", withCORS(handleNotificationActions))
	mux.HandleFunc("/profile", withCORS(handleProfile))
	mux.HandleFunc("/profile/emergency-contacts", withCORS(handleEmergencyContacts))
	mux.HandleFunc("/profile/emergency-contacts/", withCORS(handleEmergencyContactByID))

	log.Printf("[Notification-Service] Starting on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("[Notification-Service] Failed to start server: %v", err)
	}
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"service": "notification-service",
		"status":  "healthy",
		"time":    time.Now().Format(time.RFC3339),
	})
}

func handleNotifications(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, order_id, product_id, type, severity, title, message, status, read, sent_at
		FROM notifications
		ORDER BY sent_at DESC
		LIMIT 100
	`)
	if err != nil {
		http.Error(w, "Failed to fetch notifications", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := make([]models.Notification, 0)
	unreadCount := 0
	for rows.Next() {
		var item models.Notification
		if scanErr := rows.Scan(
			&item.ID,
			&item.OrderID,
			&item.ProductID,
			&item.Type,
			&item.Severity,
			&item.Title,
			&item.Message,
			&item.Status,
			&item.Read,
			&item.SentAt,
		); scanErr == nil {
			if !item.Read {
				unreadCount++
			}
			items = append(items, item)
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"notifications": items,
		"unread_count":  unreadCount,
	})
}

func handleNotificationActions(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/notifications/")
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) == 1 && parts[0] == "read-all" && r.Method == http.MethodPatch {
		if _, err := db.DB.Exec("UPDATE notifications SET read = TRUE WHERE read = FALSE"); err != nil {
			http.Error(w, "Failed to update notifications", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"message": "All notifications marked as read"})
		return
	}
	if len(parts) < 2 || parts[1] != "read" || r.Method != http.MethodPatch {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	id, err := strconv.Atoi(parts[0])
	if err != nil {
		http.Error(w, "Invalid notification ID", http.StatusBadRequest)
		return
	}

	if _, err := db.DB.Exec("UPDATE notifications SET read = TRUE WHERE id = $1", id); err != nil {
		http.Error(w, "Failed to update notification", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Notification marked as read"})
}

func handleProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	profile, err := loadProfile()
	if err != nil {
		http.Error(w, "Failed to fetch profile", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"profile": profile})
}

func handleEmergencyContacts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Email     string `json:"email"`
		IsPrimary bool   `json:"is_primary"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var contact models.EmergencyContact
	err := db.DB.QueryRow(`
		INSERT INTO emergency_contacts (profile_id, email, is_primary)
		VALUES (1, $1, $2)
		RETURNING id, email, is_primary
	`, strings.TrimSpace(payload.Email), payload.IsPrimary).
		Scan(&contact.ID, &contact.Email, &contact.IsPrimary)
	if err != nil {
		http.Error(w, "Failed to add emergency contact", http.StatusInternalServerError)
		return
	}

	if contact.IsPrimary {
		_, _ = db.DB.Exec("UPDATE emergency_contacts SET is_primary = FALSE WHERE id <> $1", contact.ID)
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{"contact": contact})
}

func handleEmergencyContactByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/profile/emergency-contacts/"))
	if err != nil {
		http.Error(w, "Invalid contact ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodPut:
		var payload struct {
			Email     string `json:"email"`
			IsPrimary bool   `json:"is_primary"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		_, err = db.DB.Exec(
			"UPDATE emergency_contacts SET email = $1, is_primary = $2 WHERE id = $3",
			strings.TrimSpace(payload.Email),
			payload.IsPrimary,
			id,
		)
		if err != nil {
			http.Error(w, "Failed to update contact", http.StatusInternalServerError)
			return
		}
		if payload.IsPrimary {
			_, _ = db.DB.Exec("UPDATE emergency_contacts SET is_primary = FALSE WHERE id <> $1", id)
		}
		writeJSON(w, http.StatusOK, map[string]string{"message": "Contact updated"})
	case http.MethodDelete:
		if _, err := db.DB.Exec("DELETE FROM emergency_contacts WHERE id = $1", id); err != nil {
			http.Error(w, "Failed to delete contact", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"message": "Contact deleted"})
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func loadProfile() (models.AdminProfile, error) {
	var profile models.AdminProfile
	err := db.DB.QueryRow("SELECT id, name, email, role FROM admin_profiles WHERE id = 1").
		Scan(&profile.ID, &profile.Name, &profile.Email, &profile.Role)
	if err != nil {
		return profile, err
	}

	rows, err := db.DB.Query("SELECT id, email, is_primary FROM emergency_contacts WHERE profile_id = 1 ORDER BY is_primary DESC, id ASC")
	if err != nil {
		return profile, err
	}
	defer rows.Close()

	profile.EmergencyContacts = make([]models.EmergencyContact, 0)
	for rows.Next() {
		var contact models.EmergencyContact
		if scanErr := rows.Scan(&contact.ID, &contact.Email, &contact.IsPrimary); scanErr == nil {
			profile.EmergencyContacts = append(profile.EmergencyContacts, contact)
		}
	}

	return profile, nil
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

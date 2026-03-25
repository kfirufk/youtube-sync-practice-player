package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Auth     AuthConfig     `yaml:"auth"`
	Email    EmailConfig    `yaml:"email"`
	Google   GoogleConfig   `yaml:"google"`
	Site     SiteConfig     `yaml:"site"`
}

type ServerConfig struct {
	Host string `yaml:"host"`
	Port int    `yaml:"port"`
}

type DatabaseConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Name     string `yaml:"name"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	SSLMode  string `yaml:"sslmode"`
}

type AuthConfig struct {
	SessionCookieName   string `yaml:"session_cookie_name"`
	SessionTTLHours     int    `yaml:"session_ttl_hours"`
	MagicLinkTTLMinutes int    `yaml:"magic_link_ttl_minutes"`
}

type EmailConfig struct {
	FromEmail    string     `yaml:"from_email"`
	ReplyToEmail string     `yaml:"reply_to_email"`
	SMTP         SMTPConfig `yaml:"smtp"`
}

type SMTPConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
}

type GoogleConfig struct {
	ClientID string `yaml:"client_id"`
}

type SiteConfig struct {
	Name         string `yaml:"name"`
	Domain       string `yaml:"domain"`
	BaseURL      string `yaml:"base_url"`
	ContactEmail string `yaml:"contact_email"`
}

func defaultConfig() Config {
	return Config{
		Server: ServerConfig{
			Host: "0.0.0.0",
			Port: 8028,
		},
		Database: DatabaseConfig{
			Host:    "127.0.0.1",
			Port:    5432,
			Name:    "youtube_sync_practice_player",
			User:    "postgres",
			SSLMode: "disable",
		},
		Auth: AuthConfig{
			SessionCookieName:   "sync_session",
			SessionTTLHours:     24 * 30,
			MagicLinkTTLMinutes: 20,
		},
		Email: EmailConfig{
			SMTP: SMTPConfig{
				Host: "smtp.resend.com",
				Port: 465,
				User: "resend",
			},
		},
		Google: GoogleConfig{},
		Site: SiteConfig{
			Name:         "sync.tvguitar.com",
			Domain:       "sync.tvguitar.com",
			BaseURL:      "https://sync.tvguitar.com",
			ContactEmail: "ufkfir@icloud.com",
		},
	}
}

func LoadConfig(path string) (Config, error) {
	cfg := defaultConfig()

	raw, err := os.ReadFile(path)
	if err != nil {
		return Config{}, fmt.Errorf("read config %q: %w", path, err)
	}

	if err := yaml.Unmarshal(raw, &cfg); err != nil {
		return Config{}, fmt.Errorf("parse config %q: %w", path, err)
	}

	cfg.normalize()
	return cfg, nil
}

func (cfg *Config) normalize() {
	if strings.TrimSpace(cfg.Server.Host) == "" {
		cfg.Server.Host = "0.0.0.0"
	}
	if cfg.Server.Port <= 0 {
		cfg.Server.Port = 8028
	}

	if strings.TrimSpace(cfg.Database.Host) == "" {
		cfg.Database.Host = "127.0.0.1"
	}
	if cfg.Database.Port <= 0 {
		cfg.Database.Port = 5432
	}
	if strings.TrimSpace(cfg.Database.SSLMode) == "" {
		cfg.Database.SSLMode = "disable"
	}

	cfg.Auth.SessionCookieName = strings.TrimSpace(cfg.Auth.SessionCookieName)
	if cfg.Auth.SessionCookieName == "" {
		cfg.Auth.SessionCookieName = "sync_session"
	}
	if cfg.Auth.SessionTTLHours <= 0 {
		cfg.Auth.SessionTTLHours = 24 * 30
	}
	if cfg.Auth.MagicLinkTTLMinutes <= 0 {
		cfg.Auth.MagicLinkTTLMinutes = 20
	}

	cfg.Email.FromEmail = strings.TrimSpace(cfg.Email.FromEmail)
	cfg.Email.ReplyToEmail = strings.TrimSpace(cfg.Email.ReplyToEmail)
	cfg.Email.SMTP.Host = strings.TrimSpace(cfg.Email.SMTP.Host)
	if cfg.Email.SMTP.Host == "" {
		cfg.Email.SMTP.Host = "smtp.resend.com"
	}
	if cfg.Email.SMTP.Port <= 0 {
		cfg.Email.SMTP.Port = 465
	}
	cfg.Email.SMTP.User = strings.TrimSpace(cfg.Email.SMTP.User)
	if cfg.Email.SMTP.User == "" {
		cfg.Email.SMTP.User = "resend"
	}
	cfg.Email.SMTP.Password = strings.TrimSpace(cfg.Email.SMTP.Password)
	cfg.Google.ClientID = strings.TrimSpace(cfg.Google.ClientID)

	if strings.TrimSpace(cfg.Site.Name) == "" {
		cfg.Site.Name = "sync.tvguitar.com"
	}
	if strings.TrimSpace(cfg.Site.Domain) == "" {
		cfg.Site.Domain = "sync.tvguitar.com"
	}
	if strings.TrimSpace(cfg.Site.BaseURL) == "" {
		cfg.Site.BaseURL = "https://sync.tvguitar.com"
	}
	cfg.Site.BaseURL = strings.TrimRight(strings.TrimSpace(cfg.Site.BaseURL), "/")
	if strings.TrimSpace(cfg.Site.ContactEmail) == "" {
		cfg.Site.ContactEmail = "ufkfir@icloud.com"
	}
}

func (cfg DatabaseConfig) ConnString() string {
	parts := []string{
		"host=" + cfg.Host,
		"port=" + strconv.Itoa(cfg.Port),
		"dbname=" + cfg.Name,
		"user=" + cfg.User,
		"sslmode=" + cfg.SSLMode,
	}
	if strings.TrimSpace(cfg.Password) != "" {
		parts = append(parts, "password="+cfg.Password)
	}
	return strings.Join(parts, " ")
}

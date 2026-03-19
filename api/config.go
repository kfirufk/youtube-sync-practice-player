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
	Supabase SupabaseConfig `yaml:"supabase"`
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

type SupabaseConfig struct {
	URL             string `yaml:"url"`
	PublishableKey  string `yaml:"publishable_key"`
	ServiceRoleKey  string `yaml:"service_role_key"`
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
		Supabase: SupabaseConfig{
			URL:            "https://gsjgqebkxcdcbtklcfjf.supabase.co",
			PublishableKey: "sb_publishable_lHmr9O_u-I3UgH-ze5rLpQ_9fb8R_Pn",
		},
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

	cfg.Supabase.URL = strings.TrimSpace(strings.TrimRight(cfg.Supabase.URL, "/"))
	cfg.Supabase.PublishableKey = strings.TrimSpace(cfg.Supabase.PublishableKey)
	cfg.Supabase.ServiceRoleKey = strings.TrimSpace(cfg.Supabase.ServiceRoleKey)

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

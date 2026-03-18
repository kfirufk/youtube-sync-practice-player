package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func ApplySQLPatches(ctx context.Context, pool *pgxpool.Pool, patchDir string) error {
	if _, err := os.Stat(patchDir); err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("stat patch directory: %w", err)
	}

	if _, err := pool.Exec(ctx, `
		create table if not exists schema_patches (
			patch_name text primary key,
			checksum text not null,
			applied_at timestamptz not null default now()
		)
	`); err != nil {
		return fmt.Errorf("prepare schema_patches: %w", err)
	}

	entries, err := os.ReadDir(patchDir)
	if err != nil {
		return fmt.Errorf("read patch directory: %w", err)
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(strings.ToLower(entry.Name()), ".sql") {
			continue
		}

		name := entry.Name()
		var alreadyApplied bool
		if err := pool.QueryRow(ctx, `select exists(select 1 from schema_patches where patch_name = $1)`, name).Scan(&alreadyApplied); err != nil {
			return fmt.Errorf("check patch %q: %w", name, err)
		}
		if alreadyApplied {
			continue
		}

		path := filepath.Join(patchDir, name)
		sqlBytes, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("read patch %q: %w", name, err)
		}

		tx, err := pool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("begin patch %q: %w", name, err)
		}

		if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("apply patch %q: %w", name, err)
		}

		sum := sha256.Sum256(sqlBytes)
		if _, err := tx.Exec(ctx, `
			insert into schema_patches (patch_name, checksum, applied_at)
			values ($1, $2, now())
		`, name, hex.EncodeToString(sum[:])); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("record patch %q: %w", name, err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("commit patch %q: %w", name, err)
		}
	}

	return nil
}

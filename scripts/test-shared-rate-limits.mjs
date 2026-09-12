import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { PGlite } = await import(
  pathToFileURL(
    resolve(".codex-tmp/db-policy-test/node_modules/@electric-sql/pglite/dist/index.js"),
  ).href
);
const db = new PGlite();
const key = (value) => createHash("sha256").update(value).digest("hex");
const migration = readFileSync(
  "supabase/migrations/20260912190000_add_shared_rate_limits.sql",
  "utf8",
);

try {
  await db.exec("create role authenticated; create role anon; create role service_role bypassrls;");
  await db.exec(migration);
  await db.exec("set role service_role;");

  const first = (
    await db.query(
      `select * from consume_rate_limit('${key("lead:one")}', 2, 60)`,
    )
  ).rows[0];
  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);
  assert.ok(first.reset_at);

  const second = (
    await db.query(
      `select * from consume_rate_limit('${key("lead:one")}', 2, 60)`,
    )
  ).rows[0];
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);

  const blocked = (
    await db.query(
      `select * from consume_rate_limit('${key("lead:one")}', 2, 60)`,
    )
  ).rows[0];
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);

  const independent = (
    await db.query(
      `select * from consume_rate_limit('${key("lead:two")}', 1, 60)`,
    )
  ).rows[0];
  assert.equal(independent.allowed, true);

  await db.exec(
    `insert into rate_limit_buckets values
      ('${key("expired")}', now()-interval '2 days', 1, now()-interval '2 days', now()-interval '2 days')`,
  );
  await db.query(
    `select * from consume_rate_limit('${key("cleanup-trigger")}', 2, 60)`,
  );
  assert.equal(
    (await db.query(`select count(*)::int as count from rate_limit_buckets where key_hash='${key("expired")}'`)).rows[0].count,
    0,
  );

  await db.exec(
    `update rate_limit_buckets set window_started_at=window_started_at-interval '2 minutes'
     where key_hash='${key("lead:one")}'`,
  );
  const rolled = (
    await db.query(
      `select * from consume_rate_limit('${key("lead:one")}', 2, 60)`,
    )
  ).rows[0];
  assert.equal(rolled.allowed, true);
  assert.equal(rolled.remaining, 1);

  await assert.rejects(
    db.query("select * from consume_rate_limit('raw-ip-address', 2, 60)"),
  );
  await assert.rejects(
    db.query(`select * from consume_rate_limit('${key("bad-limit")}', 0, 60)`),
  );

  await db.exec("reset role; set role authenticated;");
  await assert.rejects(db.query("select * from rate_limit_buckets"));
  await assert.rejects(
    db.query(`select * from consume_rate_limit('${key("browser")}', 2, 60)`),
  );

  console.log(
    "OK shared rate-limit counting, isolation, rollover, validation and browser denial",
  );
} finally {
  await db.close();
}

---
'@alithya-oss/plugin-time-saver-backend': major
---

Upgraded time saver DB client to use knex functions to build queries. Previously, raw queries were used that were only compatible with PostgreSQL. Users are now able to use other databases and even deploy locally using sqlite.

/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('ts_template_time_savings', table => {
    table.comment('Table contains template time savings with relation to the templateTaskId');
    table
      .bigIncrements('index')
      .notNullable()
      .comment('An insert counter to ensure ordering');
    table.uuid('id').notNullable().comment('The ID of the time saver result');
    table
      .dateTime('created_at')
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment('The timestamp when this entry was created');
    table.string('template_task_id').comment('The template task ID');
    table
      .string('template_name')
      .comment('The template name used as template entity_reference');
    table.string('team').comment('The team name of saved time');
    table
      .float('time_saved', 2)
      .comment('The time saved by the team within template task ID, in hours');
    table.string('template_task_status').comment('The template task status');
    table
      .string('created_by')
      .comment('the entity reference related to the user who launched the template');
    });
  };

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTable('ts_template_time_savings');
};
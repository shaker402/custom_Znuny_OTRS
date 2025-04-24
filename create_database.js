const DBConnection = require('./db');

(async () => {
  try {
    // Create `case_files` table
    await DBConnection.schema.createTable('case_files', (table) => {
      table.increments('id').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('title', 255).notNullable();
      table.string('status', 50).notNullable();
      table.string('ticket_number', 50).unique();
      table.timestamp('created_at').defaultTo(DBConnection.fn.now());
      table.timestamp('updated_at').defaultTo(DBConnection.fn.now());
    });
    console.log('Table `case_files` created.');

    // Create `detections` table
    await DBConnection.schema.createTable('detections', (table) => {
      table.increments('id').primary();
      table.uuid('uuid').notNullable().unique();
      table.integer('case_file_id').unsigned().notNullable()
        .references('id').inTable('case_files').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.integer('severity').notNullable();
      table.timestamp('timestamp').notNullable();
      table.json('indicators');
      table.json('rules');
    });
    console.log('Table `detections` created.');

    // Create `context_processes` table
    await DBConnection.schema.createTable('context_processes', (table) => {
      table.increments('id').primary();
      table.integer('detection_id').unsigned().notNullable()
        .references('id').inTable('detections').onDelete('CASCADE');
      table.string('process_id', 255).notNullable();
      table.string('process_name', 255).notNullable();
    });
    console.log('Table `context_processes` created.');

    // Create `context_files` table
    await DBConnection.schema.createTable('context_files', (table) => {
      table.increments('id').primary();
      table.integer('detection_id').unsigned().notNullable()
        .references('id').inTable('detections').onDelete('CASCADE');
      table.string('file_id', 255).notNullable();
      table.string('file_name', 255).notNullable();
    });
    console.log('Table `context_files` created.');

    // Create `context_flows` table
    await DBConnection.schema.createTable('context_flows', (table) => {
      table.increments('id').primary();
      table.integer('detection_id').unsigned().notNullable()
        .references('id').inTable('detections').onDelete('CASCADE');
      table.string('flow_id', 255).notNullable();
      table.string('source_ip', 45).notNullable();
      table.string('destination_ip', 45).notNullable();
    });
    console.log('Table `context_flows` created.');

    // Create `context_registries` table
    await DBConnection.schema.createTable('context_registries', (table) => {
      table.increments('id').primary();
      table.integer('detection_id').unsigned().notNullable()
        .references('id').inTable('detections').onDelete('CASCADE');
      table.string('registry_id', 255).notNullable();
      table.string('registry_key', 255).notNullable();
      table.text('registry_value');
    });
    console.log('Table `context_registries` created.');

    // Create `audit_logs` table
    await DBConnection.schema.createTable('audit_logs', (table) => {
      table.increments('id').primary();
      table.integer('case_file_id').unsigned().notNullable()
        .references('id').inTable('case_files').onDelete('CASCADE');
      table.string('playbook_name', 255).notNullable();
      table.integer('stage').notNullable();
      table.text('message').notNullable();
      table.boolean('result_had_errors').defaultTo(false);
      table.boolean('result_had_warnings').defaultTo(false);
      table.timestamp('timestamp').defaultTo(DBConnection.fn.now());
    });
    console.log('Table `audit_logs` created.');

    // Create `tickets` table
    await DBConnection.schema.createTable('tickets', (table) => {
      table.increments('id').primary();
      table.integer('case_file_id').unsigned().notNullable()
        .references('id').inTable('case_files').onDelete('CASCADE');
      table.string('ticket_number', 50).unique().notNullable();
      table.string('state', 50).notNullable();
      table.string('priority', 50).notNullable();
      table.string('queue', 255).notNullable();
      table.timestamp('created_at').defaultTo(DBConnection.fn.now());
      table.timestamp('updated_at').defaultTo(DBConnection.fn.now());
    });
    console.log('Table `tickets` created.');

    console.log('All tables created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    DBConnection.destroy();
  }
})();
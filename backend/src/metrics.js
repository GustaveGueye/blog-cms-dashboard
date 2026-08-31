// Metrics module - CRUD + summaries
import { db, get, all, run } from './db.js';

export async function recordMetric(userId, metricData) {
  const { name, value, unit } = metricData;
  
  if (!name) throw new Error('Metric name is required');
  
  const result = await run(
    'INSERT INTO metrics (user_id, name, value, unit) VALUES (?, ?, ?, ?)',
    [userId, name, value, unit || null]
  );
  
  return result;
}

export async function getMetricsByUser(userId, options = {}) {
  const { name, limit = 50 } = options;
  
  let where = 'WHERE user_id = ?';
  const params = [userId];
  
  if (name) {
    where += ' AND name = ?';
    params.push(name);
  }
  
  return await all(
    `SELECT * FROM metrics ${where} ORDER BY timestamp DESC LIMIT ?`,
    [...params, limit]
  );
}

export async function getMetricsSummary(userId) {
  const result = await all(
    `SELECT name, COUNT(*) as count, AVG(value) as avg_value, MIN(value) as min_value, MAX(value) as max_value FROM metrics WHERE user_id = ? GROUP BY name`,
    [userId]
  );
  
  const summary = {};
  result.forEach(row => {
    summary[row.name] = {
      count: row.count,
      average: row.avg_value ? parseFloat(row.avg_value.toFixed(2)) : 0,
      min: row.min_value,
      max: row.max_value
    };
  });
  
  return summary;
}
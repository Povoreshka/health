const { query } = require('../config/database');

class HealthEntry {
    // Получить записи пользователя
    static async getByUserId(userId, limit = 30) {
        const result = await query(
            `SELECT id, date, weight, body_fat, muscle_mass, chest, waist, hips,
                    thigh, biceps, avg_heart_rate, max_heart_rate, calories,
                    protein, fats, carbs, water, energy_level, pain_level,
                    sleep_quality, notes, created_at
             FROM health_entries
             WHERE user_id = $1
             ORDER BY date DESC, created_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }

    // Получить запись по дате
    static async getByDate(userId, date) {
        const result = await query(
            `SELECT id, date, weight, body_fat, muscle_mass, chest, waist, hips,
                    thigh, biceps, avg_heart_rate, max_heart_rate, calories,
                    protein, fats, carbs, water, energy_level, pain_level,
                    sleep_quality, notes, created_at
             FROM health_entries
             WHERE user_id = $1 AND date = $2`,
            [userId, date]
        );
        return result.rows[0];
    }

    // Создать запись
    static async create(entryData) {
        const {
            user_id, date, weight, body_fat, muscle_mass, chest, waist, hips,
            thigh, biceps, avg_heart_rate, max_heart_rate, calories, protein,
            fats, carbs, water, energy_level, pain_level, sleep_quality, notes
        } = entryData;

        const result = await query(
            `INSERT INTO health_entries 
             (user_id, date, weight, body_fat, muscle_mass, chest, waist, hips,
              thigh, biceps, avg_heart_rate, max_heart_rate, calories, protein,
              fats, carbs, water, energy_level, pain_level, sleep_quality, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
                     $14, $15, $16, $17, $18, $19, $20, $21)
             ON CONFLICT (user_id, date) DO UPDATE SET
                weight = EXCLUDED.weight,
                body_fat = EXCLUDED.body_fat,
                muscle_mass = EXCLUDED.muscle_mass,
                chest = EXCLUDED.chest,
                waist = EXCLUDED.waist,
                hips = EXCLUDED.hips,
                thigh = EXCLUDED.thigh,
                biceps = EXCLUDED.biceps,
                avg_heart_rate = EXCLUDED.avg_heart_rate,
                max_heart_rate = EXCLUDED.max_heart_rate,
                calories = EXCLUDED.calories,
                protein = EXCLUDED.protein,
                fats = EXCLUDED.fats,
                carbs = EXCLUDED.carbs,
                water = EXCLUDED.water,
                energy_level = EXCLUDED.energy_level,
                pain_level = EXCLUDED.pain_level,
                sleep_quality = EXCLUDED.sleep_quality,
                notes = EXCLUDED.notes
             RETURNING id, date, weight, body_fat, muscle_mass, chest, waist, hips,
                       thigh, biceps, avg_heart_rate, max_heart_rate, calories,
                       protein, fats, carbs, water, energy_level, pain_level,
                       sleep_quality, notes, created_at`,
            [user_id, date, weight, body_fat, muscle_mass, chest, waist, hips,
             thigh, biceps, avg_heart_rate, max_heart_rate, calories, protein,
             fats, carbs, water, energy_level, pain_level, sleep_quality, notes]
        );
        return result.rows[0];
    }

    // Обновить запись
    static async update(id, userId, entryData) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        const allowedFields = [
            'weight', 'body_fat', 'muscle_mass', 'chest', 'waist', 'hips',
            'thigh', 'biceps', 'avg_heart_rate', 'max_heart_rate', 'calories',
            'protein', 'fats', 'carbs', 'water', 'energy_level', 'pain_level',
            'sleep_quality', 'notes'
        ];

        for (const field of allowedFields) {
            if (entryData[field] !== undefined) {
                fields.push(`${field} = $${paramIndex}`);
                values.push(entryData[field]);
                paramIndex++;
            }
        }

        if (fields.length === 0) return null;

        values.push(id, userId);
        
        const result = await query(
            `UPDATE health_entries 
             SET ${fields.join(', ')}, created_at = CURRENT_TIMESTAMP
             WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
             RETURNING id, date, weight, body_fat, muscle_mass, chest, waist, hips,
                       thigh, biceps, avg_heart_rate, max_heart_rate, calories,
                       protein, fats, carbs, water, energy_level, pain_level,
                       sleep_quality, notes, created_at`,
            [...values, id, userId]
        );
        return result.rows[0];
    }

    // Удалить запись
    static async delete(id, userId) {
        const result = await query(
            'DELETE FROM health_entries WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );
        return result.rows[0];
    }

    // Получить прогресс по весу
    static async getWeightProgress(userId, limit = 30) {
        const result = await query(
            `SELECT date, weight
             FROM health_entries
             WHERE user_id = $1 AND weight IS NOT NULL
             ORDER BY date DESC
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows.reverse();
    }

    // Получить статистику за период
    static async getStats(userId, startDate, endDate) {
        const result = await query(
            `SELECT 
                AVG(weight) as avg_weight,
                AVG(avg_heart_rate) as avg_heart_rate,
                AVG(energy_level) as avg_energy,
                AVG(sleep_quality) as avg_sleep,
                MIN(weight) as min_weight,
                MAX(weight) as max_weight
             FROM health_entries
             WHERE user_id = $1 
               AND date BETWEEN $2 AND $3
               AND weight IS NOT NULL`,
            [userId, startDate, endDate]
        );
        return result.rows[0];
    }
}

module.exports = HealthEntry;
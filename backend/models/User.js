const { query, transaction } = require('../config/database');

class User {
    // Получить всех пользователей
    static async getAll() {
        const result = await query(
            `SELECT id, name, age, gender, height, weight, bmi, goals, 
                    experience, workouts_per_week, email, water_reminder, 
                    created_at, updated_at 
             FROM users 
             ORDER BY id`
        );
        return result.rows;
    }

    // Получить пользователя по ID
    static async getById(id) {
        const result = await query(
            `SELECT id, name, age, gender, height, weight, bmi, goals, 
                    experience, workouts_per_week, email, water_reminder,
                    created_at, updated_at 
             FROM users 
             WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Создать пользователя
    static async create(userData) {
        const {
            name, age, gender, height, weight, goals, experience,
            workouts_per_week, email, water_reminder = false
        } = userData;

        // Рассчитываем ИМТ
        const heightInMeters = height / 100;
        const bmi = weight ? (weight / (heightInMeters * heightInMeters)).toFixed(1) : null;

        const result = await query(
            `INSERT INTO users (name, age, gender, height, weight, bmi, goals, 
                                experience, workouts_per_week, email, water_reminder)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id, name, age, gender, height, weight, bmi, goals, 
                       experience, workouts_per_week, email, water_reminder,
                       created_at, updated_at`,
            [name, age, gender, height, weight, bmi, goals, experience, 
             workouts_per_week, email, water_reminder]
        );
        return result.rows[0];
    }

    // Обновить пользователя
    static async update(id, userData) {
        const {
            name, age, gender, height, weight, goals, experience,
            workouts_per_week, email, water_reminder
        } = userData;

        // Получаем текущие данные для расчета ИМТ
        const current = await this.getById(id);
        
        const finalHeight = height || current?.height;
        const finalWeight = weight || current?.weight;
        
        let bmi = current?.bmi;
        if (finalHeight && finalWeight) {
            const heightInMeters = finalHeight / 100;
            bmi = (finalWeight / (heightInMeters * heightInMeters)).toFixed(1);
        }

        const result = await query(
            `UPDATE users 
             SET name = COALESCE($1, name),
                 age = COALESCE($2, age),
                 gender = COALESCE($3, gender),
                 height = COALESCE($4, height),
                 weight = COALESCE($5, weight),
                 bmi = COALESCE($6, bmi),
                 goals = COALESCE($7, goals),
                 experience = COALESCE($8, experience),
                 workouts_per_week = COALESCE($9, workouts_per_week),
                 email = COALESCE($10, email),
                 water_reminder = COALESCE($11, water_reminder),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $12
             RETURNING id, name, age, gender, height, weight, bmi, goals,
                       experience, workouts_per_week, email, water_reminder,
                       created_at, updated_at`,
            [name, age, gender, finalHeight, finalWeight, bmi, goals, 
             experience, workouts_per_week, email, water_reminder, id]
        );
        return result.rows[0];
    }

    // Удалить пользователя (каскадное удаление)
    static async delete(id) {
        const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }

    // Получить полную статистику пользователя
    static async getStats(id) {
        const result = await query(
            `SELECT 
                COUNT(wh.id) as total_workouts,
                COALESCE(SUM(wh.duration), 0) as total_duration,
                COUNT(DISTINCT DATE(wh.date)) as active_days,
                MAX(wh.date) as last_workout_date
             FROM workout_history wh
             WHERE wh.user_id = $1 AND wh.completed = true`,
            [id]
        );
        
        const workouts = result.rows[0];
        
        // Расчет стрика
        let streak = 0;
        if (workouts.last_workout_date) {
            const today = new Date();
            const lastDate = new Date(workouts.last_workout_date);
            const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                // Считаем стрик
                const streakResult = await query(
                    `WITH RECURSIVE dates AS (
                        SELECT DATE($2::timestamp - (n || ' days')::interval) as workout_date
                        FROM generate_series(0, 30) n
                    )
                    SELECT COUNT(*) as streak
                    FROM dates d
                    WHERE EXISTS (
                        SELECT 1 FROM workout_history wh
                        WHERE wh.user_id = $1 
                        AND DATE(wh.date) = d.workout_date
                        AND wh.completed = true
                    )
                    AND d.workout_date <= CURRENT_DATE`,
                    [id, today]
                );
                streak = parseInt(streakResult.rows[0]?.streak || 0);
            }
        }
        
        return {
            total_workouts: parseInt(workouts.total_workouts || 0),
            total_duration: parseInt(workouts.total_duration || 0),
            active_days: parseInt(workouts.active_days || 0),
            streak: streak
        };
    }
}

module.exports = User;
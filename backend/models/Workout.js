const { query, transaction } = require('../config/database');

class Workout {
    // Получить историю тренировок
    static async getHistory(userId, limit = 30) {
        const result = await query(
            `SELECT id, workout_type, workout_name, day_of_week, duration,
                    exercises_completed, total_exercises, date, created_at
             FROM workout_history
             WHERE user_id = $1
             ORDER BY date DESC, created_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }

    // Получить тренировку по ID
    static async getById(id, userId) {
        const result = await query(
            `SELECT id, workout_type, workout_name, day_of_week, duration,
                    exercises_completed, total_exercises, date, created_at
             FROM workout_history
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        
        if (result.rows.length === 0) return null;
        
        const workout = result.rows[0];
        
        // Получаем детали упражнений
        const exercises = await query(
            `SELECT id, exercise_id, exercise_name, sets_completed,
                    reps_completed, actual_duration, completed
             FROM workout_exercises
             WHERE workout_history_id = $1
             ORDER BY id`,
            [id]
        );
        
        workout.exercises = exercises.rows;
        return workout;
    }

    // Создать запись о тренировке
    static async create(workoutData) {
        const {
            user_id, workout_name, workout_type, day_of_week,
            duration, exercises_completed, total_exercises, date,
            exercises = []
        } = workoutData;

        const result = await transaction(async (client) => {
            // Создаем запись тренировки
            const workoutResult = await client.query(
                `INSERT INTO workout_history 
                 (user_id, workout_name, workout_type, day_of_week, duration,
                  exercises_completed, total_exercises, date)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id`,
                [user_id, workout_name, workout_type, day_of_week, duration,
                 exercises_completed, total_exercises, date]
            );
            
            const workoutId = workoutResult.rows[0].id;
            
            // Добавляем упражнения
            for (const exercise of exercises) {
                await client.query(
                    `INSERT INTO workout_exercises 
                     (workout_history_id, exercise_id, exercise_name, 
                      sets_completed, reps_completed, actual_duration, completed)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [workoutId, exercise.exercise_id, exercise.exercise_name,
                     exercise.sets_completed, exercise.reps_completed,
                     exercise.actual_duration, exercise.completed]
                );
            }
            
            // Обновляем daily_stats
            await client.query(
                `INSERT INTO daily_stats (user_id, date, total_calories, total_workout_time)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, date) 
                 DO UPDATE SET 
                    total_calories = daily_stats.total_calories + $3,
                    total_workout_time = daily_stats.total_workout_time + $4`,
                [user_id, date, exercises_completed * 35, duration]
            );
            
            return workoutId;
        });
        
        return this.getById(result, user_id);
    }

    // Получить статистику за период
    static async getStats(userId, startDate, endDate) {
        const result = await query(
            `SELECT 
                DATE(date) as workout_date,
                COUNT(*) as workout_count,
                SUM(duration) as total_duration,
                SUM(exercises_completed) as total_exercises
             FROM workout_history
             WHERE user_id = $1 
               AND date BETWEEN $2 AND $3
               AND completed = true
             GROUP BY DATE(date)
             ORDER BY DATE(date)`,
            [userId, startDate, endDate]
        );
        return result.rows;
    }

    // Получить распределение по типам тренировок
    static async getTypeDistribution(userId, limit = 30) {
        const result = await query(
            `SELECT 
                workout_type,
                COUNT(*) as count
             FROM workout_history
             WHERE user_id = $1
               AND completed = true
               AND date >= CURRENT_DATE - INTERVAL '$2 days'
             GROUP BY workout_type
             ORDER BY count DESC`,
            [userId, limit]
        );
        return result.rows;
    }

    // Получить последние 7 дней активности
    static async getWeeklyActivity(userId) {
        const result = await query(
            `SELECT 
                EXTRACT(DOW FROM date) as day_of_week,
                COUNT(*) as workout_count,
                SUM(duration) as total_duration,
                SUM(exercises_completed * 35) as total_calories
             FROM workout_history
             WHERE user_id = $1
               AND completed = true
               AND date >= CURRENT_DATE - INTERVAL '7 days'
             GROUP BY EXTRACT(DOW FROM date)
             ORDER BY day_of_week`,
            [userId]
        );
        return result.rows;
    }
}

module.exports = Workout;
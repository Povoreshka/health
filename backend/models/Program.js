const { query } = require('../config/database');

class Program {
    // Получить все программы
    static async getAll() {
        const result = await query(
            `SELECT id, title, description, duration, level, category,
                    workouts_per_week, icon, color, intensity, rating, participants,
                    is_custom, created_by, created_at
             FROM programs
             ORDER BY is_custom DESC, rating DESC`
        );
        return result.rows;
    }

    // Получить программу по ID
    static async getById(id) {
        const result = await query(
            `SELECT id, title, description, duration, level, category,
                    workouts_per_week, icon, color, intensity, rating, participants,
                    is_custom, created_by, created_at
             FROM programs
             WHERE id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) return null;
        
        const program = result.rows[0];
        
        // Получаем упражнения программы
        const exercises = await query(
            `SELECT pe.exercise_id, pe.exercise_order, pe.sets, pe.reps,
                    pe.rest_time, pe.exercise_time,
                    e.name, e.description, e.primary_muscle, e.type,
                    e.difficulty, e.calories_per_minute, e.gif_url,
                    mg.label as muscle_group_label, mg.icon as muscle_group_icon
             FROM program_exercises pe
             JOIN exercises e ON pe.exercise_id = e.id
             LEFT JOIN muscle_groups mg ON e.primary_muscle = mg.id
             WHERE pe.program_id = $1
             ORDER BY pe.exercise_order`,
            [id]
        );
        
        program.exercises = exercises.rows;
        
        // Получаем группы мышц
        const muscleGroups = await query(
            `SELECT mg.id, mg.label, mg.icon, mg.color
             FROM program_muscle_groups pmg
             JOIN muscle_groups mg ON pmg.muscle_group_id = mg.id
             WHERE pmg.program_id = $1`,
            [id]
        );
        
        program.muscle_groups = muscleGroups.rows;
        
        return program;
    }

    // Получить активную программу пользователя
    static async getUserActiveProgram(userId) {
        const result = await query(
            `SELECT uap.program_id, uap.selected_muscle_groups, uap.start_date,
                    uap.progress_percent,
                    p.title, p.description, p.icon, p.color, p.duration,
                    p.level, p.intensity, p.workouts_per_week
             FROM user_active_program uap
             JOIN programs p ON uap.program_id = p.id
             WHERE uap.user_id = $1`,
            [userId]
        );
        
        if (result.rows.length === 0) return null;
        
        const program = result.rows[0];
        
        // Получаем упражнения
        const exercises = await query(
            `SELECT pe.exercise_id, pe.exercise_order, pe.sets, pe.reps,
                    pe.rest_time, pe.exercise_time,
                    e.name, e.description, e.primary_muscle, e.type,
                    e.difficulty, e.calories_per_minute, e.gif_url
             FROM program_exercises pe
             JOIN exercises e ON pe.exercise_id = e.id
             WHERE pe.program_id = $1
             ORDER BY pe.exercise_order`,
            [program.program_id]
        );
        
        program.exercises = exercises.rows;
        
        return program;
    }

    // Установить активную программу пользователю
    static async setUserActiveProgram(userId, programId, selectedMuscleGroups = []) {
        // Сначала удаляем текущую активную программу
        await query('DELETE FROM user_active_program WHERE user_id = $1', [userId]);
        
        // Добавляем новую
        const result = await query(
            `INSERT INTO user_active_program (user_id, program_id, selected_muscle_groups, start_date)
             VALUES ($1, $2, $3, CURRENT_DATE)
             RETURNING *`,
            [userId, programId, selectedMuscleGroups]
        );
        
        return result.rows[0];
    }

    // Обновить прогресс программы
    static async updateProgress(userId, programId, progress) {
        const result = await query(
            `UPDATE user_active_program
             SET progress_percent = $3
             WHERE user_id = $1 AND program_id = $2
             RETURNING *`,
            [userId, programId, progress]
        );
        return result.rows[0];
    }

    // Получить программы по уровню
    static async getByLevel(level) {
        const result = await query(
            `SELECT id, title, description, duration, level, category,
                    workouts_per_week, icon, color, intensity, rating, participants,
                    is_custom, created_by, created_at
             FROM programs
             WHERE level = $1
             ORDER BY rating DESC`,
            [level]
        );
        return result.rows;
    }

    // Получить программы по категории
    static async getByCategory(category) {
        const result = await query(
            `SELECT id, title, description, duration, level, category,
                    workouts_per_week, icon, color, intensity, rating, participants,
                    is_custom, created_by, created_at
             FROM programs
             WHERE category = $1
             ORDER BY rating DESC`,
            [category]
        );
        return result.rows;
    }
}

module.exports = Program;
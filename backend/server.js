const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const db = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true
}));
app.use(express.json());

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// =====================================================
// AUTH ROUTES
// =====================================================

// Регистрация (для онбординга)
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, age, gender, height, weight, experience, workouts_per_week, goals } = req.body;
    
    console.log('=== REGISTER REQUEST ===');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Goals received:', goals);
    console.log('Goals type:', typeof goals);
    console.log('Workouts per week:', workouts_per_week);
    console.log('Experience:', experience);
    
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, пароль и имя обязательны' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }
    
    try {
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        let bmi = null;
        if (height && weight) {
            const heightInMeters = height / 100;
            bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
        }
        
        let goalsArray = ['health']; 
        
        if (goals) {
            if (Array.isArray(goals)) {
                goalsArray = goals.filter(g => g !== null && g !== undefined);
            } else if (typeof goals === 'string') {
                // Если пришла строка, пробуем распарсить JSON
                try {
                    const parsed = JSON.parse(goals);
                    goalsArray = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    // Если не JSON, просто используем как один элемент
                    goalsArray = [goals];
                }
            }
        }
        
        // Убираем null значения
        goalsArray = goalsArray.filter(g => g !== null && g !== undefined);
        
        // Если массив пустой, ставим цель по умолчанию
        if (goalsArray.length === 0) {
            goalsArray = ['health'];
        }
        
        console.log('Saving goals as PostgreSQL array:', goalsArray);
        
        // ИСПРАВЛЕНО: Передаем массив напрямую, PostgreSQL сам преобразует в TEXT[]
        const result = await db.query(
            `INSERT INTO users 
             (email, password_hash, name, age, gender, height, weight, bmi, experience, workouts_per_week, goals, water_reminder) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false) 
             RETURNING id, name, email, experience, workouts_per_week, height, weight, bmi, goals, water_reminder, created_at`,
            [email, passwordHash, name, age || null, gender || null, height || null, weight || null, bmi, experience || 'beginner', workouts_per_week || 3, goalsArray]
        );
        
        const user = result.rows[0];
        
        console.log('User created successfully with goals:', user.goals);
        res.status(201).json(user);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    try {
        const result = await db.query(
            'SELECT id, name, email, password_hash, experience, workouts_per_week, height, weight, bmi, goals, water_reminder FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        // goals уже будет массивом, так как TEXT[] возвращается как массив
        if (!user.goals) {
            user.goals = ['health'];
        }
        
        delete user.password_hash;
        console.log('User logged in with goals:', user.goals);
        res.json(user);
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// USERS ROUTES
// =====================================================

app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'SELECT id, name, age, gender, height, weight, bmi, experience, workouts_per_week, goals, email, water_reminder, created_at FROM users WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = result.rows[0];
        
        // goals уже массив, просто проверяем что есть
        if (!user.goals) {
            user.goals = ['health'];
        }
        
        console.log(`User ${id} goals:`, user.goals);
        res.json(user);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Обновление пользователя
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, age, gender, height, weight, experience, workouts_per_week, goals, email, water_reminder } = req.body;
    
    let bmi = null;
    if (height && weight) {
        const heightInMeters = height / 100;
        bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
    }
    
    // Преобразуем goals в массив
    let goalsArray = null;
    if (goals) {
        if (Array.isArray(goals)) {
            goalsArray = goals;
        } else if (typeof goals === 'string') {
            try {
                const parsed = JSON.parse(goals);
                goalsArray = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                goalsArray = [goals];
            }
        }
    }
    
    try {
        const result = await db.query(
            `UPDATE users 
             SET name = COALESCE($1, name), 
                 age = COALESCE($2, age), 
                 gender = COALESCE($3, gender), 
                 height = COALESCE($4, height), 
                 weight = COALESCE($5, weight), 
                 bmi = COALESCE($6, bmi), 
                 experience = COALESCE($7, experience), 
                 workouts_per_week = COALESCE($8, workouts_per_week), 
                 goals = COALESCE($9, goals), 
                 email = COALESCE($10, email), 
                 water_reminder = COALESCE($11, water_reminder), 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $12
             RETURNING id, name, age, gender, height, weight, bmi, experience, workouts_per_week, email, goals`,
            [name, age, gender, height, weight, bmi, experience, workouts_per_week, goalsArray, email, water_reminder, id]
        );
        
        const user = result.rows[0];
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// WORKOUTS ROUTES
// =====================================================

app.get('/api/workouts/history/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM workout_history WHERE user_id = $1 ORDER BY date DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/workouts', async (req, res) => {
    const { user_id, workout_name, duration, date, type, day_of_week, exercises_completed, total_exercises, calories_burned, avg_heart_rate } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO workout_history 
             (user_id, workout_name, duration, date, workout_type, day_of_week, exercises_completed, total_exercises, completed, calories_burned, avg_heart_rate) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10) 
             RETURNING id`,
            [user_id, workout_name, duration, date, type, day_of_week, exercises_completed, total_exercises, calories_burned, avg_heart_rate]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Workout saved successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// CUSTOM WORKOUTS ROUTES
// =====================================================

app.post('/api/custom-workouts', async (req, res) => {
    const { user_id, name, exercises, total_time } = req.body;
    
    if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Workout name is required' });
    }
    
    if (!exercises || exercises.length === 0) {
        return res.status(400).json({ error: 'At least one exercise is required' });
    }
    
    try {
        await db.query('BEGIN');
        
        const workoutResult = await db.query(
            `INSERT INTO custom_workouts (user_id, name, total_time) 
             VALUES ($1, $2, $3) 
             RETURNING id`,
            [user_id, name.trim(), total_time || 0]
        );
        
        const workoutId = workoutResult.rows[0].id;
        
        for (let i = 0; i < exercises.length; i++) {
            const ex = exercises[i];
            await db.query(
                `INSERT INTO custom_workout_exercises 
                 (custom_workout_id, exercise_id, exercise_order, sets, reps, rest_time, exercise_time) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [workoutId, ex.exercise_id, i + 1, ex.sets || 3, ex.reps || '10-12', ex.rest_time || 60, ex.exercise_time || 45]
            );
        }
        
        await db.query('COMMIT');
        
        res.status(201).json({ 
            id: workoutId, 
            message: 'Тренировка успешно сохранена!'
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error saving custom workout:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/custom-workouts/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const workoutsResult = await db.query(
            `SELECT * FROM custom_workouts WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        
        const workouts = [];
        
        for (const workout of workoutsResult.rows) {
            const exercisesResult = await db.query(
                `SELECT ce.*, e.name, e.description, e.primary_muscle, e.gif_url
                FROM custom_workout_exercises ce
                JOIN exercises e ON ce.exercise_id = e.id
                WHERE ce.custom_workout_id = $1
                ORDER BY ce.exercise_order`,
                [workout.id]
            );
            
            workouts.push({
                ...workout,
                exercises: exercisesResult.rows
            });
        }
        
        res.json(workouts);
    } catch (error) {
        console.error('Error fetching custom workouts:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// HEALTH ROUTES - УПРОЩЁННАЯ ВЕРСИЯ (только существующие колонки)
// =====================================================

app.get('/api/health/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM health_entries WHERE user_id = $1 ORDER BY date DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching health entries:', error);
        res.status(500).json({ error: error.message });
    }
});

// Упрощённый POST эндпоинт - только базовые поля
app.post('/api/health', async (req, res) => {
    // Принимаем только те поля, которые точно есть в таблице
    const { user_id, date, weight, body_fat, avg_heart_rate, energy_level, sleep_quality, notes } = req.body;
    
    console.log('Saving health entry:', { user_id, date, weight, body_fat, energy_level });
    
    try {
        // Проверяем, существует ли запись
        const checkQuery = 'SELECT id FROM health_entries WHERE user_id = $1 AND date = $2';
        const existing = await db.query(checkQuery, [user_id, date]);
        
        let result;
        
        if (existing.rows.length > 0) {
            // Обновляем существующую запись
            const updateQuery = `
                UPDATE health_entries 
                SET 
                    weight = COALESCE($3, weight),
                    body_fat = COALESCE($4, body_fat),
                    avg_heart_rate = COALESCE($5, avg_heart_rate),
                    energy_level = COALESCE($6, energy_level),
                    sleep_quality = COALESCE($7, sleep_quality),
                    notes = COALESCE($8, notes),
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND date = $2
                RETURNING id
            `;
            result = await db.query(updateQuery, [
                user_id, date,
                weight || null, 
                body_fat || null, 
                avg_heart_rate || null, 
                energy_level || null, 
                sleep_quality || null, 
                notes || null
            ]);
        } else {
            // Создаём новую запись
            const insertQuery = `
                INSERT INTO health_entries (
                    user_id, date, weight, body_fat, avg_heart_rate, 
                    energy_level, sleep_quality, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `;
            result = await db.query(insertQuery, [
                user_id, date,
                weight || null, 
                body_fat || null, 
                avg_heart_rate || null, 
                energy_level || null, 
                sleep_quality || null, 
                notes || null
            ]);
        }
        
        // Если указан вес, обновляем данные пользователя
        if (weight && user_id) {
            const userResult = await db.query('SELECT height FROM users WHERE id = $1', [user_id]);
            const height = userResult.rows[0]?.height;
            
            if (height && weight) {
                const heightInMeters = height / 100;
                const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
                await db.query('UPDATE users SET weight = $1, bmi = $2 WHERE id = $3', [weight, bmi, user_id]);
            } else {
                await db.query('UPDATE users SET weight = $1 WHERE id = $2', [weight, user_id]);
            }
            
            // Проверяем достижения
            await checkAndAwardAchievements(user_id);
        }
        
        // Получаем и возвращаем сохранённую запись
        const savedEntry = await db.query('SELECT * FROM health_entries WHERE id = $1', [result.rows[0].id]);
        res.status(201).json(savedEntry.rows[0]);
        
    } catch (error) {
        console.error('Error saving health entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT эндпоинт для обновления по ID
app.put('/api/health/:id', async (req, res) => {
    const { id } = req.params;
    const { date, weight, body_fat, avg_heart_rate, energy_level, sleep_quality, notes } = req.body;
    
    try {
        const result = await db.query(
            `UPDATE health_entries 
             SET 
                 date = COALESCE($2, date),
                 weight = COALESCE($3, weight),
                 body_fat = COALESCE($4, body_fat),
                 avg_heart_rate = COALESCE($5, avg_heart_rate),
                 energy_level = COALESCE($6, energy_level),
                 sleep_quality = COALESCE($7, sleep_quality),
                 notes = COALESCE($8, notes),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id, date, weight || null, body_fat || null, avg_heart_rate || null, energy_level || null, sleep_quality || null, notes || null]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        // Если обновили вес, обновляем пользователя
        if (weight) {
            const userId = result.rows[0].user_id;
            const userResult = await db.query('SELECT height FROM users WHERE id = $1', [userId]);
            const height = userResult.rows[0]?.height;
            
            if (height && weight) {
                const heightInMeters = height / 100;
                const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
                await db.query('UPDATE users SET weight = $1, bmi = $2 WHERE id = $3', [weight, bmi, userId]);
            } else {
                await db.query('UPDATE users SET weight = $1 WHERE id = $2', [weight, userId]);
            }
        }
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('Error updating health entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE эндпоинт
app.delete('/api/health/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM health_entries WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json({ message: 'Health entry deleted successfully', id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting health entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ACHIEVEMENTS ROUTES
// =====================================================

app.get('/api/achievements/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            `SELECT a.*, ua.unlocked_at 
             FROM achievements a 
             LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1 
             ORDER BY a.id`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});
// =====================================================
// ACHIEVEMENTS LOGIC - ПОЛНАЯ ВЕРСИЯ
// =====================================================

async function checkAndAwardAchievements(userId) {
    try {
        console.log(`🔍 Checking achievements for user ${userId}...`);
        
        // Получаем все тренировки пользователя
        const workoutsResult = await db.query(
            `SELECT 
                COUNT(*) as total_workouts,
                COALESCE(MAX(duration), 0) as max_duration,
                COALESCE(MAX(calories_burned), 0) as max_calories,
                COALESCE(SUM(duration), 0) as total_duration,
                COALESCE(SUM(calories_burned), 0) as total_calories,
                COUNT(DISTINCT date) as unique_days
             FROM workout_history 
             WHERE user_id = $1 AND completed = true`,
            [userId]
        );
        
        const totalWorkouts = parseInt(workoutsResult.rows[0]?.total_workouts) || 0;
        const maxDuration = parseInt(workoutsResult.rows[0]?.max_duration) || 0;
        const maxCalories = parseInt(workoutsResult.rows[0]?.max_calories) || 0;
        const totalDuration = parseInt(workoutsResult.rows[0]?.total_duration) || 0;
        const totalCalories = parseInt(workoutsResult.rows[0]?.total_calories) || 0;
        const uniqueDays = parseInt(workoutsResult.rows[0]?.unique_days) || 0;
        
        console.log(`📊 Stats: totalWorkouts=${totalWorkouts}, maxDuration=${maxDuration}, maxCalories=${maxCalories}, totalDuration=${totalDuration}, uniqueDays=${uniqueDays}`);
        
        // Получаем текущую серию тренировок (стрик)
        const streakResult = await db.query(
            `WITH dates AS (
                SELECT DISTINCT date
                FROM workout_history
                WHERE user_id = $1 AND completed = true
                ORDER BY date DESC
            )
            SELECT COUNT(*) as streak FROM (
                SELECT date, LAG(date) OVER (ORDER BY date DESC) as prev_date
                FROM dates
            ) s WHERE prev_date IS NULL OR (prev_date - date) <= 1`,
            [userId]
        );
        const currentStreak = parseInt(streakResult.rows[0]?.streak) || 0;
        console.log(`🔥 Streak: ${currentStreak}`);
        
        // Получаем тренировки по дням недели для weekly_streak и monthly_streak
        const weeklyStreakResult = await db.query(
            `WITH RECURSIVE dates AS (
                SELECT DISTINCT date
                FROM workout_history
                WHERE user_id = $1 AND completed = true
                ORDER BY date DESC
            )
            SELECT COUNT(*) as streak FROM (
                SELECT date, LAG(date) OVER (ORDER BY date DESC) as prev_date
                FROM dates
            ) s WHERE prev_date IS NULL OR (prev_date - date) <= 1`,
            [userId]
        );
        const weeklyStreak = parseInt(weeklyStreakResult.rows[0]?.streak) || 0;
        
        // Получаем BMI пользователя
        const userResult = await db.query('SELECT bmi, weight FROM users WHERE id = $1', [userId]);
        const bmi = parseFloat(userResult.rows[0]?.bmi) || 0;
        const currentWeight = parseFloat(userResult.rows[0]?.weight) || 0;
        console.log(`⚖️ BMI: ${bmi}, Weight: ${currentWeight}`);
        
        // Получаем начальный вес пользователя (первая запись в health_entries)
        const initialWeightResult = await db.query(
            `SELECT weight FROM health_entries 
             WHERE user_id = $1 AND weight IS NOT NULL 
             ORDER BY date ASC LIMIT 1`,
            [userId]
        );
        const initialWeight = parseFloat(initialWeightResult.rows[0]?.weight) || currentWeight;
        const weightLoss = initialWeight - currentWeight;
        console.log(`📉 Weight loss: ${weightLoss} kg (from ${initialWeight} to ${currentWeight})`);
        
        // Получаем разнообразие типов тренировок
        const workoutTypesResult = await db.query(
            `SELECT DISTINCT workout_type 
             FROM workout_history 
             WHERE user_id = $1 AND completed = true AND workout_type IS NOT NULL`,
            [userId]
        );
        const uniqueWorkoutTypes = workoutTypesResult.rows.length;
        console.log(`🎯 Unique workout types: ${uniqueWorkoutTypes}`);
        
        // Получаем максимальное количество тренировок за один день
        const workoutsPerDayResult = await db.query(
            `SELECT COUNT(*) as count_per_day
             FROM workout_history 
             WHERE user_id = $1 AND completed = true
             GROUP BY date
             ORDER BY count_per_day DESC
             LIMIT 1`,
            [userId]
        );
        const maxWorkoutsPerDay = parseInt(workoutsPerDayResult.rows[0]?.count_per_day) || 0;
        console.log(`💪 Max workouts per day: ${maxWorkoutsPerDay}`);
        
        // Получаем количество йога-тренировок
        const yogaWorkoutsResult = await db.query(
            `SELECT COUNT(*) as count
             FROM workout_history 
             WHERE user_id = $1 AND completed = true AND workout_type = 'yoga'`,
            [userId]
        );
        const yogaWorkouts = parseInt(yogaWorkoutsResult.rows[0]?.count) || 0;
        console.log(`🧘 Yoga workouts: ${yogaWorkouts}`);
        
        // Получаем данные о сне (если есть таблица sleep_entries)
        let sleepTrackingDays = 0;
        try {
            const sleepResult = await db.query(
                `SELECT COUNT(DISTINCT date) as count
                 FROM sleep_entries 
                 WHERE user_id = $1`,
                [userId]
            );
            sleepTrackingDays = parseInt(sleepResult.rows[0]?.count) || 0;
        } catch (e) {
            console.log('Sleep tracking table not found or no data');
        }
        console.log(`😴 Sleep tracking days: ${sleepTrackingDays}`);
        
        // Получаем данные о воде (если есть таблица water_intake)
        let waterIntakeDays = 0;
        try {
            const waterResult = await db.query(
                `SELECT COUNT(DISTINCT date) as count
                 FROM water_intake 
                 WHERE user_id = $1`,
                [userId]
            );
            waterIntakeDays = parseInt(waterResult.rows[0]?.count) || 0;
        } catch (e) {
            console.log('Water intake table not found or no data');
        }
        console.log(`💧 Water intake days: ${waterIntakeDays}`);
        
        // Получаем количество рефералов (если есть таблица referrals)
        let referralCount = 0;
        try {
            const referralResult = await db.query(
                `SELECT COUNT(*) as count
                 FROM referrals 
                 WHERE referrer_id = $1`,
                [userId]
            );
            referralCount = parseInt(referralResult.rows[0]?.count) || 0;
        } catch (e) {
            console.log('Referrals table not found or no data');
        }
        console.log(`👥 Referrals: ${referralCount}`);
        
        // Получаем количество шерингов (если есть таблица shares)
        let shareCount = 0;
        try {
            const shareResult = await db.query(
                `SELECT COUNT(*) as count
                 FROM shares 
                 WHERE user_id = $1`,
                [userId]
            );
            shareCount = parseInt(shareResult.rows[0]?.count) || 0;
        } catch (e) {
            console.log('Shares table not found or no data');
        }
        console.log(`📱 Shares: ${shareCount}`);
        
        // Получаем тренировки по времени суток
        const morningWorkoutsResult = await db.query(
            `SELECT COUNT(*) as count
             FROM workout_history 
             WHERE user_id = $1 AND completed = true AND EXTRACT(HOUR FROM date) < 8`,
            [userId]
        );
        const morningWorkouts = parseInt(morningWorkoutsResult.rows[0]?.count) || 0;
        
        const eveningWorkoutsResult = await db.query(
            `SELECT COUNT(*) as count
             FROM workout_history 
             WHERE user_id = $1 AND completed = true AND EXTRACT(HOUR FROM date) >= 22`,
            [userId]
        );
        const eveningWorkouts = parseInt(eveningWorkoutsResult.rows[0]?.count) || 0;
        console.log(`☀️ Morning workouts: ${morningWorkouts}, 🌙 Evening workouts: ${eveningWorkouts}`);
        
        // Получаем уже полученные достижения
        const earnedResult = await db.query(
            'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
            [userId]
        );
        const earnedIds = new Set(earnedResult.rows.map(r => r.achievement_id));
        console.log(`🏆 Already earned: ${[...earnedIds].join(', ')}`);
        
        // Получаем все достижения
        const allAchievements = await db.query('SELECT * FROM achievements ORDER BY id');
        
        const newAchievements = [];
        
        for (const ach of allAchievements.rows) {
            if (earnedIds.has(ach.id)) continue;
            
            let earned = false;
            let reason = '';
            const requirementValue = parseInt(ach.requirement_value);
            
            switch (ach.requirement_type) {
                case 'workouts':
                    if (totalWorkouts >= requirementValue) {
                        earned = true;
                        reason = `${totalWorkouts} >= ${requirementValue}`;
                    }
                    break;
                    
                case 'streak':
                    if (currentStreak >= requirementValue) {
                        earned = true;
                        reason = `${currentStreak} >= ${requirementValue}`;
                    }
                    break;
                    
                case 'duration':
                    if (maxDuration >= requirementValue) {
                        earned = true;
                        reason = `${maxDuration}s >= ${requirementValue}s`;
                    }
                    break;
                    
                case 'calories_per_workout':
                    if (maxCalories >= requirementValue) {
                        earned = true;
                        reason = `${maxCalories} >= ${requirementValue}`;
                    }
                    break;
                    
                case 'normal_bmi':
                    if (bmi >= 18.5 && bmi <= 24.9) {
                        earned = true;
                        reason = `BMI ${bmi} в норме`;
                    }
                    break;
                    
                case 'workouts_month':
                    if (totalWorkouts >= requirementValue) {
                        earned = true;
                        reason = `${totalWorkouts} тренировок в месяц >= ${requirementValue}`;
                    }
                    break;
                    
                case 'weekly_streak':
                    if (weeklyStreak >= requirementValue) {
                        earned = true;
                        reason = `${weeklyStreak} дней без пропусков >= ${requirementValue}`;
                    }
                    break;
                    
                case 'monthly_streak':
                    if (weeklyStreak >= requirementValue) {
                        earned = true;
                        reason = `${weeklyStreak} дней без пропусков >= ${requirementValue}`;
                    }
                    break;
                    
                case 'quarterly_streak':
                    if (weeklyStreak >= requirementValue) {
                        earned = true;
                        reason = `${weeklyStreak} дней без пропусков >= ${requirementValue}`;
                    }
                    break;
                    
                case 'weight_loss':
                    if (weightLoss >= requirementValue) {
                        earned = true;
                        reason = `Потеряно ${weightLoss} кг >= ${requirementValue}`;
                    }
                    break;
                    
                case 'workout_types':
                    if (uniqueWorkoutTypes >= requirementValue) {
                        earned = true;
                        reason = `${uniqueWorkoutTypes} типов тренировок >= ${requirementValue}`;
                    }
                    break;
                    
                case 'workouts_per_day':
                    if (maxWorkoutsPerDay >= requirementValue) {
                        earned = true;
                        reason = `${maxWorkoutsPerDay} тренировок в день >= ${requirementValue}`;
                    }
                    break;
                    
                case 'yoga_workouts':
                    if (yogaWorkouts >= requirementValue) {
                        earned = true;
                        reason = `${yogaWorkouts} йога-тренировок >= ${requirementValue}`;
                    }
                    break;
                    
                case 'sleep_tracking':
                    if (sleepTrackingDays >= requirementValue) {
                        earned = true;
                        reason = `${sleepTrackingDays} дней трекинга сна >= ${requirementValue}`;
                    }
                    break;
                    
                case 'water_intake':
                    if (waterIntakeDays >= requirementValue) {
                        earned = true;
                        reason = `${waterIntakeDays} дней с нормой воды >= ${requirementValue}`;
                    }
                    break;
                    
                case 'referral':
                    if (referralCount >= requirementValue) {
                        earned = true;
                        reason = `${referralCount} рефералов >= ${requirementValue}`;
                    }
                    break;
                    
                case 'share':
                    if (shareCount >= requirementValue) {
                        earned = true;
                        reason = `${shareCount} шерингов >= ${requirementValue}`;
                    }
                    break;
                    
                case 'morning_workout':
                    if (morningWorkouts >= requirementValue) {
                        earned = true;
                        reason = `Проведено ${morningWorkouts} тренировок до 8 утра`;
                    }
                    break;
                    
                case 'evening_workout':
                    if (eveningWorkouts >= requirementValue) {
                        earned = true;
                        reason = `Проведено ${eveningWorkouts} тренировок после 10 вечера`;
                    }
                    break;
                    
                default:
                    console.log(`Unknown requirement type: ${ach.requirement_type} for achievement ${ach.title}`);
                    break;
            }
            
            if (earned) {
                try {
                    await db.query(
                        `INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) 
                         VALUES ($1, $2, NOW())`,
                        [userId, ach.id]
                    );
                    newAchievements.push(ach);
                    console.log(`🏆 UNLOCKED: ${ach.title} (${reason})`);
                } catch (err) {
                    console.log(`Already exists: ${ach.title}`);
                }
            }
        }
        
        console.log(`✨ New achievements: ${newAchievements.length}`);
        return newAchievements;
    } catch (error) {
        console.error('Error checking achievements:', error);
        return [];
    }
}

// Обновленная версия сохранения тренировки с проверкой достижений
app.post('/api/workouts', async (req, res) => {
    const { user_id, workout_name, duration, date, workout_type, calories_burned, exercises_completed, total_exercises } = req.body;
    
    try {
        const result = await db.query(
            `INSERT INTO workout_history 
             (user_id, workout_name, duration, date, workout_type, completed, calories_burned, exercises_completed, total_exercises) 
             VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8) 
             RETURNING id`,
            [user_id, workout_name, duration, date, workout_type || 'strength', calories_burned || 0, exercises_completed || 0, total_exercises || 0]
        );
        
        // Проверяем достижения после сохранения тренировки
        const newAchievements = await checkAndAwardAchievements(user_id);
        
        // Если есть новые достижения, обновляем также статистику пользователя
        if (newAchievements.length > 0) {
            // Обновляем BMI если нужно
            const userResult = await db.query('SELECT height, weight FROM users WHERE id = $1', [user_id]);
            const user = userResult.rows[0];
            if (user && user.height && user.weight) {
                const heightInMeters = user.height / 100;
                const bmi = parseFloat((user.weight / (heightInMeters * heightInMeters)).toFixed(1));
                await db.query('UPDATE users SET bmi = $1 WHERE id = $2', [bmi, user_id]);
            }
        }
        
        res.status(201).json({ 
            id: result.rows[0].id, 
            message: 'Workout saved',
            newAchievements: newAchievements 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Эндпоинт для ручной проверки и выдачи достижений
app.post('/api/achievements/check/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const newAchievements = await checkAndAwardAchievements(userId);
        res.json({ 
            success: true, 
            newAchievements: newAchievements,
            count: newAchievements.length,
            achievements: newAchievements.map(a => ({ id: a.id, title: a.title }))
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Эндпоинт для получения всех достижений пользователя с подробной информацией
app.get('/api/achievements/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            `SELECT a.*, ua.unlocked_at 
             FROM achievements a 
             LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1 
             ORDER BY a.id`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Эндпоинт для получения прогресса по достижениям
app.get('/api/achievements/progress/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Получаем все достижения с прогрессом
        const progress = [];
        
        // Получаем базовую статистику
        const workoutsResult = await db.query(
            `SELECT COUNT(*) as count 
             FROM workout_history 
             WHERE user_id = $1 AND completed = true`,
            [userId]
        );
        const totalWorkouts = parseInt(workoutsResult.rows[0]?.count) || 0;
        
        const streakResult = await db.query(
            `WITH dates AS (
                SELECT DISTINCT date
                FROM workout_history
                WHERE user_id = $1 AND completed = true
                ORDER BY date DESC
            )
            SELECT COUNT(*) as streak FROM (
                SELECT date, LAG(date) OVER (ORDER BY date DESC) as prev_date
                FROM dates
            ) s WHERE prev_date IS NULL OR (prev_date - date) <= 1`,
            [userId]
        );
        const currentStreak = parseInt(streakResult.rows[0]?.streak) || 0;
        
        const userResult = await db.query('SELECT bmi FROM users WHERE id = $1', [userId]);
        const bmi = parseFloat(userResult.rows[0]?.bmi) || 0;
        
        res.json({
            totalWorkouts,
            currentStreak,
            bmi,
            // Можно добавить больше данных по необходимости
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Эндпоинт для обновления веса и проверки достижений
// app.post('/api/health', async (req, res) => {
//     const { user_id, date, weight, body_fat, avg_heart_rate, energy_level, sleep_quality, notes } = req.body;
//     try {
//         const result = await db.query(
//             `INSERT INTO health_entries (user_id, date, weight, body_fat, avg_heart_rate, energy_level, sleep_quality, notes) 
//              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//              ON CONFLICT (user_id, date) DO UPDATE SET 
//              weight = COALESCE($3, weight), 
//              body_fat = COALESCE($4, body_fat), 
//              avg_heart_rate = COALESCE($5, avg_heart_rate), 
//              energy_level = COALESCE($6, energy_level), 
//              sleep_quality = COALESCE($7, sleep_quality), 
//              notes = COALESCE($8, notes)
//              RETURNING id`,
//             [user_id, date, weight, body_fat, avg_heart_rate, energy_level, sleep_quality, notes]
//         );
        
//         // Если обновили вес, проверяем достижения
//         if (weight) {
//             // Обновляем вес в таблице users
//             await db.query('UPDATE users SET weight = $1 WHERE id = $2', [weight, user_id]);
            
//             // Пересчитываем BMI
//             const userResult = await db.query('SELECT height FROM users WHERE id = $1', [user_id]);
//             const height = userResult.rows[0]?.height;
//             if (height && weight) {
//                 const heightInMeters = height / 100;
//                 const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
//                 await db.query('UPDATE users SET bmi = $1 WHERE id = $2', [bmi, user_id]);
//             }
            
//             // Проверяем достижения (особенно связанные с весом)
//             const newAchievements = await checkAndAwardAchievements(user_id);
//             if (newAchievements.length > 0) {
//                 console.log(`New achievements for weight update: ${newAchievements.map(a => a.title).join(', ')}`);
//             }
//         }
        
//         res.status(201).json({ id: result.rows[0].id, message: 'Health entry saved successfully' });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });
// Исправленный эндпоинт для сохранения здоровья
app.post('/api/health', async (req, res) => {
    const { 
        user_id, date, weight, body_fat, muscle_mass,
        chest, waist, hips, thigh, biceps,
        avg_heart_rate, max_heart_rate,
        calories, protein, fats, carbs, water,
        energy_level, pain_level, sleep_quality, notes 
    } = req.body;
    
    try {
        // Проверяем, существует ли запись за эту дату
        const existingEntry = await db.query(
            'SELECT id FROM health_entries WHERE user_id = $1 AND date = $2',
            [user_id, date]
        );
        
        let result;
        
        if (existingEntry.rows.length > 0) {
            // Обновляем существующую запись - указываем конкретные колонки, избегая ambiguity
            result = await db.query(
                `UPDATE health_entries 
                 SET 
                     weight = COALESCE($3, weight),
                     body_fat = COALESCE($4, body_fat),
                     muscle_mass = COALESCE($5, muscle_mass),
                     chest = COALESCE($6, chest),
                     waist = COALESCE($7, waist),
                     hips = COALESCE($8, hips),
                     thigh = COALESCE($9, thigh),
                     biceps = COALESCE($10, biceps),
                     avg_heart_rate = COALESCE($11, avg_heart_rate),
                     max_heart_rate = COALESCE($12, max_heart_rate),
                     calories = COALESCE($13, calories),
                     protein = COALESCE($14, protein),
                     fats = COALESCE($15, fats),
                     carbs = COALESCE($16, carbs),
                     water = COALESCE($17, water),
                     energy_level = COALESCE($18, energy_level),
                     pain_level = COALESCE($19, pain_level),
                     sleep_quality = COALESCE($20, sleep_quality),
                     notes = COALESCE($21, notes),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND date = $2
                 RETURNING id`,
                [
                    user_id, date,
                    weight || null, body_fat || null, muscle_mass || null,
                    chest || null, waist || null, hips || null, thigh || null, biceps || null,
                    avg_heart_rate || null, max_heart_rate || null,
                    calories || null, protein || null, fats || null, carbs || null, water || null,
                    energy_level || null, pain_level || null, sleep_quality || null, notes || null
                ]
            );
        } else {
            // Создаём новую запись
            result = await db.query(
                `INSERT INTO health_entries (
                    user_id, date, weight, body_fat, muscle_mass,
                    chest, waist, hips, thigh, biceps,
                    avg_heart_rate, max_heart_rate,
                    calories, protein, fats, carbs, water,
                    energy_level, pain_level, sleep_quality, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                RETURNING id`,
                [
                    user_id, date,
                    weight || null, body_fat || null, muscle_mass || null,
                    chest || null, waist || null, hips || null, thigh || null, biceps || null,
                    avg_heart_rate || null, max_heart_rate || null,
                    calories || null, protein || null, fats || null, carbs || null, water || null,
                    energy_level || null, pain_level || null, sleep_quality || null, notes || null
                ]
            );
        }
        
        // Если обновили вес, обновляем пользователя
        if (weight) {
            // Получаем текущий рост пользователя
            const userResult = await db.query('SELECT height FROM users WHERE id = $1', [user_id]);
            const height = userResult.rows[0]?.height;
            
            if (height && weight) {
                const heightInMeters = height / 100;
                const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
                await db.query('UPDATE users SET weight = $1, bmi = $2 WHERE id = $3', [weight, bmi, user_id]);
            } else {
                await db.query('UPDATE users SET weight = $1 WHERE id = $2', [weight, user_id]);
            }
            
            // Проверяем достижения
            const newAchievements = await checkAndAwardAchievements(user_id);
            if (newAchievements.length > 0) {
                console.log(`New achievements: ${newAchievements.map(a => a.title).join(', ')}`);
            }
        }
        
        // Возвращаем результат
        const savedEntry = await db.query('SELECT * FROM health_entries WHERE id = $1', [result.rows[0].id]);
        res.status(201).json(savedEntry.rows[0]);
        
    } catch (error) {
        console.error('Error saving health entry:', error);
        res.status(500).json({ error: error.message });
    }
});
// =====================================================
// PROGRAMS ROUTES
// =====================================================

app.get('/api/programs', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id, title, description, duration, level,
                workouts_per_week as "workoutsPerWeek",
                icon, color, intensity, rating, participants
            FROM programs
            ORDER BY id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/programs/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM programs WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/programs/:id/exercises', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT 
                e.id, e.name, e.description,
                e.primary_muscle as "muscleGroup",
                e.gif_url as "gifUrl",
                e.tips, e.difficulty,
                pe.sets, pe.reps,
                pe.rest_time as rest,
                pe.exercise_time as duration,
                pe.exercise_order as "exerciseOrder"
            FROM program_exercises pe
            JOIN exercises e ON pe.exercise_id = e.id
            WHERE pe.program_id = $1
            ORDER BY pe.exercise_order ASC
        `, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// EXERCISES ROUTES
// =====================================================

app.get('/api/exercises', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM exercises ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// USER ACTIVE PROGRAM ROUTES
// =====================================================

app.get('/api/users/:userId/active-program', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(`
            SELECT p.*, uap.start_date, uap.progress_percent, uap.selected_muscle_groups
            FROM user_active_program uap
            JOIN programs p ON uap.program_id = p.id
            WHERE uap.user_id = $1
        `, [userId]);
        
        if (result.rows.length === 0) {
            return res.json(null);
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users/:userId/active-program', async (req, res) => {
    const { userId } = req.params;
    const { program_id, selected_muscle_groups } = req.body;
    try {
        await db.query(
            `INSERT INTO user_active_program (user_id, program_id, selected_muscle_groups, start_date, progress_percent)
             VALUES ($1, $2, $3, CURRENT_DATE, 0)
             ON CONFLICT (user_id) DO UPDATE SET 
             program_id = $2, selected_muscle_groups = $3, start_date = CURRENT_DATE, progress_percent = 0`,
            [userId, program_id, selected_muscle_groups]
        );
        res.json({ message: 'Active program set successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ROOT ROUTE
// =====================================================

app.get('/', (req, res) => {
    res.json({
        message: 'Fitness App API',
        version: '1.0.0',
        endpoints: {
            auth: { register: 'POST /api/auth/register', login: 'POST /api/auth/login' },
            users: 'GET /api/users/:id',
            workouts: 'GET /api/workouts/history/:userId',
            customWorkouts: 'POST /api/custom-workouts',
            health: 'GET /api/health/:userId',
            achievements: 'GET /api/achievements/:userId',
            stats: 'GET /api/stats/:userId',
            programs: 'GET /api/programs',
            exercises: 'GET /api/exercises'
        }
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`❌ 404 - ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});
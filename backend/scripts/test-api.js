// scripts/test-api.js
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
    console.log('🚀 Тестирование API фитнес-приложения\n');
    
    // 1. Тестируем создание пользователя
    console.log('1. Создание пользователя...');
    const createUserRes = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Тестовый пользователь',
            age: 25,
            gender: 'male',
            height: 175,
            weight: 70,
            experience: 'intermediate',
            workouts_per_week: 4,
            email: 'test@example.com'
        })
    });
    
    if (!createUserRes.ok) {
        const error = await createUserRes.text();
        console.error('❌ Ошибка создания пользователя:', error);
        return;
    }
    
    const user = await createUserRes.json();
    console.log('✅ Пользователь создан:', user.id, user.name);
    
    // 2. Тестируем добавление записи здоровья
    console.log('\n2. Добавление записи здоровья...');
    const healthRes = await fetch(`${API_URL}/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: user.id,
            date: new Date().toISOString().split('T')[0],
            weight: 71.5,
            energy_level: 7,
            sleep_quality: 8
        })
    });
    
    if (!healthRes.ok) {
        console.error('❌ Ошибка добавления записи здоровья');
        return;
    }
    
    const healthEntry = await healthRes.json();
    console.log('✅ Запись здоровья добавлена');
    
    // 3. Тестируем добавление тренировки
    console.log('\n3. Добавление тренировки...');
    const workoutRes = await fetch(`${API_URL}/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: user.id,
            workout_name: 'Силовая тренировка',
            workout_type: 'strength',
            day_of_week: new Date().getDay(),
            duration: 3600,
            exercises_completed: 5,
            total_exercises: 5,
            date: new Date().toISOString().split('T')[0],
            exercises: [
                {
                    exercise_id: 'chest_1',
                    exercise_name: 'Жим штанги лежа',
                    sets_completed: 4,
                    reps_completed: '10-12',
                    actual_duration: 600,
                    completed: true
                },
                {
                    exercise_id: 'back_1',
                    exercise_name: 'Подтягивания широким хватом',
                    sets_completed: 3,
                    reps_completed: '8-10',
                    actual_duration: 540,
                    completed: true
                }
            ]
        })
    });
    
    if (!workoutRes.ok) {
        console.error('❌ Ошибка добавления тренировки');
        return;
    }
    
    const workout = await workoutRes.json();
    console.log('✅ Тренировка добавлена');
    
    // 4. Тестируем получение истории тренировок
    console.log('\n4. Получение истории тренировок...');
    const historyRes = await fetch(`${API_URL}/workouts/history/${user.id}`);
    const history = await historyRes.json();
    console.log('✅ История тренировок получена');
    console.log('   - Всего тренировок в истории:', history.length);
    
    // 5. Тестируем получение записей здоровья
    console.log('\n5. Получение записей здоровья...');
    const healthEntriesRes = await fetch(`${API_URL}/health/${user.id}`);
    const healthEntries = await healthEntriesRes.json();
    console.log('✅ Записи здоровья получены');
    console.log('   - Всего записей:', healthEntries.length);
    
    // 6. Тестируем получение полной статистики пользователя
    console.log('\n6. Получение статистики пользователя...');
    const statsRes = await fetch(`${API_URL}/users/${user.id}/stats`);
    
    if (!statsRes.ok) {
        console.error('❌ Ошибка получения статистики');
        return;
    }
    
    const stats = await statsRes.json();
    console.log('✅ Статистика получена');
    console.log('   - Всего тренировок:', stats.stats.total_workouts);
    console.log('   - Общее время (мин):', Math.floor(stats.stats.total_duration / 60));
    console.log('   - Активных дней:', stats.stats.active_days);
    console.log('   - Стрик:', stats.stats.streak);
    
    // 7. Тестируем получение программ
    console.log('\n7. Получение списка программ...');
    const programsRes = await fetch(`${API_URL}/programs`);
    const programs = await programsRes.json();
    console.log('✅ Программы получены');
    console.log('   - Всего программ:', programs.length);
    
    // 8. Тестируем обновление пользователя
    console.log('\n8. Обновление пользователя...');
    const updateRes = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            weight: 72,
            workouts_per_week: 5
        })
    });
    
    const updatedUser = await updateRes.json();
    console.log('✅ Пользователь обновлен');
    console.log('   - Новый вес:', updatedUser.weight, 'кг');
    console.log('   - Тренировок в неделю:', updatedUser.workouts_per_week);
    
    // 9. Тестируем Health Check
    console.log('\n9. Проверка Health Check...');
    const healthCheckRes = await fetch('http://localhost:5000/health');
    const healthCheck = await healthCheckRes.json();
    console.log('✅ Сервер работает, статус:', healthCheck.status);
    
    console.log('\n🎉 Тестирование завершено успешно!');
    console.log('📊 Итог:');
    console.log('   - Пользователь ID:', user.id);
    console.log('   - Всего тренировок:', stats.stats.total_workouts);
    console.log('   - Записей здоровья:', healthEntries.length);
}

// Запуск тестов с обработкой ошибок
testAPI().catch(error => {
    console.error('❌ Ошибка при выполнении тестов:', error.message);
    console.log('\n⚠️ Убедитесь, что сервер запущен: npm run dev');
});
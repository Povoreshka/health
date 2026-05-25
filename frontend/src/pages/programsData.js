// // programsData.js

// // Группы мышц
// export const muscleGroups = [
//     { id: 'chest', label: 'Грудь', icon: '💪', color: '#FF6B6B' },
//     { id: 'back', label: 'Спина', icon: '🦸', color: '#4ECDC4' },
//     { id: 'legs', label: 'Ноги', icon: '🦵', color: '#45B7D1' },
//     { id: 'arms', label: 'Руки', icon: '💪', color: '#96CEB4' },
//     { id: 'shoulders', label: 'Плечи', icon: '👨‍🚀', color: '#FFD166' },
//     { id: 'abs', label: 'Пресс', icon: '🏋️', color: '#06D6A0' },
//     { id: 'glutes', label: 'Ягодицы', icon: '🍑', color: '#EF476F' },
//     { id: 'cardio', label: 'Кардио', icon: '🏃', color: '#118AB2' },
//     { id: 'fullbody', label: 'Все тело', icon: '👤', color: '#073B4C' },
//     { id: 'functional', label: 'Функц.', icon: '⚡', color: '#7209B7' },
//     { id: 'flexibility', label: 'Гибкость', icon: '🧘', color: '#F72585' },
//     { id: 'strength', label: 'Сила', icon: '🏋️‍♂️', color: '#3A86FF' }
// ];

// // Категории программ
// export const categories = [
//     { id: 'all', label: 'Все программы', icon: '🌟' },
//     { id: 'beginner', label: 'Новичкам', icon: '🌱' },
//     { id: 'intermediate', label: 'Продолжающим', icon: '📈' },
//     { id: 'advanced', label: 'Профи', icon: '🔥' },
//     { id: 'home', label: 'Домашние тренировки', icon: '🏠' },
//     { id: 'gym', label: 'В тренажерном зале', icon: '🏋️' },
//     { id: 'quick', label: 'Экспресс (15-20 мин)', icon: '⏱️' },
//     { id: 'morning', label: 'Утренние', icon: '☀️' },
//     { id: 'evening', label: 'Вечерние', icon: '🌙' }
// ];

// // Цвета интенсивности
// export const intensityColors = {
//     'Низкая': '#4CAF50',
//     'Средняя': '#FF9800',
//     'Высокая': '#F44336',
//     'Очень высокая': '#9C27B0',
//     'Экстремальная': '#D32F2F'
// };

// // Типы упражнений
// export const exerciseTypes = {
//     strength: 'Силовое',
//     cardio: 'Кардио',
//     flexibility: 'Растяжка',
//     balance: 'Баланс',
//     plyometric: 'Плиометрика',
//     calisthenics: 'Воркаут',
//     crossfit: 'Кроссфит',
//     yoga: 'Йога',
//     pilates: 'Пилатес'
// };

// // Уровни сложности упражнений
// export const exerciseLevels = {
//     beginner: 'Начальный',
//     intermediate: 'Средний',
//     advanced: 'Продвинутый',
//     expert: 'Эксперт'
// };

// // ВНИМАНИЕ: Массивы programs и exercises больше НЕ ЭКСПОРТИРУЮТСЯ!
// // Все данные теперь берутся ТОЛЬКО из базы данных через API

// // Оставляем только вспомогательные функции (они будут работать с данными из API)
// export const getExercisesByMuscleGroup = (exercisesList, muscleGroupId) => {
//     return exercisesList.filter(exercise => exercise.muscleGroups?.includes(muscleGroupId));
// };

// export const getExercisesByProgram = (program, allExercises) => {
//     if (!program?.exercises) return [];
//     return program.exercises.map(exId => allExercises.find(e => e.id === exId)).filter(Boolean);
// };
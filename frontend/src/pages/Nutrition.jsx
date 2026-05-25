import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Nutrition.css';

const Nutrition = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('weightGain');
    
    // Состояния для калькулятора калорий
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [activity, setActivity] = useState('moderate');
    const [goal, setGoal] = useState('maintain');
    const [calculatedCalories, setCalculatedCalories] = useState(null);

    React.useEffect(() => {
    window.scrollTo(0, 0);
}, []);

    const nutritionData = {
        weightGain: {
            title: "Питание для набора мышечной массы",
            description: "Сбалансированный рацион для увеличения мышечной массы и силы",
            dailyCalories: "2800-3500 ккал",
            meals: [
                { time: "08:00", name: "Завтрак", items: ["Овсянка с бананом", "Яичница из 3 яиц", "Цельнозерновой хлеб", "Стакан молока"] },
                { time: "11:00", name: "Перекус", items: ["Греческий йогурт", "Горсть орехов", "Протеиновый коктейль"] },
                { time: "14:00", name: "Обед", items: ["Куриная грудка (200г)", "Гречка (150г)", "Овощной салат", "Авокадо"] },
                { time: "17:00", name: "Перекус", items: ["Творог (200г)", "Мед (1 ст.л.)", "Фрукты"] },
                { time: "20:00", name: "Ужин", items: ["Лосось (200г)", "Бурый рис (150г)", "Спаржевая фасоль", "Оливковое масло"] }
            ],
            tips: [
                "Ешьте каждые 3-4 часа",
                "Увеличьте потребление сложных углеводов",
                "Не забывайте про полезные жиры",
                "Пейте достаточно воды (2-3 литра в день)"
            ]
        },
        protein: {
            title: "Белковое питание",
            description: "Рацион с акцентом на белковые продукты для роста мышц",
            dailyCalories: "2500-3000 ккал",
            proteinSources: [
                { name: "Куриная грудка", protein: "25г на 100г", icon: "🍗" },
                { name: "Говядина", protein: "26г на 100г", icon: "🥩" },
                { name: "Лосось", protein: "20г на 100г", icon: "🐟" },
                { name: "Яйца", protein: "6г на яйцо", icon: "🥚" },
                { name: "Творог", protein: "18г на 100г", icon: "🧀" },
                { name: "Греческий йогурт", protein: "10г на 100г", icon: "🥛" },
                { name: "Тофу", protein: "15г на 100г", icon: "🥢" },
                { name: "Чечевица", protein: "9г на 100г", icon: "🌱" }
            ],
            recipes: [
                { name: "Протеиновый омлет", ingredients: ["3 яйца", "100г творога", "Зелень", "Специи"], protein: "35г" },
                { name: "Курица с киноа", ingredients: ["200г курицы", "100г киноа", "Овощи", "Лимонный сок"], protein: "55г" },
                { name: "Творожная запеканка", ingredients: ["250г творога", "2 яйца", "Овсяные хлопья", "Ягоды"], protein: "40г" }
            ]
        },
        healthy: {
            title: "Здоровое питание",
            description: "Сбалансированный рацион для поддержания здоровья и энергии",
            dailyCalories: "2000-2500 ккал",
            principles: [
                { title: "Баланс", description: "Правильное соотношение белков, жиров и углеводов", icon: "⚖️" },
                { title: "Разнообразие", description: "Разные овощи, фрукты и источники белка", icon: "🌈" },
                { title: "Регулярность", description: "5-6 приемов пищи в день небольшими порциями", icon: "⏰" },
                { title: "Натуральность", description: "Минимум обработанных продуктов", icon: "🌿" }
            ],
            superfoods: [
                { name: "Авокадо", benefit: "Полезные жиры, клетчатка", icon: "🥑" },
                { name: "Ягоды", benefit: "Антиоксиданты, витамины", icon: "🫐" },
                { name: "Орехи", benefit: "Омега-3, белок", icon: "🌰" },
                { name: "Брокколи", benefit: "Клетчатка, витамин C", icon: "🥦" },
                { name: "Киноа", benefit: "Полноценный белок", icon: "🌾" },
                { name: "Имбирь", benefit: "Противовоспалительное", icon: "🫚" }
            ]
        },
        weightLoss: {
            title: "Питание для похудения",
            description: "Дефицит калорий без потери мышечной массы",
            dailyCalories: "1500-1800 ккал",
            rules: [
                "Создайте дефицит 300-500 ккал в день",
                "Увеличьте потребление белка",
                "Сократите простые углеводы",
                "Добавьте больше овощей",
                "Пейте воду перед едой",
                "Избегайте сладких напитков"
            ],
            lowCalorieFoods: [
                { name: "Огурцы", calories: "15 ккал/100г", icon: "🥒" },
                { name: "Сельдерей", calories: "16 ккал/100г", icon: "🥬" },
                { name: "Грейпфрут", calories: "42 ккал/100г", icon: "🍊" },
                { name: "Куриная грудка", calories: "165 ккал/100г", icon: "🍗" },
                { name: "Творог 0%", calories: "71 ккал/100г", icon: "🧀" },
                { name: "Шпинат", calories: "23 ккал/100г", icon: "🌿" }
            ]
        }
    };

    // Данные для пятой вкладки "Спорт и вода"
    const sportsWaterData = {
        preWorkout: {
            title: "За 1.5-2 часа до тренировки",
            description: "Сложные углеводы + умеренное количество белка",
            foods: ["Овсянка с бананом", "Рис с курицей", "Цельнозерновой хлеб с творогом", "Макароны из твердых сортов с томатным соусом"],
            avoid: ["Жирная пища", "Быстрые углеводы (сахар, конфеты)", "Газировка", "Острые блюда"]
        },
        postWorkout: {
            title: "В течение 30-60 минут после тренировки",
            description: "Белок + быстрые углеводы (анаболическое окно)",
            foods: ["Протеиновый коктейль (сывороточный протеин)", "Творог с медом и ягодами", "Курица с рисом", "Банан + протеиновый батончик"],
            avoid: ["Алкоголь", "Жирная пища (жареное)", "Фастфуд"]
        },
        workoutTips: [
            { tip: "Пейте воду во время тренировки каждые 15-20 минут по 150-200 мл", icon: "💧" },
            { tip: "Не тренируйтесь на голодный желудок - это может привести к катаболизму мышц", icon: "⚠️" },
            { tip: "За 30 минут до тренировки можно выпить черный кофе или зеленый чай без сахара", icon: "☕" },
            { tip: "После тренировки обязательна заминка (растяжка) на 10-15 минут", icon: "🧘" }
        ],
        waterIntake: {
            formula: "Вес (кг) × 30-35 мл = суточная норма",
            tips: [
                "Пейте 1-2 стакана воды сразу после пробуждения - запускает метаболизм",
                "За 20-30 минут до еды - улучшает пищеварение и снижает аппетит",
                "Во время тренировки - каждые 15-20 минут по глотку",
                "Пейте воду комнатной температуры - она лучше усваивается",
                "Добавьте лимон или мяту для вкуса, если трудно пить воду"
            ],
            signsOfDehydration: [
                "Сухость во рту",
                "Темная моча",
                "Головная боль",
                "Снижение работоспособности",
                "Мышечные судороги"
            ]
        },
        supplements: [
            { name: "Протеин", description: "Восстановление мышц, 1.5-2г на кг веса в день", icon: "🥛", bestTime: "После тренировки или между приемами пищи" },
            { name: "Креатин", description: "Увеличивает силу и выносливость", icon: "⚡", bestTime: "После тренировки, 3-5г в день" },
            { name: "BCAA", description: "Защита мышц от разрушения", icon: "💪", bestTime: "До, во время или после тренировки" },
            { name: "Омега-3", description: "Поддержка суставов и сердца", icon: "🐟", bestTime: "Во время еды" },
            { name: "Витамин D", description: "Усвоение кальция, иммунитет", icon: "☀️", bestTime: "Утром во время еды" }
        ]
    };

    // Функция расчета калорий по формуле Миффлина - Сан Жеора
    const calculateCalories = () => {
        if (!weight || !height || !age) return;
        
        let bmr;
        bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseFloat(age) + 5;
        
        let activityMultiplier;
        switch(activity) {
            case 'sedentary': activityMultiplier = 1.2; break;
            case 'light': activityMultiplier = 1.375; break;
            case 'moderate': activityMultiplier = 1.55; break;
            case 'active': activityMultiplier = 1.725; break;
            default: activityMultiplier = 1.55;
        }
        
        let tdee = bmr * activityMultiplier;
        
        if (goal === 'loss') tdee -= 300;
        else if (goal === 'gain') tdee += 300;
        
        setCalculatedCalories(Math.round(tdee));
    };

    // Рендер новой вкладки "Спорт и вода"
    const renderSportsWaterTab = () => {
        return (
            <div className="nutrition-content">
                {/* Питание до и после тренировки */}
                <div className="workout-nutrition-section">
                    <h3>🏋️ Питание и тренировки</h3>
                    <div className="workout-grid">
                        <div className="workout-card before">
                            <div className="workout-icon">🏃‍♂️</div>
                            <h4>ДО ТРЕНИРОВКИ</h4>
                            <p className="workout-time">{sportsWaterData.preWorkout.title}</p>
                            <p className="workout-desc">{sportsWaterData.preWorkout.description}</p>
                            <div className="food-list">
                                <strong>✅ Рекомендуется:</strong>
                                <ul>
                                    {sportsWaterData.preWorkout.foods.map((food, idx) => (
                                        <li key={idx}>{food}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="avoid-list">
                                <strong>❌ Избегать:</strong> {sportsWaterData.preWorkout.avoid.join(', ')}
                            </div>
                        </div>
                        <div className="workout-card after">
                            <div className="workout-icon">🏋️‍♂️</div>
                            <h4>ПОСЛЕ ТРЕНИРОВКИ</h4>
                            <p className="workout-time">{sportsWaterData.postWorkout.title}</p>
                            <p className="workout-desc">{sportsWaterData.postWorkout.description}</p>
                            <div className="food-list">
                                <strong>✅ Рекомендуется:</strong>
                                <ul>
                                    {sportsWaterData.postWorkout.foods.map((food, idx) => (
                                        <li key={idx}>{food}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="avoid-list">
                                <strong>❌ Избегать:</strong> {sportsWaterData.postWorkout.avoid.join(', ')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Советы по тренировкам */}
                <div className="workout-tips-section">
                    <h3>📌 Важные советы</h3>
                    <div className="workout-tips-grid">
                        {sportsWaterData.workoutTips.map((item, index) => (
                            <div key={index} className="workout-tip-card">
                                <div className="workout-tip-icon">{item.icon}</div>
                                <p>{item.tip}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Водный баланс */}
                <div className="water-balance-section">
                    <h3>💧 Водный баланс</h3>
                    <div className="water-info">
                        <div className="water-formula">
                            <div className="water-icon">💦</div>
                            <div>
                                <strong>{sportsWaterData.waterIntake.formula}</strong>
                                <p className="water-example">Пример: при весе 70 кг нужно 2.1 - 2.45 литра воды в день</p>
                            </div>
                        </div>
                        <div className="water-tips">
                            <div className="water-tips-title">📋 Правила питьевого режима:</div>
                            {sportsWaterData.waterIntake.tips.map((tip, idx) => (
                                <div key={idx} className="water-tip">✓ {tip}</div>
                            ))}
                        </div>
                        <div className="dehydration-signs">
                            <div className="dehydration-title">⚠️ Признаки обезвоживания:</div>
                            <div className="signs-list">
                                {sportsWaterData.waterIntake.signsOfDehydration.map((sign, idx) => (
                                    <span key={idx} className="sign-badge">{sign}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Спортивные добавки */}
                <div className="supplements-section">
                    <h3>💊 Спортивные добавки (база)</h3>
                    <div className="supplements-grid">
                        {sportsWaterData.supplements.map((supp, index) => (
                            <div key={index} className="supplement-card">
                                <div className="supplement-icon">{supp.icon}</div>
                                <div className="supplement-info">
                                    <h4>{supp.name}</h4>
                                    <p>{supp.description}</p>
                                    <div className="supplement-time">🕐 {supp.bestTime}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="supplements-note">
                        💡 *Перед приемом любых добавок рекомендуется проконсультироваться с врачом
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (activeTab === 'sportsWater') {
            return renderSportsWaterTab();
        }

        const data = nutritionData[activeTab];
        
        switch(activeTab) {
            case 'weightGain':
                return (
                    <div className="nutrition-content">
                        <div className="content-header">
                            <h2>{data.title}</h2>
                            <p className="description">{data.description}</p>
                            <div className="calories-badge">
                                <span>💪</span>
                                <div>
                                    <div className="calories-title">Рекомендуемая норма</div>
                                    <div className="calories-value">{data.dailyCalories}</div>
                                </div>
                            </div>
                        </div>

                        <div className="meal-plan">
                            <h3>Пример плана питания</h3>
                            <div className="meals-timeline">
                                {data.meals.map((meal, index) => (
                                    <div key={index} className="meal-card">
                                        <div className="meal-time">{meal.time}</div>
                                        <h4>{meal.name}</h4>
                                        <ul>
                                            {meal.items.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="tips-section">
                            <h3>Советы</h3>
                            <div className="tips-grid">
                                {data.tips.map((tip, index) => (
                                    <div key={index} className="tip-card">
                                        <div className="tip-number">{index + 1}</div>
                                        <p>{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'protein':
                return (
                    <div className="nutrition-content">
                        <div className="content-header">
                            <h2>{data.title}</h2>
                            <p className="description">{data.description}</p>
                            <div className="protein-target">
                                <div className="target-info">
                                    <div className="target-icon">🎯</div>
                                    <div>
                                        <div className="target-title">Цель по белку</div>
                                        <div className="target-value">1.6-2.2 г на кг веса</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="protein-sources">
                            <h3>Источники белка</h3>
                            <div className="sources-grid">
                                {data.proteinSources.map((source, index) => (
                                    <div key={index} className="source-card">
                                        <div className="source-icon">{source.icon}</div>
                                        <div className="source-info">
                                            <h4>{source.name}</h4>
                                            <p>{source.protein} белка</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="recipes-section">
                            <h3>Белковые рецепты</h3>
                            <div className="recipes-grid">
                                {data.recipes.map((recipe, index) => (
                                    <div key={index} className="recipe-card">
                                        <div className="recipe-header">
                                            <h4>{recipe.name}</h4>
                                            <div className="recipe-protein">{recipe.protein} белка</div>
                                        </div>
                                        <ul className="recipe-ingredients">
                                            {recipe.ingredients.map((ingredient, idx) => (
                                                <li key={idx}>{ingredient}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'healthy':
                return (
                    <div className="nutrition-content">
                        <div className="content-header">
                            <h2>{data.title}</h2>
                            <p className="description">{data.description}</p>
                            <div className="macros-info">
                                <div className="macro-item">
                                    <div className="macro-value">30%</div>
                                    <div className="macro-label">Белки</div>
                                </div>
                                <div className="macro-item">
                                    <div className="macro-value">40%</div>
                                    <div className="macro-label">Углеводы</div>
                                </div>
                                <div className="macro-item">
                                    <div className="macro-value">30%</div>
                                    <div className="macro-label">Жиры</div>
                                </div>
                            </div>
                        </div>

                        <div className="principles-section">
                            <h3>Принципы здорового питания</h3>
                            <div className="principles-grid">
                                {data.principles.map((principle, index) => (
                                    <div key={index} className="principle-card">
                                        <div className="principle-icon">{principle.icon}</div>
                                        <h4>{principle.title}</h4>
                                        <p>{principle.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="superfoods-section">
                            <h3>Суперфуды</h3>
                            <div className="superfoods-grid">
                                {data.superfoods.map((food, index) => (
                                    <div key={index} className="superfood-card">
                                        <div className="superfood-icon">{food.icon}</div>
                                        <div className="superfood-info">
                                            <h4>{food.name}</h4>
                                            <p>{food.benefit}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'weightLoss':
                return (
                    <div className="nutrition-content">
                        <div className="content-header">
                            <h2>{data.title}</h2>
                            <p className="description">{data.description}</p>
                            <div className="calories-badge">
                                <span>⚡</span>
                                <div>
                                    <div className="calories-title">Дефицит калорий</div>
                                    <div className="calories-value">{data.dailyCalories}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rules-section">
                            <h3>Основные правила</h3>
                            <div className="rules-list">
                                {data.rules.map((rule, index) => (
                                    <div key={index} className="rule-item">
                                        <div className="rule-check">✓</div>
                                        <p>{rule}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="low-calorie-foods">
                            <h3>Низкокалорийные продукты</h3>
                            <div className="foods-grid">
                                {data.lowCalorieFoods.map((food, index) => (
                                    <div key={index} className="food-card">
                                        <div className="food-icon">{food.icon}</div>
                                        <div className="food-info">
                                            <h4>{food.name}</h4>
                                            <p>{food.calories}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="nutrition-page">
            <div className="nutrition-header">
                <h1>Правильное питание</h1>
                <button className="back-button" onClick={() => navigate('/home')}>
                    ← 
                </button>
            </div>

            <div className="nutrition-tabs">
                <button 
                    className={`tab-button ${activeTab === 'weightGain' ? 'active' : ''}`}
                    onClick={() => setActiveTab('weightGain')}
                >
                    <span className="tab-icon">💪</span>
                    <span className="tab-text">Набор массы</span>
                </button>
                <button 
                    className={`tab-button ${activeTab === 'protein' ? 'active' : ''}`}
                    onClick={() => setActiveTab('protein')}
                >
                    <span className="tab-icon">🥩</span>
                    <span className="tab-text">Белки</span>
                </button>
                <button 
                    className={`tab-button ${activeTab === 'healthy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('healthy')}
                >
                    <span className="tab-icon">🥗</span>
                    <span className="tab-text">Здоровое</span>
                </button>
                <button 
                    className={`tab-button ${activeTab === 'weightLoss' ? 'active' : ''}`}
                    onClick={() => setActiveTab('weightLoss')}
                >
                    <span className="tab-icon">⚖️</span>
                    <span className="tab-text">Похудение</span>
                </button>
                <button 
                    className={`tab-button ${activeTab === 'sportsWater' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sportsWater')}
                >
                    <span className="tab-icon">🏋️</span>
                    <span className="tab-text">Спорт & Вода</span>
                </button>
            </div>

            {/* Калькулятор калорий */}
            <div className="nutrition-calculator">
                <h3>📊 Калькулятор дневной нормы калорий</h3>
                <div className="calculator-form">
                    <div className="calc-row">
                        <input 
                            type="number" 
                            placeholder="Вес (кг)" 
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                        <input 
                            type="number" 
                            placeholder="Рост (см)" 
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                        <input 
                            type="number" 
                            placeholder="Возраст (лет)" 
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                        />
                    </div>
                    <div className="calc-row">
                        <select value={activity} onChange={(e) => setActivity(e.target.value)}>
                            <option value="sedentary">Минимальная активность</option>
                            <option value="light">Легкая активность (1-3 раза в неделю)</option>
                            <option value="moderate">Средняя активность (3-5 раз)</option>
                            <option value="active">Высокая активность (6-7 раз)</option>
                        </select>
                        <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                            <option value="loss">Похудение (-300 ккал)</option>
                            <option value="maintain">Поддержание веса</option>
                            <option value="gain">Набор массы (+300 ккал)</option>
                        </select>
                        <button onClick={calculateCalories}>Рассчитать</button>
                    </div>
                    {calculatedCalories && (
                        <div className="calculator-result">
                            <div className="result-value">{calculatedCalories} ккал</div>
                            <div className="result-label">ваша дневная норма</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="nutrition-main">
                {renderContent()}
            </div>
        </div>
    );
};

export default Nutrition;
export class UIManager {
    constructor(sceneManager, animalsData) {
        this.sceneManager = sceneManager;
        this.animalsData = animalsData;
        this.currentAnimal = null;
        this.currentSystem = 'skeleton';
        this.currentGender = null;
        
        console.log('🔄 UIManager создан');
        this.init();
    }

    init() {
        console.log('🚀 Инициализация UIManager');
        console.log('📋 Данные животных:', this.animalsData);
        
        this.renderAnimalList();
        this.setupEventListeners();
        this.setupAnimalSelector();
        
        console.log('✅ UIManager готов');
    }

    setupEventListeners() {
        console.log('🔧 Настройка обработчиков событий...');
        
        // Кнопка меню
        const menuToggle = document.getElementById('menu-toggle');
        console.log('Кнопка меню:', menuToggle);
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                console.log('📱 Кнопка меню нажата!');
                this.toggleMenuPanel();
            });
        } else {
            console.error('❌ Кнопка меню не найдена!');
        }

        // Клики по пунктам меню
        document.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                const menuText = menuItem.querySelector('.menu-text').textContent;
                console.log('📝 Выбран пункт меню:', menuText);
                this.handleMenuItemClick(menuText);
                this.hideMenuPanel();
            }

            // Клик на системе
            const systemBtn = e.target.closest('.system-btn');
            if (systemBtn) {
                const system = systemBtn.dataset.system;
                console.log('🔬 Выбрана система:', system);
                this.selectSystem(system);
                return;
            }
        });

        // Сброс вида
        const resetView = document.getElementById('reset-view');
        if (resetView) {
            resetView.addEventListener('click', () => {
                console.log('🔄 Сброс вида');
                this.sceneManager.centerModel();
            });
        }

        console.log('✅ Обработчики событий настроены');
    }

    setupAnimalSelector() {
        console.log('🔧 Настройка селектора животных...');
        
        const animalSelectorBtn = document.getElementById('animal-selector-btn');
        const animalSelectorPanel = document.getElementById('animal-selector-panel');
        const closePanelBtn = document.querySelector('.close-panel-btn');
        
        if (animalSelectorBtn && animalSelectorPanel) {
            // Открытие панели
            animalSelectorBtn.addEventListener('click', () => {
                console.log('🐾 Открываем панель выбора животных');
                this.showAnimalSelector();
            });
            
            // Закрытие панели
            if (closePanelBtn) {
                closePanelBtn.addEventListener('click', () => {
                    this.hideAnimalSelector();
                });
            }
            
            // Заполняем список животных в панели
            this.renderAnimalSelectorList();
        } else {
            console.error('❌ Элементы селектора животных не найдены!', {
                btn: animalSelectorBtn,
                panel: animalSelectorPanel
            });
        }
    }

    showAnimalSelector() {
        const panel = document.getElementById('animal-selector-panel');
        const btn = document.getElementById('animal-selector-btn');
        
        console.log('📱 Показываем панель выбора животных');
        
        if (panel && btn) {
            panel.classList.remove('hidden');
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
            
            setTimeout(() => {
                panel.classList.add('active');
            }, 10);
        }
    }

    hideAnimalSelector() {
        const panel = document.getElementById('animal-selector-panel');
        const btn = document.getElementById('animal-selector-btn');
        
        console.log('📱 Скрываем панель выбора животных');
        
        if (panel && btn) {
            panel.classList.remove('active');
            
            setTimeout(() => {
                panel.classList.add('hidden');
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'all';
            }, 300);
        }
    }

    renderAnimalSelectorList() {
        const container = document.querySelector('#animal-selector-panel .animal-selector-content');
        console.log('📝 Рендерим список животных в селекторе:', container);
        
        if (!container) {
            console.error('❌ Контейнер списка животных в селекторе не найден!');
            return;
        }

        // Иконки для разных животных
        const animalIcons = {
            'dog': '🐕',
            'cat': '🐈',
            'horse': '🐎',
            'cow': '🐄',
            'pig': '🐖',
            'sheep': '🐑',
            'goat': '🐐',
            'rabbit': '🐇',
            'chicken': '🐔',
            'duck': '🦆'
        };

        let html = `
            <div class="animal-selector-main">
                <div class="animal-selector-list">
        `;
        
        this.animalsData.forEach(animal => {
            const icon = animalIcons[animal.id] || '🐾';
            html += `
                <div class="animal-selector-item" data-animal="${animal.id}">
                    <div class="animal-item-icon">${icon}</div>
                    <div class="animal-item-info">
                        <div class="animal-item-name">${animal.name}</div>
                        <div class="animal-item-latin">${animal.latin || animal.id}</div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="animal-gender-sidebar">
                    <div class="gender-btn-wrapper">
                        <button class="gender-btn" data-gender="male">♂</button>
                    </div>
                    <div class="gender-btn-wrapper">
                        <button class="gender-btn" data-gender="female">♀</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        
        // Добавляем обработчики для кнопок пола
        container.querySelectorAll('.gender-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gender = btn.dataset.gender;
                
                console.log(`🎯 Выбран пол:`, gender);
                
                // Снимаем активный класс со всех кнопок пола
                container.querySelectorAll('.gender-btn').forEach(b => {
                    b.classList.remove('active');
                });
                
                // Добавляем активный класс нажатой кнопке
                btn.classList.add('active');
                
                this.currentGender = gender;
                console.log('✅ Установлен пол:', gender);
            });
        });
        
        // Добавляем обработчики кликов для животных
        container.querySelectorAll('.animal-selector-item').forEach(item => {
            item.addEventListener('click', () => {
                const animalId = item.dataset.animal;
                console.log('🎯 Выбрано животное из селектора:', animalId);
                this.selectAnimal(animalId);
                this.hideAnimalSelector();
            });
        });
        
        console.log('✅ Список животных в селекторе отрендерен');
    }

    toggleMenuPanel() {
        const leftMenuPanel = document.getElementById('left-menu-panel');
        const menuToggle = document.getElementById('menu-toggle');
        
        if (leftMenuPanel && menuToggle) {
            const isExpanded = leftMenuPanel.classList.contains('menu-expanded');
            
            if (isExpanded) {
                leftMenuPanel.classList.remove('menu-expanded');
                menuToggle.textContent = '☰';
            } else {
                leftMenuPanel.classList.add('menu-expanded');
                menuToggle.textContent = '✕';
            }
        }
    }

    hideMenuPanel() {
        const leftMenuPanel = document.getElementById('left-menu-panel');
        const menuToggle = document.getElementById('menu-toggle');
        
        if (leftMenuPanel && menuToggle) {
            leftMenuPanel.classList.remove('menu-expanded');
            menuToggle.textContent = '☰';
        }
    }

    handleMenuItemClick(menuItem) {
        console.log('🔄 Обрабатываем клик по:', menuItem);
        switch(menuItem) {
            case 'Личный кабинет':
                console.log('👤 Открываем личный кабинет');
                break;
            case 'Настройки':
                console.log('⚙️ Открываем настройки');
                break;
            case 'О приложении':
                console.log('ℹ️ Открываем о приложении');
                break;
            case 'Материалы':
                console.log('📚 Открываем материалы');
                break;
            case 'Поиск':
                console.log('🔍 Открываем поиск');
                break;
            case 'Избранное':
                console.log('⭐ Открываем избранное');
                break;
        }
    }

    renderAnimalList() {
        const container = document.querySelector('.animal-list');
        console.log('📝 Рендерим список животных в:', container);
        
        if (!container) {
            console.error('❌ Контейнер списка животных не найден!');
            return;
        }

        let html = '';
        
        this.animalsData.forEach(animal => {
            html += `
                <div class="animal-item" data-animal="${animal.id}">
                    <div class="animal-name">${animal.name}</div>
                    <div class="animal-description">${animal.description}</div>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log('✅ Список животных отрендерен');
    }

    async selectAnimal(animalId) {
        console.log('🎯 Выбираем животное:', animalId);
        
        const animal = this.animalsData.find(a => a.id === animalId);
        if (!animal) {
            console.error('❌ Животное не найдено:', animalId);
            return;
        }

        this.currentAnimal = animal;
        console.log('📋 Выбрано:', animal.name, 'Пол:', this.currentGender);
        
        // Формируем путь к модели с учетом пола
        let modelPath;
        if (this.currentGender === 'male' && animal.models.male) {
            modelPath = animal.models.male[this.currentSystem];
        } else if (this.currentGender === 'female' && animal.models.female) {
            modelPath = animal.models.female[this.currentSystem];
        } else {
            modelPath = animal.models[this.currentSystem];
        }
        
        console.log('🔄 Путь к модели:', modelPath);
        
        if (modelPath) {
            await this.loadAnimalModel(modelPath);
        } else {
            console.error('❌ Путь к модели не найден');
        }
    }

    async selectSystem(system) {
        console.log('🔬 Выбираем систему:', system);
        
        this.currentSystem = system;
        
        document.querySelectorAll('.system-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-system="${system}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            console.log('✅ Кнопка системы активирована');
        }
        
        if (this.currentAnimal) {
            let modelPath;
            if (this.currentGender === 'male' && this.currentAnimal.models.male) {
                modelPath = this.currentAnimal.models.male[system];
            } else if (this.currentGender === 'female' && this.currentAnimal.models.female) {
                modelPath = this.currentAnimal.models.female[system];
            } else {
                modelPath = this.currentAnimal.models[system];
            }
            
            if (modelPath) {
                await this.loadAnimalModel(modelPath);
            }
        }
    }

    async loadAnimalModel(modelPath) {
        try {
            console.log('📦 Загружаем модель...');
            await this.sceneManager.loadModel(modelPath);
            console.log('✅ Модель загружена!');
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            const wasHidden = sidebar.classList.contains('sidebar-hidden');
            sidebar.classList.toggle('sidebar-hidden');
            console.log('📱 Сайдбар переключен. Сейчас скрыт:', !wasHidden);
        } else {
            console.error('❌ Сайдбар не найден!');
        }
    }
}
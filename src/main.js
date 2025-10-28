import { SceneManager } from './app/sceneManager.js';
import { UIManager } from './app/uiManager.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Загружаем данные о животных
        const response = await fetch('/src/data/animals.json');
        const animalsData = await response.json();

        // Инициализируем менеджеры
        const sceneManager = new SceneManager('canvas3d');
        const uiManager = new UIManager(sceneManager, animalsData);

        console.log('Приложение инициализировано!');

    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
    }
});
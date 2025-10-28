import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class SceneManager {
    constructor(canvasId) {
        this.THREE = THREE;
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            powerPreference: "high-performance"
        });
        
        this.controls = null;
        this.currentModel = null;
        this.loader = new GLTFLoader();
        this.shadowPlane = null;
        this.envMap = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing SceneManager with deep shadow lighting');
        
        // Настройка рендерера
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1; // Немного уменьшил для глубоких теней

        // БЕЛЫЙ ФОН
        this.scene.background = new THREE.Color(0xffffff);

        // Настройка камеры
        this.camera.position.set(5, 4, 5);
        this.camera.lookAt(0, 0.5, 0);

        // ЗАГРУЗКА HDRI ОКРУЖЕНИЯ
        await this.loadStudioHDRI();

        // ОСВЕЩЕНИЕ С ГЛУБОКИМИ ТЕНЯМИ
        this.setupDeepShadowLighting();

        // СТУДИЙНАЯ ПЛОСКОСТЬ
        this.createStudioFloor();

        // OrbitControls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.maxDistance = 25;
        this.controls.minDistance = 0.1;

        // Обработка ресайза
        window.addEventListener('resize', () => this.onWindowResize());

        // Запуск анимации
        this.animate();
        
        console.log('SceneManager initialized with deep shadow lighting');
    }

    async loadStudioHDRI() {
        try {
            // Создаем студийное HDRI с контрастом для теней
            const resolution = 256;
            const data = new Uint8Array(resolution * resolution * 4);
            
            for (let y = 0; y < resolution; y++) {
                for (let x = 0; x < resolution; x++) {
                    const i = (y * resolution + x) * 4;
                    const intensity = 0.6 + (y / resolution) * 0.4; // Более контрастный градиент
                    
                    data[i] = 255 * intensity;
                    data[i + 1] = 255 * intensity;
                    data[i + 2] = 255 * intensity;
                    data[i + 3] = 255;
                }
            }
            
            const texture = new THREE.DataTexture(data, resolution, resolution, THREE.RGBAFormat);
            texture.needsUpdate = true;
            
            this.envMap = new THREE.PMREMGenerator(this.renderer).fromEquirectangular(texture).texture;
            this.scene.environment = this.envMap;
            
            console.log('Contrast HDRI environment created');
            
        } catch (error) {
            console.warn('HDRI loading failed:', error);
        }
    }

    setupDeepShadowLighting() {
        console.log('Setting up lighting with deep shadows');

        // 1. ОСНОВНОЙ СВЕТ С ГЛУБОКИМИ ТЕНЯМИ
        const keyLight = new THREE.DirectionalLight(0xfff4e5, 3.5); // Увеличил интенсивность
        keyLight.position.set(12, 18, 8); // Выше и дальше для более длинных теней
        keyLight.castShadow = true;
        
        // НАСТРОЙКИ ДЛЯ ГЛУБОКИХ ТЕНЕЙ
        keyLight.shadow.mapSize.width = 4096;
        keyLight.shadow.mapSize.height = 4096;
        keyLight.shadow.camera.near = 0.05;
        keyLight.shadow.camera.far = 60; // Увеличил дальность
        keyLight.shadow.camera.left = -20;
        keyLight.shadow.camera.right = 20;
        keyLight.shadow.camera.top = 20;
        keyLight.shadow.camera.bottom = -20;
        keyLight.shadow.bias = -0.0002; // Уменьшил bias для более четких теней
        keyLight.shadow.normalBias = 0.05; // Увеличил для лучшего объема

        // 2. ЗАПОЛНЯЮЩИЙ СВЕТ - меньше интенсивности чтобы не засвечивать тени
        const fillLight = new THREE.DirectionalLight(0xe8f4ff, 1.2); // Уменьшил интенсивность
        fillLight.position.set(-8, 6, 6);
        fillLight.castShadow = false;

        // 3. КОНТУРНЫЙ СВЕТ - подчеркивает края без засветки теней
        const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
        rimLight.position.set(-6, 5, -15); // Дальше для более резких контуров
        rimLight.castShadow = false;

        // 4. ВЕРХНИЙ СВЕТ - мягкий для деталей
        const topLight = new THREE.DirectionalLight(0xffffff, 0.8); // Уменьшил
        topLight.position.set(0, 25, 0);
        topLight.castShadow = false;

        // 5. НИЖНИЙ СВЕТ - минимальный чтобы сохранить тени снизу
        const bottomLight = new THREE.DirectionalLight(0xfff8ee, 0.4); // Сильно уменьшил
        bottomLight.position.set(0, -12, 0);
        bottomLight.castShadow = false;

        // 6. ОБЩЕЕ ОСВЕЩЕНИЕ - уменьшил для контраста
        const ambientLight = new THREE.AmbientLight(0x404080, 0.08); // Минимальное

        this.scene.add(keyLight, fillLight, rimLight, topLight, bottomLight, ambientLight);

        // МЕНЬШЕ ЗАПОЛНЯЮЩИХ СВЕТОВ ДЛЯ СОХРАНЕНИЯ ТЕНЕЙ
        this.addMinimalFillLights();
    }

    addMinimalFillLights() {
        // Только 4 источника для минимального заполнения
        const positions = [
            [10, 8, 0], [-10, 8, 0], [0, 8, 10], [0, 8, -10]
        ];

        positions.forEach(pos => {
            const light = new THREE.PointLight(0xffffff, 0.2, 25); // Уменьшил интенсивность
            light.position.set(pos[0], pos[1], pos[2]);
            light.castShadow = false;
            this.scene.add(light);
        });
    }

    createStudioFloor() {
        const planeGeometry = new THREE.PlaneGeometry(30, 30);
        
        // Более контрастный материал пола
        const planeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xf0f0f0, // Темнее для контраста
            roughness: 0.9,   // Больше шероховатости
            metalness: 0.05,
            transparent: true,
            opacity: 0.9,     // Меньше прозрачности
            transmission: 0.05,
            thickness: 1.0
        });
        
        this.shadowPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.shadowPlane.rotation.x = -Math.PI / 2;
        this.shadowPlane.position.y = 0;
        this.shadowPlane.receiveShadow = true;
        
        this.scene.add(this.shadowPlane);

        // Более заметная сетка
        const gridHelper = new THREE.GridHelper(20, 20, 0xaaaaaa, 0xaaaaaa);
        gridHelper.position.y = 0.01;
        gridHelper.material.opacity = 0.12;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    async loadModel(modelPath) {
        return new Promise((resolve, reject) => {
            this.showLoading();
            
            console.log('Loading model from:', modelPath);

            this.loader.load(
                modelPath,
                (gltf) => {
                    console.log('Model loaded successfully:', gltf);
                    
                    if (this.currentModel) {
                        this.scene.remove(this.currentModel);
                    }
                    
                    this.currentModel = gltf.scene;
                    
                    // МАТЕРИАЛЫ С АКЦЕНТОМ НА ТЕНИ
                    this.currentModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            if (child.geometry) {
                                child.geometry.computeVertexNormals();
                                child.geometry.attributes.normal.needsUpdate = true;
                                
                                // УСИЛИВАЕМ ГЕОМЕТРИЮ ДЛЯ ЛУЧШИХ ТЕНЕЙ
                                this.enhanceGeometryForShadows(child.geometry);
                            }
                            
                            if (child.material) {
                                child.material = new THREE.MeshPhysicalMaterial({
                                    color: 0xf0e6c8,
                                    metalness: 0.08,
                                    roughness: 0.45, // Больше шероховатости для глубоких теней
                                    clearcoat: 0.2,  // Меньше лака
                                    clearcoatRoughness: 0.3,
                                    sheen: 0.05,     // Меньше блеска
                                    sheenRoughness: 0.9,
                                    sheenColor: 0xfff5e1,
                                    envMap: this.envMap,
                                    envMapIntensity: 0.3, // Меньше отражений
                                    reflectivity: 0.15,
                                    transmission: 0.005, // Минимальная прозрачность
                                    thickness: 0.8
                                });
                            }
                        }
                    });
                    
                    this.scene.add(this.currentModel);
                    this.centerModel();
                    this.hideLoading();
                    
                    resolve(this.currentModel);
                },
                (progress) => {
                    if (progress.lengthComputable) {
                        const percent = (progress.loaded / progress.total * 100);
                        console.log(`Loaded: ${percent.toFixed(1)}%`);
                        this.updateLoadingProgress(percent);
                    }
                },
                (error) => {
                    console.error('Error loading model:', error);
                    this.hideLoading();
                    this.showError('Error loading model: ' + error.message);
                    reject(error);
                }
            );
        });
    }

    enhanceGeometryForShadows(geometry) {
        // Усиливаем нормали для более выраженных теней
        const position = geometry.attributes.position;
        const normal = geometry.attributes.normal;
        
        if (position && normal) {
            for (let i = 0; i < normal.count; i++) {
                const x = normal.getX(i);
                const y = normal.getY(i);
                const z = normal.getZ(i);
                
                const length = Math.sqrt(x * x + y * y + z * z);
                if (length > 0) {
                    // Усиливаем нормали для более контрастных теней
                    normal.setXYZ(
                        i,
                        (x / length) * 1.4,
                        (y / length) * 1.4,
                        (z / length) * 1.4
                    );
                }
            }
            normal.needsUpdate = true;
        }
    }

    centerModel() {
        if (!this.currentModel) return;

        const box = new THREE.Box3().setFromObject(this.currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        this.currentModel.position.x = -center.x;
        this.currentModel.position.z = -center.z;

        const minY = box.min.y;
        this.currentModel.position.y = -minY + 0.05; // Чуть ниже для более длинных теней

        console.log('Model positioned at Y:', this.currentModel.position.y);

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.6;
        
        this.camera.position.set(cameraZ * 0.7, cameraZ * 0.5, cameraZ * 0.7);
        this.controls.target.set(0, size.y / 4, 0);
        this.controls.update();
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('loading-hidden');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('loading-hidden');
        }
    }

    updateLoadingProgress(percent) {
        const loading = document.getElementById('loading');
        if (loading) {
            const progressText = loading.querySelector('p');
            if (progressText) {
                progressText.textContent = `Загрузка... ${percent.toFixed(1)}%`;
            }
        }
    }

    showError(message) {
        console.error(message);
        alert(message);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}
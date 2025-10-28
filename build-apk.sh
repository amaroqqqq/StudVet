#!/bin/bash

echo "🐳 Сборка APK через Docker..."

# Создаем Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Установка необходимых пакетов
RUN apk add --no-cache openjdk11 wget unzip

# Установка Android SDK
RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
    unzip -q commandlinetools-linux-*.zip && \
    mkdir -p android-sdk/cmdline-tools/latest && \
    mv cmdline-tools/* android-sdk/cmdline-tools/latest/ && \
    rm commandlinetools-linux-*.zip

ENV ANDROID_SDK_ROOT=/android-sdk
ENV PATH=$PATH:/android-sdk/cmdline-tools/latest/bin

# Принятие лицензий и установка компонентов
RUN yes | sdkmanager --licenses > /dev/null 2>&1 && \
    sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

WORKDIR /app
COPY . .

# Сборка приложения
RUN npm install && npm run build && \
    npm install @capacitor/core @capacitor/cli @capacitor/android && \
    npx cap init "ВетАтлас" "com.vet.atlas" --web-dir dist && \
    npx cap add android && npx cap sync && \
    cd android && chmod +x ./gradlew && ./gradlew assembleDebug

CMD ["cp", "/app/android/app/build/outputs/apk/debug/app-debug.apk", "/output/"]
EOF

# Собираем и запускаем контейнер
docker build -t vet-anatlas-builder .
docker run -v $(pwd):/output vet-anatlas-builder

echo "✅ APK собран: app-debug.apk"
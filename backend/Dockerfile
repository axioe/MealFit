# 운영 배포용 이미지. 실행: 루트에서 docker compose -f docker-compose.prod.yml up -d --build
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# 의존성 먼저 받아서 캐시 (소스만 바뀌면 이 단계는 재사용)
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon > /dev/null

COPY src src
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# t3.small(2GB)에서 MariaDB·nginx와 같이 돌리므로 힙을 제한한다
ENV JAVA_OPTS="-Xms256m -Xmx512m"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

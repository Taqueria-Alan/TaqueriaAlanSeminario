pipeline {
    agent any
    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }
    environment {
        COMPOSE_PROJECT_NAME = 'taqueria-staging'
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git rev-parse --short HEAD'
            }
        }
        stage('Build') {
            steps {
                sh '''
                    set -eu
                    mvn -B -ntp clean verify
                    # Los microservicios Java consumen bastante memoria al resolver Maven.
                    # En Docker Desktop se construyen de uno en uno para evitar agotar el motor.
                    COMPOSE_PARALLEL_LIMIT=1 IMAGE_TAG="$(git rev-parse --short HEAD)-${BUILD_NUMBER}" \
                      docker compose -f docker/docker-compose.yml build \
                      mysql db-migrations auth-service catalogo-service pedidos-service pagos-service club-alan-service
                '''
            }
        }
        stage('Test') {
            steps {
                sh '''
                    test -f tests/requirements.txt || {
                      echo "Falta tests/requirements.txt y la suite Pytest del proyecto" >&2
                      exit 1
                    }
                    find tests -name 'test_*.py' | grep -q . || {
                      echo "No hay pruebas Pytest en tests/" >&2
                      exit 1
                    }
                '''
                sh '''
                        set -eu
                        export IMAGE_TAG="$(git rev-parse --short HEAD)-${BUILD_NUMBER}"
                        # No reutilizar evidencia ignorada de ejecuciones anteriores.
                        rm -rf reports
                        mkdir -p reports
                        # CI usa la configuración efímera no productiva definida por Docker Compose.
                        # Las credenciales de producción nunca se incluyen en este pipeline.
                        export MYSQL_DATABASE=taqueria_db MYSQL_USER=taqueria
                        export MYSQL_PORT=13306 REDIS_PORT=16379
                        export SERVICE_PORT_8081=18081 SERVICE_PORT_8082=18082
                        export SERVICE_PORT_8083=18083 SERVICE_PORT_8084=18084 SERVICE_PORT_8085=18085
                        ci_project="taqueria-ci-${BUILD_NUMBER}"
                        ci_compose() {
                          docker compose -p "$ci_project" -f docker/docker-compose.yml "$@"
                        }
                        wait_for_service() {
                          service_name="$1"
                          service_url="$2"
                          # Docker Desktop puede iniciar Spring Boot más lento tras un build;
                          # espera hasta seis minutos, pero normalmente termina antes.
                          for attempt in $(seq 1 180); do
                            if curl -s --connect-timeout 3 -o /dev/null "$service_url"; then
                              echo "$service_name disponible en el intento $attempt"
                              return 0
                            fi
                            sleep 2
                          done
                          echo "$service_name no estuvo disponible: $service_url" >&2
                          ci_compose logs --tail 120 "$service_name" || true
                          return 1
                        }
                        # Iniciar Java de forma gradual evita competir por RAM/CPU con cinco
                        # JVM al mismo tiempo. Jenkins se conecta a la red interna de Compose,
                        # evitando depender de host.docker.internal desde un contenedor.
                        ci_compose up -d --no-build auth-service
                        ci_network="${ci_project}_taqueria-network"
                        docker network connect "$ci_network" "$(hostname)" 2>/dev/null || true
                        wait_for_service auth-service http://auth-service:8081/
                        ci_compose up -d --no-build catalogo-service
                        wait_for_service catalogo-service http://catalogo-service:8082/
                        ci_compose up -d --no-build club-alan-service
                        wait_for_service club-alan-service http://club-alan-service:8085/
                        ci_compose up -d --no-build pedidos-service
                        wait_for_service pedidos-service http://pedidos-service:8083/
                        ci_compose up -d --no-build pagos-service
                        wait_for_service pagos-service http://pagos-service:8084/
                        python3 -m venv .venv
                        . .venv/bin/activate
                        python -m pip install -r tests/requirements.txt
                        export AUTH_URL=http://auth-service:8081
                        export CATALOGO_URL=http://catalogo-service:8082
                        export PEDIDOS_URL=http://pedidos-service:8083
                        export PAGOS_URL=http://pagos-service:8084
                        export CLUB_URL=http://club-alan-service:8085
                        mkdir -p reports
                        python -m pytest tests/ --junitxml=reports/pytest.xml \
                          --html=reports/report.html --self-contained-html
                '''
            }
            post {
                always {
                    sh '''
                        ci_project="taqueria-ci-${BUILD_NUMBER}"
                        docker compose -p "$ci_project" \
                          -f docker/docker-compose.yml logs --tail 120 || true
                        docker network disconnect "${ci_project}_taqueria-network" "$(hostname)" 2>/dev/null || true
                        docker compose -p "$ci_project" \
                          -f docker/docker-compose.yml down --volumes --remove-orphans || true
                    '''
                    junit allowEmptyResults: true, testResults: 'reports/pytest.xml'
                    publishHTML(target: [
                        reportDir: 'reports',
                        reportFiles: 'report.html',
                        reportName: 'Pytest HTML',
                        keepAll: true,
                        alwaysLinkToLastBuild: true,
                        allowMissing: true
                    ])
                }
            }
        }
        stage('Deploy Staging') {
            when {
                allOf {
                    expression {
                        def branchName = sh(
                            script: "git name-rev --name-only HEAD | sed 's#^remotes/origin/##'",
                            returnStdout: true
                        ).trim()
                        return branchName.equalsIgnoreCase('QA')
                    }
                    not { changeRequest() }
                }
            }
            steps {
                sh '''
                        set -eu
                        export IMAGE_TAG="$(git rev-parse --short HEAD)-${BUILD_NUMBER}"
                        export MYSQL_DATABASE=taqueria_db MYSQL_USER=taqueria
                        docker compose -p taqueria-staging -f docker/docker-compose.yml up -d --no-build
                        docker compose -p taqueria-staging -f docker/docker-compose.yml ps
                '''
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'reports/*', allowEmptyArchive: true
        }
    }
}

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
                        docker compose -p "taqueria-ci-${BUILD_NUMBER}" -f docker/docker-compose.yml up -d --no-build
                        for port in 18081 18082 18083 18084 18085; do
                          ready=0
                          for attempt in $(seq 1 60); do
                            if curl -s -o /dev/null "http://host.docker.internal:$port/"; then
                              ready=1
                              break
                            fi
                            sleep 2
                          done
                          if [ "$ready" -ne 1 ]; then
                            docker compose -p "taqueria-ci-${BUILD_NUMBER}" -f docker/docker-compose.yml logs --tail 80
                            exit 1
                          fi
                        done
                        python3 -m venv .venv
                        . .venv/bin/activate
                        python -m pip install -r tests/requirements.txt
                        export AUTH_URL=http://host.docker.internal:18081
                        export CATALOGO_URL=http://host.docker.internal:18082
                        export PEDIDOS_URL=http://host.docker.internal:18083
                        export PAGOS_URL=http://host.docker.internal:18084
                        export CLUB_URL=http://host.docker.internal:18085
                        mkdir -p reports
                        python -m pytest tests/ --junitxml=reports/pytest.xml \
                          --html=reports/report.html --self-contained-html
                '''
            }
            post {
                always {
                    sh '''
                        docker compose -p "taqueria-ci-${BUILD_NUMBER}" \
                          -f docker/docker-compose.yml logs --tail 120 || true
                        docker compose -p "taqueria-ci-${BUILD_NUMBER}" \
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

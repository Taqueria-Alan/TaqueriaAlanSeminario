FROM docker:28-cli AS dockercli
FROM jenkins/jenkins:lts-jdk21
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    maven python3 python3-venv python3-pip curl ca-certificates chromium chromium-driver \
    && rm -rf /var/lib/apt/lists/*
COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=dockercli /usr/local/libexec/docker/cli-plugins/docker-compose /usr/local/libexec/docker/cli-plugins/docker-compose
COPY --from=dockercli /usr/local/libexec/docker/cli-plugins/docker-buildx /usr/local/libexec/docker/cli-plugins/docker-buildx
RUN chmod +x /usr/local/bin/docker /usr/local/libexec/docker/cli-plugins/docker-*
RUN jenkins-plugin-cli --plugins workflow-aggregator pipeline-model-definition git github github-branch-source htmlpublisher junit pipeline-stage-view
USER jenkins

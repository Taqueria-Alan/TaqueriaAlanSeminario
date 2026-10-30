#!/usr/bin/env python3
"""Deploy six JARs to existing Azure apps; never provision resources or rewrite secrets."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import zipfile

SUBSCRIPTION = '2665af54-7e11-4031-ae76-1ebe75e1a326'
RESOURCE_GROUP = 'rg-taqueria-presentacion'
SERVICES = ('auth', 'catalogo', 'pedidos', 'pagos', 'club-alan', 'gateway')


def validate(credentials, jars):
    for key in ('clientId', 'clientSecret', 'tenantId', 'subscriptionId'):
        if not isinstance(credentials.get(key), str) or not credentials[key].strip():
            raise ValueError('Missing credential field: ' + key)
    if credentials['subscriptionId'] != SUBSCRIPTION:
        raise ValueError('Credential subscription does not match the approved environment')
    for service in SERVICES:
        jar = jars / (service + '-service.jar')
        if not jar.is_file() or not zipfile.is_zipfile(jar):
            raise ValueError('Missing or invalid JAR: ' + service)
    with zipfile.ZipFile(jars / 'gateway-service.jar') as archive:
        if 'BOOT-INF/classes/static/index.html' not in archive.namelist():
            raise ValueError('Gateway JAR must include the Angular frontend')


def az(*args):
    result = subprocess.run(['az', *args, '--only-show-errors', '-o', 'json'],
                            capture_output=True, text=True)
    if result.returncode:
        # Do not forward login errors, command arguments, or app configuration payloads.
        raise RuntimeError('Azure CLI operation failed; review identity permissions and Azure activity logs')
    return json.loads(result.stdout) if result.stdout.strip() else None


def deploy(credentials, jars):
    validate(credentials, jars)  # All artifacts must pass before authentication or the first deployment.
    try:
        az('login', '--service-principal', '--username', credentials['clientId'],
           '--password', credentials['clientSecret'], '--tenant', credentials['tenantId'])
        az('account', 'set', '--subscription', SUBSCRIPTION)
        # Read every destination before deploying any artifact.
        for service in SERVICES:
            name = 'ta-alan-2665-' + service
            app = az('webapp', 'show', '-g', RESOURCE_GROUP, '-n', name,
                     '--query', '{httpsOnly:httpsOnly,state:state}')
            if not app or not app.get('httpsOnly') or app.get('state') != 'Running':
                raise RuntimeError('Destination not ready: ' + name)
        for service in SERVICES:
            name = 'ta-alan-2665-' + service
            print('Deploying ' + name, flush=True)
            az('webapp', 'deploy', '-g', RESOURCE_GROUP, '-n', name, '--type', 'jar',
               '--src-path', str(jars / (service + '-service.jar')), '--timeout', '600000')
            print('Deployed ' + name, flush=True)
    finally:
        subprocess.run(['az', 'logout', '--only-show-errors'], capture_output=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--credentials', type=Path, required=True)
    parser.add_argument('--jars', type=Path, required=True)
    args = parser.parse_args()
    os.umask(0o077)
    credentials = json.loads(args.credentials.read_text())
    try:
        deploy(credentials, args.jars)
    finally:
        args.credentials.unlink(missing_ok=True)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, OSError, json.JSONDecodeError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

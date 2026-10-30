#!/usr/bin/env python3
"""Read-only verification; creates no customers, orders, payments, or memberships."""
import json
from pathlib import Path
import urllib.request
import urllib.error

BASE = 'https://ta-alan-2665-gateway.azurewebsites.net'
CHECKS = [('/', 200, 'html'), ('/login', 200, 'html'),
          ('/api/auth/me', 401, 'json'), ('/api/pedidos', 401, 'json'),
          ('/api/catalogo/productos', 200, 'json'), ('/api/unknown', 404, 'json')]


def main():
    checks = []
    for path, expected, content in CHECKS:
        try:
            request = urllib.request.Request(BASE + path, headers={'Accept': 'application/json' if content == 'json' else 'text/html'})
            try:
                response = urllib.request.urlopen(request, timeout=60)
            except urllib.error.HTTPError as error:
                response = error
            with response:
                status = response.status
                actual_content = response.headers.get('Content-Type', '')
                body = response.read().decode('utf-8', errors='replace')
                valid = status == expected and content in actual_content
                if content == 'html':
                    valid = valid and '<app-root' in body
                elif expected == 200:
                    valid = valid and isinstance(json.loads(body), (list, dict))
                checks.append({'path': path, 'status': status, 'passed': valid})
        except (OSError, ValueError):
            checks.append({'path': path, 'passed': False})
        print(('PASS ' if checks[-1]['passed'] else 'FAIL ') + path, flush=True)
    Path('reports').mkdir(exist_ok=True)
    Path('reports/azure-verify.json').write_text(json.dumps({'url': BASE, 'checks': checks}, indent=2))
    return 0 if all(check['passed'] for check in checks) else 1


if __name__ == '__main__':
    raise SystemExit(main())

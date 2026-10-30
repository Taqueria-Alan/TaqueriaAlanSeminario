#!/usr/bin/env python3
"""Bounded post-deployment readiness checks; creates no business records."""
import json
from pathlib import Path
import time
import urllib.request
import urllib.error

BASE = 'https://ta-alan-2665-gateway.azurewebsites.net'
CHECKS = [('/', 200, 'html'), ('/login', 200, 'html'),
          ('/api/auth/me', 401, 'json'), ('/api/pedidos', 401, 'json'),
          ('/api/catalogo/productos', 200, 'json'), ('/api/unknown', 404, 'json')]


def probe(path, expected, content, timeout):
    request = urllib.request.Request(BASE + path, headers={
        'Accept': 'application/json' if content == 'json' else 'text/html'})
    try:
        try:
            response = urllib.request.urlopen(request, timeout=timeout)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            status = response.status
            body = response.read().decode('utf-8', errors='replace')
            actual_content = response.headers.get('Content-Type', '')
            valid = status == expected and content in actual_content
            if content == 'html':
                valid = valid and '<app-root' in body
            elif expected == 200:
                valid = valid and isinstance(json.loads(body), (list, dict))
            return {'path': path, 'status': status, 'passed': valid}
    except (OSError, ValueError, TimeoutError):
        return {'path': path, 'status': None, 'passed': False}


def main(budget_seconds=180, interval_seconds=5):
    deadline = time.monotonic() + budget_seconds
    checks = {path: {'path': path, 'status': None, 'passed': False, 'attempts': 0}
              for path, _, _ in CHECKS}
    while time.monotonic() < deadline:
        for path, expected, content in CHECKS:
            previous = checks[path]
            if previous['passed'] or time.monotonic() >= deadline:
                continue
            result = probe(path, expected, content,
                           min(20, max(1, deadline - time.monotonic())))
            result['attempts'] = previous['attempts'] + 1
            checks[path] = result
            print(('PASS ' if result['passed'] else 'WAIT ') + path +
                  ' HTTP=' + str(result['status']), flush=True)
        if all(result['passed'] for result in checks.values()):
            break
        remaining = deadline - time.monotonic()
        if remaining > 0:
            time.sleep(min(interval_seconds, remaining))
    Path('reports').mkdir(exist_ok=True)
    Path('reports/azure-verify.json').write_text(json.dumps({
        'url': BASE, 'readinessBudgetSeconds': budget_seconds,
        'checks': list(checks.values())}, indent=2))
    return 0 if all(result['passed'] for result in checks.values()) else 1


if __name__ == '__main__':
    raise SystemExit(main())

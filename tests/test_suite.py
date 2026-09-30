"""Smoke tests for the four Taquería Alan services.

The Jenkins pipeline supplies the URLs through environment variables.  These
tests deliberately accept application responses such as 401, 403 and 404:
at this stage they prove that a live HTTP server answered, while a 5xx response
or a connection failure correctly fails the build.
"""

from __future__ import annotations

import os
import shutil
import urllib.error
import urllib.request
from urllib.parse import urlparse

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service


SERVICES = {
    "auth": os.environ.get("AUTH_URL", "http://host.docker.internal:18081"),
    "catalogo": os.environ.get("CATALOGO_URL", "http://host.docker.internal:18082"),
    "pedidos": os.environ.get("PEDIDOS_URL", "http://host.docker.internal:18083"),
    "pagos": os.environ.get("PAGOS_URL", "http://host.docker.internal:18084"),
}


def http_status(url: str) -> int:
    """Return an HTTP status even when the application deliberately returns 4xx."""
    request = urllib.request.Request(url, method="GET", headers={"User-Agent": "taqueria-smoke-test"})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status
    except urllib.error.HTTPError as error:
        return error.code


def chromium_driver() -> webdriver.Chrome:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,720")
    options.binary_location = os.environ.get(
        "CHROME_BINARY", shutil.which("chromium") or shutil.which("chromium-browser") or ""
    )
    driver_path = os.environ.get("CHROMEDRIVER", shutil.which("chromedriver") or "")
    service = Service(executable_path=driver_path) if driver_path else Service()
    return webdriver.Chrome(service=service, options=options)


@pytest.mark.parametrize("service_name,url", SERVICES.items())
def test_service_url_is_configured(service_name: str, url: str) -> None:
    """Each service target is a complete HTTP URL."""
    parsed = urlparse(url)
    assert parsed.scheme in {"http", "https"}, f"{service_name} has an invalid URL: {url}"
    assert parsed.hostname, f"{service_name} has no host: {url}"


@pytest.mark.parametrize("service_name,url", SERVICES.items())
def test_service_answers_http(service_name: str, url: str) -> None:
    """A reachable service must answer without a server-side failure."""
    status = http_status(url)
    assert status < 500, f"{service_name} returned HTTP {status} at {url}"


@pytest.mark.parametrize("service_name,url", SERVICES.items())
def test_service_loads_in_headless_chromium(service_name: str, url: str) -> None:
    """Exercise the same route through a real headless Chromium browser."""
    driver = chromium_driver()
    try:
        driver.set_page_load_timeout(15)
        driver.get(url)
        assert driver.title is not None
        assert driver.find_element("tag name", "body").text is not None
    finally:
        driver.quit()


@pytest.mark.parametrize("left,right", [("auth", "catalogo"), ("catalogo", "pedidos"), ("pedidos", "pagos")])
def test_service_targets_use_different_ports(left: str, right: str) -> None:
    """Guard against accidentally testing one service four times."""
    assert urlparse(SERVICES[left]).port != urlparse(SERVICES[right]).port

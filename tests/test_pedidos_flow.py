"""API contract tests for the functional order-management prototype.

These tests use only sandbox card numbers.  They deliberately create their
own orders, so the seeded demonstration data stays untouched.  Set the four
URL variables when the services do not run on the CI defaults:

    PEDIDOS_URL, PAGOS_URL, CATALOGO_URL, CLUB_URL
"""

from __future__ import annotations

import os
import uuid
from decimal import Decimal
from typing import Any

import pytest
import requests


PEDIDOS_URL = os.environ.get("PEDIDOS_URL", "http://host.docker.internal:18083").rstrip("/")
PAGOS_URL = os.environ.get("PAGOS_URL", "http://host.docker.internal:18084").rstrip("/")
CATALOGO_URL = os.environ.get("CATALOGO_URL", "http://host.docker.internal:18082").rstrip("/")
CLUB_URL = os.environ.get("CLUB_URL", "http://host.docker.internal:18085").rstrip("/")
CLIENTE_ID = int(os.environ.get("TEST_CLIENTE_ID", "5"))
TIMEOUT_SECONDS = float(os.environ.get("API_TEST_TIMEOUT", "15"))

# Números exclusivamente de prueba de la simulación local, no tarjetas reales.
TARJETA_VALIDA_PRUEBA = "4242424242424242"
TARJETA_SIN_FONDOS_PRUEBA = "4000000000000002"


def pretty_response(response: requests.Response) -> str:
    """Keep API assertion messages actionable without recording payment input."""
    try:
        payload = response.json()
    except ValueError:
        payload = response.text
    return f"HTTP {response.status_code}: {payload}"


def assert_status(response: requests.Response, expected: int) -> None:
    assert response.status_code == expected, pretty_response(response)


def correlation_headers() -> dict[str, str]:
    return {"X-Correlation-Id": f"pytest-pedidos-{uuid.uuid4()}"}


@pytest.fixture(scope="session")
def http() -> requests.Session:
    session = requests.Session()
    session.headers.update({"Accept": "application/json", "User-Agent": "taqueria-pedidos-contract-tests"})
    return session


@pytest.fixture(scope="session")
def producto_disponible(http: requests.Session) -> dict[str, Any]:
    """Find a real menu item, never a hard-coded product or membership SKU."""
    response = http.get(
        f"{CATALOGO_URL}/api/catalogo/productos",
        params={"disponible": "true"},
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(response, 200)
    productos = response.json()
    producto = next(
        (
            item
            for item in productos
            if item.get("disponible") is True
            and "membres" not in (item.get("nombre") or "").lower()
        ),
        None,
    )
    assert producto is not None, "No hay un producto de menú disponible para probar pedidos"
    assert producto.get("idProducto") is not None
    assert producto.get("precio") is not None
    return producto


@pytest.fixture(scope="session")
def producto_membresia(http: requests.Session) -> dict[str, Any]:
    """Locate the subscription SKU by its name instead of assuming a database row position."""
    response = http.get(
        f"{CATALOGO_URL}/api/catalogo/productos",
        params={"disponible": "true"},
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(response, 200)
    producto = next(
        (item for item in response.json() if "membres" in (item.get("nombre") or "").lower()),
        None,
    )
    assert producto is not None, "No existe el producto de Membresía Club Alan en el catálogo"
    return producto


def crear_pedido(
    http: requests.Session,
    producto: dict[str, Any],
    *,
    tipo: str = "LLEVAR",
    cantidad: int = 1,
    direccion: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create a new pending order using the public orders API."""
    body: dict[str, Any] = {
        "idCliente": CLIENTE_ID,
        "tipo": tipo,
        "lineas": [
            {
                "idProducto": producto["idProducto"],
                "cantidad": cantidad,
                "observaciones": "Prueba automatizada de gestión de pedidos",
            }
        ],
    }
    if direccion:
        body["direccion"] = direccion
    if extra:
        body.update(extra)
    response = http.post(
        f"{PEDIDOS_URL}/api/pedidos",
        json=body,
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(response, 201)
    return response.json()


def pagar(
    http: requests.Session,
    id_pedido: int,
    numero_tarjeta_prueba: str,
    *,
    idempotency_key: str | None = None,
) -> requests.Response:
    key = idempotency_key or f"pytest-pago-{uuid.uuid4()}"
    return http.post(
        f"{PAGOS_URL}/api/pagos",
        json={
            "idPedido": id_pedido,
            "metodoPago": "TARJETA",
            "numeroTarjetaPrueba": numero_tarjeta_prueba,
        },
        headers={**correlation_headers(), "Idempotency-Key": key},
        timeout=TIMEOUT_SECONDS,
    )


def test_backend_recalculates_total_ignoring_client_supplied_amounts(
    http: requests.Session, producto_disponible: dict[str, Any]
) -> None:
    """The server price wins even if an old/malicious client sends its own totals."""
    response = http.post(
        f"{PEDIDOS_URL}/api/pedidos",
        json={
            "idCliente": CLIENTE_ID,
            "tipo": "LLEVAR",
            "total": 0.01,
            "lineas": [
                {
                    "idProducto": producto_disponible["idProducto"],
                    "cantidad": 2,
                    "precio": 0.01,
                    "subtotal": 0.01,
                    "nombre": "Precio alterado por el cliente",
                }
            ],
        },
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(response, 201)
    pedido = response.json()
    precio_oficial = Decimal(str(producto_disponible["precio"]))
    assert Decimal(str(pedido["lineas"][0]["precio"])) == precio_oficial
    assert Decimal(str(pedido["total"])) == precio_oficial * 2
    assert pedido["estado"] == "RECIBIDO"


def test_empty_order_is_rejected(http: requests.Session) -> None:
    response = http.post(
        f"{PEDIDOS_URL}/api/pedidos",
        json={"idCliente": CLIENTE_ID, "tipo": "LLEVAR", "lineas": []},
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(response, 400)
    assert response.json()["code"] == "VALIDACION"


def test_customer_can_modify_a_received_unpaid_order(
    http: requests.Session, producto_disponible: dict[str, Any]
) -> None:
    pedido = crear_pedido(http, producto_disponible)
    response = http.put(
        f"{PEDIDOS_URL}/api/pedidos/{pedido['id']}",
        json={
            "tipo": "DOMICILIO",
            "direccion": "Zona 1, Ciudad de Guatemala",
            "lineas": [
                {
                    "idProducto": producto_disponible["idProducto"],
                    "cantidad": 3,
                    "observaciones": "Cliente cambió la cantidad antes de pagar",
                }
            ],
        },
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(response, 200)
    actualizado = response.json()
    assert actualizado["estado"] == "RECIBIDO"
    assert actualizado["tipo"] == "DOMICILIO"
    assert actualizado["direccion"] == "Zona 1, Ciudad de Guatemala"
    assert actualizado["lineas"][0]["cantidad"] == 3
    assert Decimal(str(actualizado["total"])) == Decimal(str(producto_disponible["precio"])) * 3


def test_customer_can_cancel_before_payment(http: requests.Session, producto_disponible: dict[str, Any]) -> None:
    pedido = crear_pedido(http, producto_disponible)
    cancelacion = http.post(
        f"{PEDIDOS_URL}/api/pedidos/{pedido['id']}/cancelar",
        json={"motivo": "El cliente decidió no continuar antes del pago"},
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(cancelacion, 200)
    assert cancelacion.json()["estado"] == "CANCELADO"

    intento_edicion = http.put(
        f"{PEDIDOS_URL}/api/pedidos/{pedido['id']}",
        json={
            "tipo": "LLEVAR",
            "lineas": [{"idProducto": producto_disponible["idProducto"], "cantidad": 2}],
        },
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(intento_edicion, 422)
    assert intento_edicion.json()["code"] == "PEDIDO_NO_EDITABLE"


def test_invalid_test_card_is_rejected(http: requests.Session, producto_disponible: dict[str, Any]) -> None:
    pedido = crear_pedido(http, producto_disponible)
    response = pagar(http, pedido["id"], "1234")
    assert_status(response, 422)
    assert response.json()["code"] == "TARJETA_INVALIDA"


def test_insufficient_funds_test_card_is_rejected(
    http: requests.Session, producto_disponible: dict[str, Any]
) -> None:
    pedido = crear_pedido(http, producto_disponible)
    response = pagar(http, pedido["id"], TARJETA_SIN_FONDOS_PRUEBA)
    assert_status(response, 422)
    assert response.json()["code"] == "FONDOS_INSUFICIENTES"


def test_successful_payment_is_idempotent_and_llevar_order_can_be_delivered(
    http: requests.Session, producto_disponible: dict[str, Any]
) -> None:
    pedido = crear_pedido(http, producto_disponible, tipo="LLEVAR")
    idempotency_key = f"pytest-pago-{uuid.uuid4()}"

    primero = pagar(http, pedido["id"], TARJETA_VALIDA_PRUEBA, idempotency_key=idempotency_key)
    assert_status(primero, 201)
    pago_aprobado = primero.json()
    assert pago_aprobado["estadoPago"] == "APROBADO"
    assert pago_aprobado["pedidoEstado"] == "EN_PREPARACION"
    assert pago_aprobado["idempotente"] is False

    repetido = pagar(http, pedido["id"], TARJETA_VALIDA_PRUEBA, idempotency_key=idempotency_key)
    assert_status(repetido, 201)
    pago_repetido = repetido.json()
    assert pago_repetido["idPago"] == pago_aprobado["idPago"]
    assert pago_repetido["idempotente"] is True

    avance = http.post(
        f"{PEDIDOS_URL}/api/pedidos/{pedido['id']}/avanzar",
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(avance, 200)
    assert avance.json()["estado"] == "ENTREGADO"

    avance_terminal = http.post(
        f"{PEDIDOS_URL}/api/pedidos/{pedido['id']}/avanzar",
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(avance_terminal, 422)
    assert avance_terminal.json()["code"] == "TRANSICION_INVALIDA"


def test_idempotency_key_is_scoped_to_its_own_order(
    http: requests.Session, producto_disponible: dict[str, Any]
) -> None:
    """The same header cannot accidentally reuse a payment from another order."""
    key = f"pytest-pago-{uuid.uuid4()}"
    primero = crear_pedido(http, producto_disponible)
    pago_primero = pagar(http, primero["id"], TARJETA_VALIDA_PRUEBA, idempotency_key=key)
    assert_status(pago_primero, 201)

    segundo = crear_pedido(http, producto_disponible)
    pago_segundo = pagar(http, segundo["id"], TARJETA_VALIDA_PRUEBA, idempotency_key=key)
    assert_status(pago_segundo, 201)
    assert pago_segundo.json()["idPedido"] == segundo["id"]
    assert pago_segundo.json()["idPago"] != pago_primero.json()["idPago"]
    assert pago_segundo.json()["idempotente"] is False


def test_domicilio_order_follows_the_en_ruta_step(
    http: requests.Session, producto_disponible: dict[str, Any]
) -> None:
    pedido = crear_pedido(
        http,
        producto_disponible,
        tipo="DOMICILIO",
        direccion="Zona 10, Ciudad de Guatemala",
    )
    pago = pagar(http, pedido["id"], TARJETA_VALIDA_PRUEBA)
    assert_status(pago, 201)
    assert pago.json()["pedidoEstado"] == "EN_PREPARACION"

    en_ruta = http.post(
        f"{PEDIDOS_URL}/api/pedidos/{pedido['id']}/avanzar",
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(en_ruta, 200)
    assert en_ruta.json()["estado"] == "EN_RUTA"

    entregado = http.post(
        f"{PEDIDOS_URL}/api/pedidos/{pedido['id']}/avanzar",
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(entregado, 200)
    assert entregado.json()["estado"] == "ENTREGADO"


def test_paid_order_cannot_be_modified_or_cancelled(
    http: requests.Session, producto_disponible: dict[str, Any]
) -> None:
    pedido = crear_pedido(http, producto_disponible)
    pago = pagar(http, pedido["id"], TARJETA_VALIDA_PRUEBA)
    assert_status(pago, 201)

    cancelacion = http.post(
        f"{PEDIDOS_URL}/api/pedidos/{pedido['id']}/cancelar",
        json={"motivo": "No debe cancelar después de un pago aprobado"},
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(cancelacion, 422)
    # La API distingue el bloqueo por pago aprobado del bloqueo por estado.
    assert cancelacion.json()["code"] == "PEDIDO_PAGADO"


def test_subscription_cannot_use_an_ordinary_menu_product(
    http: requests.Session, producto_disponible: dict[str, Any]
) -> None:
    response = http.post(
        f"{PEDIDOS_URL}/api/pedidos",
        json={
            "idCliente": CLIENTE_ID,
            "tipo": "LLEVAR",
            "clase": "SUSCRIPCION",
            "lineas": [{"idProducto": producto_disponible["idProducto"], "cantidad": 1}],
        },
        headers=correlation_headers(),
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(response, 400)
    assert response.json()["code"] == "SUSCRIPCION_INVALIDA"


def test_subscription_activates_club_and_a_following_order_accrues_points(
    http: requests.Session,
    producto_membresia: dict[str, Any],
    producto_disponible: dict[str, Any],
) -> None:
    """The payment event activates Club Alan and credits a following eligible order once."""
    suscripcion = crear_pedido(
        http,
        producto_membresia,
        extra={"clase": "SUSCRIPCION"},
    )
    pago_suscripcion = pagar(http, suscripcion["id"], TARJETA_VALIDA_PRUEBA)
    assert_status(pago_suscripcion, 201)
    assert pago_suscripcion.json()["pedidoEstado"] == "ENTREGADO"

    saldo = http.get(
        f"{CLUB_URL}/api/club-alan/clientes/{CLIENTE_ID}/puntos",
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(saldo, 200)
    assert saldo.json()["miembroClub"] is True

    pedido = crear_pedido(http, producto_disponible, cantidad=1)
    pago = pagar(http, pedido["id"], TARJETA_VALIDA_PRUEBA)
    assert_status(pago, 201)

    movimientos = http.get(
        f"{CLUB_URL}/api/club-alan/clientes/{CLIENTE_ID}/movimientos",
        params={"page": 0, "size": 50},
        timeout=TIMEOUT_SECONDS,
    )
    assert_status(movimientos, 200)
    assert any(
        movimiento.get("idPedido") == pedido["id"] and movimiento.get("tipo") == "ACUMULACION"
        for movimiento in movimientos.json().get("content", [])
    )

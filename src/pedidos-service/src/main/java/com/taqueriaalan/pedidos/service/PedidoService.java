package com.taqueriaalan.pedidos.service;

import com.taqueriaalan.pedidos.dto.ActualizarPedidoRequest;
import com.taqueriaalan.pedidos.dto.CancelarPedidoRequest;
import com.taqueriaalan.pedidos.dto.PedidoRequest;
import com.taqueriaalan.pedidos.dto.PedidoResponse;
import java.util.List;

public interface PedidoService {

    PedidoResponse crear(PedidoRequest request, String correlationId);

    PedidoResponse obtener(Long idPedido, Long idClienteAutenticado, String rol);

    List<PedidoResponse> listar(Long idCliente);

    PedidoResponse actualizar(Long idPedido, ActualizarPedidoRequest request, String correlationId,
            Long idClienteAutenticado, String rol);

    PedidoResponse cancelar(Long idPedido, CancelarPedidoRequest request, String correlationId,
            Long idClienteAutenticado, String rol);

    /** Solo ADMIN: es la cocina/el repartidor avanzando el pedido, nunca el cliente. */
    PedidoResponse avanzar(Long idPedido, String correlationId);
}

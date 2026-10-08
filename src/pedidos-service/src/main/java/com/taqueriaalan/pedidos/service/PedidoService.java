package com.taqueriaalan.pedidos.service;

import com.taqueriaalan.pedidos.dto.ActualizarPedidoRequest;
import com.taqueriaalan.pedidos.dto.CancelarPedidoRequest;
import com.taqueriaalan.pedidos.dto.PedidoRequest;
import com.taqueriaalan.pedidos.dto.PedidoResponse;
import java.util.List;

public interface PedidoService {

    PedidoResponse crear(PedidoRequest request, String correlationId);

    PedidoResponse obtener(Long idPedido);

    List<PedidoResponse> listar(Long idCliente);

    PedidoResponse actualizar(Long idPedido, ActualizarPedidoRequest request, String correlationId);

    PedidoResponse cancelar(Long idPedido, CancelarPedidoRequest request, String correlationId);

    PedidoResponse avanzar(Long idPedido, String correlationId);
}

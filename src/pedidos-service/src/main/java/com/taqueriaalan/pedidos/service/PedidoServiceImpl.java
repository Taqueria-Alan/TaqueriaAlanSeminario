package com.taqueriaalan.pedidos.service;

import com.taqueriaalan.pedidos.dto.ActualizarPedidoRequest;
import com.taqueriaalan.pedidos.dto.CancelarPedidoRequest;
import com.taqueriaalan.pedidos.dto.LineaPedidoRequest;
import com.taqueriaalan.pedidos.dto.LineaPedidoResponse;
import com.taqueriaalan.pedidos.dto.PedidoRequest;
import com.taqueriaalan.pedidos.dto.PedidoResponse;
import com.taqueriaalan.pedidos.exception.BusinessException;
import com.taqueriaalan.pedidos.exception.ResourceNotFoundException;
import com.taqueriaalan.pedidos.model.ClasePedido;
import com.taqueriaalan.pedidos.model.DetallePedido;
import com.taqueriaalan.pedidos.model.EstadoPedido;
import com.taqueriaalan.pedidos.model.ModalidadPedido;
import com.taqueriaalan.pedidos.model.Pedido;
import com.taqueriaalan.pedidos.model.Producto;
import com.taqueriaalan.pedidos.repository.ClienteRepository;
import com.taqueriaalan.pedidos.repository.PedidoRepository;
import com.taqueriaalan.pedidos.repository.ProductoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
@Slf4j
public class PedidoServiceImpl implements PedidoService {

    private static final long TIPO_NORMAL = 1L;
    private static final long TIPO_SUSCRIPCION = 2L;

    @Value("${app.pedidos.producto-membresia-id:1}")
    private long productoMembresiaId;

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;

    @Override
    @Transactional
    public PedidoResponse crear(PedidoRequest request, String correlationId) {
        validarCliente(request.idCliente());
        validarDireccion(request.tipo(), request.direccion());
        ClasePedido clase = request.clase() == null ? ClasePedido.NORMAL : request.clase();
        validarClasePedido(clase, request.lineas());

        Pedido pedido = new Pedido();
        pedido.setIdCliente(request.idCliente());
        pedido.setFechaHora(LocalDateTime.now());
        pedido.setActualizadoEn(LocalDateTime.now());
        pedido.setEstado(EstadoPedido.RECIBIDO);
        pedido.setModalidad(request.tipo());
        pedido.setDireccionEntrega(normalizarDireccion(request.tipo(), request.direccion()));
        pedido.setObservaciones(textoOpcional(request.observaciones()));
        pedido.setIdTipoPedido(clase == ClasePedido.SUSCRIPCION ? TIPO_SUSCRIPCION : TIPO_NORMAL);
        pedido.reemplazarDetalles(construirDetalles(request.lineas()));
        pedido.setTotal(calcularTotal(pedido.getDetalles()));
        Pedido persistido = pedidoRepository.save(pedido);
        log.info("event=pedido.creado correlationId={} pedidoId={} clienteId={} estado={} modalidad={} total={}",
                correlationId, persistido.getIdPedido(), persistido.getIdCliente(), persistido.getEstado(),
                persistido.getModalidad(), persistido.getTotal());
        return toResponse(persistido);
    }

    @Override
    @Transactional(readOnly = true)
    public PedidoResponse obtener(Long idPedido, Long idClienteAutenticado, String rol) {
        Pedido pedido = obtenerPedido(idPedido);
        verificarPertenencia(pedido, idClienteAutenticado, rol);
        return toResponse(pedido);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PedidoResponse> listar(Long idCliente) {
        List<Pedido> pedidos = idCliente == null
                ? pedidoRepository.findAllByOrderByFechaHoraDesc()
                : pedidoRepository.findByIdClienteOrderByFechaHoraDesc(idCliente);
        return pedidos.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public PedidoResponse actualizar(Long idPedido, ActualizarPedidoRequest request, String correlationId,
            Long idClienteAutenticado, String rol) {
        Pedido pedido = obtenerPedido(idPedido);
        verificarPertenencia(pedido, idClienteAutenticado, rol);
        validarEditable(pedido);
        validarDireccion(request.tipo(), request.direccion());
        // La clase no se puede cambiar desde esta operación. Si el pedido ya
        // representa una suscripción, sus líneas deben seguir siendo el SKU
        // oficial de Club Alan antes de aceptar la edición.
        ClasePedido claseActual = Long.valueOf(TIPO_SUSCRIPCION).equals(pedido.getIdTipoPedido())
                ? ClasePedido.SUSCRIPCION : ClasePedido.NORMAL;
        validarClasePedido(claseActual, request.lineas());
        pedido.setModalidad(request.tipo());
        pedido.setDireccionEntrega(normalizarDireccion(request.tipo(), request.direccion()));
        pedido.setObservaciones(textoOpcional(request.observaciones()));
        pedido.reemplazarDetalles(construirDetalles(request.lineas()));
        pedido.setTotal(calcularTotal(pedido.getDetalles()));
        pedido.setActualizadoEn(LocalDateTime.now());
        Pedido persistido = pedidoRepository.save(pedido);
        log.info("event=pedido.actualizado correlationId={} pedidoId={} clienteId={} total={}",
                correlationId, persistido.getIdPedido(), persistido.getIdCliente(), persistido.getTotal());
        return toResponse(persistido);
    }

    @Override
    @Transactional
    public PedidoResponse cancelar(Long idPedido, CancelarPedidoRequest request, String correlationId,
            Long idClienteAutenticado, String rol) {
        Pedido pedido = obtenerPedido(idPedido);
        verificarPertenencia(pedido, idClienteAutenticado, rol);
        validarEditable(pedido);
        pedido.setEstado(EstadoPedido.CANCELADO);
        pedido.setCanceladoEn(LocalDateTime.now());
        pedido.setMotivoCancelacion(request == null ? null : textoOpcional(request.motivo()));
        pedido.setActualizadoEn(LocalDateTime.now());
        Pedido persistido = pedidoRepository.save(pedido);
        log.info("event=pedido.cancelado correlationId={} pedidoId={} clienteId={} motivoPresente={}",
                correlationId, persistido.getIdPedido(), persistido.getIdCliente(),
                persistido.getMotivoCancelacion() != null);
        return toResponse(persistido);
    }

    @Override
    @Transactional
    public PedidoResponse avanzar(Long idPedido, String correlationId) {
        Pedido pedido = obtenerPedido(idPedido);
        if (pedidoRepository.contarPagosAprobados(idPedido) == 0) {
            throw new BusinessException("PAGO_PENDIENTE", "No se puede avanzar un pedido sin pago aprobado",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        EstadoPedido anterior = pedido.getEstado();
        EstadoPedido siguiente = siguienteEstado(pedido);
        if (siguiente == null) {
            throw new BusinessException("TRANSICION_INVALIDA",
                    "El pedido no admite otro cambio de estado", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        pedido.setEstado(siguiente);
        pedido.setActualizadoEn(LocalDateTime.now());
        Pedido persistido = pedidoRepository.save(pedido);
        log.info("event=pedido.avanzado correlationId={} pedidoId={} estadoAntes={} estadoDespues={}",
                correlationId, persistido.getIdPedido(), anterior, siguiente);
        return toResponse(persistido);
    }

    private List<DetallePedido> construirDetalles(List<LineaPedidoRequest> lineas) {
        return lineas.stream().map(linea -> {
            Producto producto = productoRepository.findById(linea.idProducto())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No existe el producto " + linea.idProducto()));
            if (!Boolean.TRUE.equals(producto.getDisponible())) {
                throw new BusinessException("PRODUCTO_NO_DISPONIBLE",
                        "El producto " + producto.getNombre() + " no está disponible", HttpStatus.UNPROCESSABLE_ENTITY);
            }
            DetallePedido detalle = new DetallePedido();
            detalle.setIdProducto(producto.getIdProducto());
            detalle.setNombreProducto(producto.getNombre());
            detalle.setCantidad(linea.cantidad());
            detalle.setPrecioUnitario(producto.getPrecio());
            detalle.setSubtotalLinea(producto.getPrecio().multiply(BigDecimal.valueOf(linea.cantidad()))
                    .setScale(2, RoundingMode.HALF_UP));
            detalle.setObservaciones(textoOpcional(linea.observaciones()));
            return detalle;
        }).toList();
    }

    private BigDecimal calcularTotal(List<DetallePedido> detalles) {
        return detalles.stream().map(DetallePedido::getSubtotalLinea)
                .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    }

    /** Una suscripción no puede transformar un producto ordinario en membresía. */
    private void validarClasePedido(ClasePedido clase, List<LineaPedidoRequest> lineas) {
        if (clase != ClasePedido.SUSCRIPCION) {
            return;
        }
        boolean esMembresiaValida = lineas.size() == 1
                && Long.valueOf(productoMembresiaId).equals(lineas.get(0).idProducto())
                && lineas.get(0).cantidad() == 1;
        if (!esMembresiaValida) {
            throw new BusinessException("SUSCRIPCION_INVALIDA",
                    "Una suscripción debe contener exactamente una Membresía Club Alan", HttpStatus.BAD_REQUEST);
        }
    }

    private void validarCliente(Long idCliente) {
        if (!clienteRepository.existsById(idCliente)) {
            throw new ResourceNotFoundException("No existe el cliente " + idCliente);
        }
    }

    private void validarDireccion(ModalidadPedido tipo, String direccion) {
        if (tipo == ModalidadPedido.DOMICILIO && !StringUtils.hasText(direccion)) {
            throw new BusinessException("DIRECCION_REQUERIDA",
                    "Los pedidos a domicilio requieren dirección de entrega", HttpStatus.BAD_REQUEST);
        }
    }

    private String normalizarDireccion(ModalidadPedido tipo, String direccion) {
        return tipo == ModalidadPedido.DOMICILIO ? textoOpcional(direccion) : null;
    }

    private void validarEditable(Pedido pedido) {
        if (pedidoRepository.contarPagosAprobados(pedido.getIdPedido()) > 0) {
            throw new BusinessException("PEDIDO_PAGADO",
                    "El pedido ya fue pagado y no puede modificarse ni cancelarse", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        if (pedido.getEstado() != EstadoPedido.RECIBIDO) {
            throw new BusinessException("PEDIDO_NO_EDITABLE",
                    "Solo un pedido recibido y pendiente de pago puede modificarse o cancelarse",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    private EstadoPedido siguienteEstado(Pedido pedido) {
        if (pedido.getEstado() == EstadoPedido.EN_PREPARACION) {
            return pedido.getModalidad() == ModalidadPedido.DOMICILIO ? EstadoPedido.EN_RUTA : EstadoPedido.ENTREGADO;
        }
        if (pedido.getEstado() == EstadoPedido.EN_RUTA) {
            return EstadoPedido.ENTREGADO;
        }
        return null;
    }

    /**
     * Un CLIENTE solo puede ver/editar/cancelar sus propios pedidos; ADMIN no tiene
     * restriccion. rol==null significa que el filtro de seguridad esta desactivado
     * (perfil local sin SECURITY_ENABLED): no hay sesion que verificar.
     */
    private void verificarPertenencia(Pedido pedido, Long idClienteAutenticado, String rol) {
        if (rol == null || "ADMIN".equals(rol)) {
            return;
        }
        if (idClienteAutenticado == null || !idClienteAutenticado.equals(pedido.getIdCliente())) {
            throw new BusinessException("ACCESO_DENEGADO", "Este pedido no te pertenece", HttpStatus.FORBIDDEN);
        }
    }

    private Pedido obtenerPedido(Long idPedido) {
        return pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el pedido " + idPedido));
    }

    private PedidoResponse toResponse(Pedido pedido) {
        String cliente = clienteRepository.findNombreByIdCliente(pedido.getIdCliente())
                .orElse("Cliente #" + pedido.getIdCliente());
        ClasePedido clase = Long.valueOf(TIPO_SUSCRIPCION).equals(pedido.getIdTipoPedido())
                ? ClasePedido.SUSCRIPCION : ClasePedido.NORMAL;
        List<LineaPedidoResponse> lineas = pedido.getDetalles().stream().map(detalle -> new LineaPedidoResponse(
                detalle.getIdProducto(), detalle.getNombreProducto(), "", detalle.getPrecioUnitario(),
                detalle.getCantidad(), detalle.getObservaciones())).toList();
        return new PedidoResponse(pedido.getIdPedido(), "TAQ-" + String.format("%05d", pedido.getIdPedido()),
                pedido.getIdCliente(), cliente, pedido.getModalidad(), clase, pedido.getDireccionEntrega(),
                pedido.getEstado(), lineas, pedido.getTotal(), pedido.getObservaciones(), pedido.getFechaHora(), pedido.getActualizadoEn(),
                pedidoRepository.findUltimoEstadoPago(pedido.getIdPedido()));
    }

    private String textoOpcional(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

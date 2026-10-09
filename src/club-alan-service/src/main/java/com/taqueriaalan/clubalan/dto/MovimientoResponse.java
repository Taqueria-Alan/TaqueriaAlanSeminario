package com.taqueriaalan.clubalan.dto;

import com.taqueriaalan.clubalan.model.TipoMovimiento;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoResponse {

    private Long idMovimiento;
    private Long idCliente;
    private Long idPedido;
    private TipoMovimiento tipo;
    private Integer puntos;
    private LocalDateTime fecha;
    private String descripcion;
    private Integer saldoActual;
}

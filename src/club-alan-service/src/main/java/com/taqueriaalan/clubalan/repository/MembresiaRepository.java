package com.taqueriaalan.clubalan.repository;

import com.taqueriaalan.clubalan.model.Membresia;
import com.taqueriaalan.clubalan.model.MembresiaListadoProjection;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MembresiaRepository extends JpaRepository<Membresia, Long> {

    Optional<Membresia> findByIdClienteAndFechaFinIsNull(Long idCliente);

    Optional<Membresia> findFirstByIdClienteOrderByFechaInicioDesc(Long idCliente);

    /**
     * La membresia mas reciente de cada cliente que tiene al menos una. Si
     * soloActivas es true, solo las vigentes (fecha_fin NULL); si es false, solo
     * las ya terminadas; si es null, todas sin filtrar por estado.
     */
    @Query(
            value = "SELECT m.id_cliente AS idCliente, u.nombre AS nombre, u.telefono AS telefono, "
                    + "m.fecha_inicio AS fechaInicio, m.fecha_fin AS fechaFin, m.envio_gratis AS envioGratis "
                    + "FROM MEMBRESIA m "
                    + "JOIN CLIENTE c ON c.id_cliente = m.id_cliente "
                    + "JOIN USUARIO u ON u.id_usuario = c.id_usuario "
                    + "WHERE m.id_membresia = ("
                    + "  SELECT m2.id_membresia FROM MEMBRESIA m2 "
                    + "  WHERE m2.id_cliente = m.id_cliente "
                    + "  ORDER BY m2.fecha_inicio DESC, m2.id_membresia DESC LIMIT 1"
                    + ") "
                    + "AND (:soloActivas IS NULL "
                    + "     OR (:soloActivas = TRUE AND m.fecha_fin IS NULL) "
                    + "     OR (:soloActivas = FALSE AND m.fecha_fin IS NOT NULL)) "
                    + "ORDER BY u.nombre",
            countQuery = "SELECT COUNT(*) FROM MEMBRESIA m "
                    + "JOIN CLIENTE c ON c.id_cliente = m.id_cliente "
                    + "JOIN USUARIO u ON u.id_usuario = c.id_usuario "
                    + "WHERE m.id_membresia = ("
                    + "  SELECT m2.id_membresia FROM MEMBRESIA m2 "
                    + "  WHERE m2.id_cliente = m.id_cliente "
                    + "  ORDER BY m2.fecha_inicio DESC, m2.id_membresia DESC LIMIT 1"
                    + ") "
                    + "AND (:soloActivas IS NULL "
                    + "     OR (:soloActivas = TRUE AND m.fecha_fin IS NULL) "
                    + "     OR (:soloActivas = FALSE AND m.fecha_fin IS NOT NULL))",
            nativeQuery = true)
    Page<MembresiaListadoProjection> listarUltimaPorCliente(
            @Param("soloActivas") Boolean soloActivas, Pageable pageable);
}

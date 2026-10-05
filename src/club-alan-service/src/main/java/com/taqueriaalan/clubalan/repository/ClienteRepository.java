package com.taqueriaalan.clubalan.repository;

import com.taqueriaalan.clubalan.model.Cliente;
import com.taqueriaalan.clubalan.model.ClienteBusquedaProjection;
import com.taqueriaalan.clubalan.model.ClienteListadoProjection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    @Query(
            value = "SELECT c.id_cliente AS idCliente, u.nombre AS nombre, u.telefono AS telefono, "
                    + "c.puntos_club_alan AS puntos, c.miembro_club AS miembroClub "
                    + "FROM CLIENTE c JOIN USUARIO u ON c.id_usuario = u.id_usuario "
                    + "WHERE u.nombre LIKE CONCAT('%', :query, '%') "
                    + "OR u.telefono LIKE CONCAT('%', :query, '%') "
                    + "ORDER BY u.nombre "
                    + "LIMIT 20",
            nativeQuery = true)
    List<ClienteBusquedaProjection> buscarPorNombreOTelefono(@Param("query") String query);

    @Query(
            value = "SELECT c.id_cliente AS idCliente, u.nombre AS nombre, u.telefono AS telefono, "
                    + "u.email AS email, c.puntos_club_alan AS puntosClubAlan, c.miembro_club AS miembroClub "
                    + "FROM CLIENTE c JOIN USUARIO u ON c.id_usuario = u.id_usuario "
                    + "WHERE (:query IS NULL OR u.nombre LIKE CONCAT('%', :query, '%') "
                    + "       OR u.telefono LIKE CONCAT('%', :query, '%')) "
                    + "ORDER BY u.nombre",
            countQuery = "SELECT COUNT(*) FROM CLIENTE c JOIN USUARIO u ON c.id_usuario = u.id_usuario "
                    + "WHERE (:query IS NULL OR u.nombre LIKE CONCAT('%', :query, '%') "
                    + "       OR u.telefono LIKE CONCAT('%', :query, '%'))",
            nativeQuery = true)
    Page<ClienteListadoProjection> listar(@Param("query") String query, Pageable pageable);
}

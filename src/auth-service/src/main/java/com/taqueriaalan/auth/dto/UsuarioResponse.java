package com.taqueriaalan.auth.dto;

/** id = idCliente cuando el rol es CLIENTE (es el id que el resto del sistema espera); idUsuario si es ADMIN. */
public record UsuarioResponse(Long id, String nombre, String email, String telefono, String rol) {
}

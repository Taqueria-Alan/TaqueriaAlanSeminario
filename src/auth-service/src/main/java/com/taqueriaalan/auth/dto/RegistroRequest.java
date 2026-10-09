package com.taqueriaalan.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** No trae "rol": el registro publico siempre crea un CLIENTE, nunca lo decide quien llama. */
public record RegistroRequest(
        @NotBlank String nombre,
        @NotBlank @Email String email,
        String telefono,
        @NotBlank @Size(min = 8) String password) {
}

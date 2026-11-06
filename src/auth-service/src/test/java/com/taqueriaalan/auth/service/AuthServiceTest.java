package com.taqueriaalan.auth.service;

import com.taqueriaalan.auth.dto.*;
import com.taqueriaalan.auth.exception.BusinessException;
import com.taqueriaalan.auth.model.*;
import com.taqueriaalan.auth.repository.*;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UsuarioRepository usuarios;
    @Mock ClienteRepository clientes;
    @Mock PasswordEncoder encoder;
    @Mock JwtService jwt;
    AuthService auth;
    Usuario usuario;
    static final String EMAIL = "cliente@example.invalid";

    @BeforeEach void setup() {
        auth = new AuthService(usuarios, clientes, encoder, jwt);
        usuario = new Usuario("Cliente", EMAIL, "55550000", "hash-de-prueba", "CLIENTE");
        usuario.setId(7L);
    }

    @Test void registroCifraClaveYEmiteSesionCliente() {
        var cliente = mock(Cliente.class);
        when(cliente.getIdCliente()).thenReturn(31L);
        when(encoder.encode("qa-demo-123")).thenReturn("hash-de-prueba");
        when(usuarios.save(any())).thenAnswer(i -> {
            Usuario nuevo = i.getArgument(0);
            assertThat(nuevo.getPassword()).isEqualTo("hash-de-prueba");
            assertThat(nuevo.getRol()).isEqualTo("CLIENTE");
            nuevo.setId(7L);
            return nuevo;
        });
        when(clientes.save(any())).thenReturn(cliente);
        when(jwt.generar(7L, "CLIENTE", 31L)).thenReturn("token-ficticio");
        var sesion = auth.registrar(new RegistroRequest("Cliente", EMAIL, "55550000", "qa-demo-123"));
        assertThat(sesion.token()).isEqualTo("token-ficticio");
        assertThat(sesion.usuario().id()).isEqualTo(31L);
    }

    @Test void correoDuplicadoNoEscribeNiEmiteToken() {
        when(usuarios.existsByEmail(EMAIL)).thenReturn(true);
        assertThatThrownBy(() -> auth.registrar(new RegistroRequest("Cliente", EMAIL, null, "qa-demo-123")))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.getCode()).isEqualTo("CORREO_EN_USO"));
        verify(usuarios, never()).save(any());
        verifyNoInteractions(clientes, encoder, jwt);
    }

    @Test void usuarioDesconocidoNoEmiteToken() {
        when(usuarios.findByEmail(EMAIL)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> auth.iniciarSesion(new LoginRequest(EMAIL, "qa-demo-123")))
                .isInstanceOf(BusinessException.class);
        verifyNoInteractions(encoder, jwt);
    }

    @Test void claveIncorrectaNoEmiteToken() {
        when(usuarios.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
        assertThatThrownBy(() -> auth.iniciarSesion(new LoginRequest(EMAIL, "incorrecta")))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.getCode()).isEqualTo("CREDENCIALES_INVALIDAS"));
        verifyNoInteractions(clientes, jwt);
    }

    @Test void clienteUsaSuIdDeNegocioEnLaSesion() {
        var cliente = mock(Cliente.class);
        when(cliente.getIdCliente()).thenReturn(31L);
        when(usuarios.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
        when(encoder.matches("qa-demo-123", "hash-de-prueba")).thenReturn(true);
        when(clientes.findByIdUsuario(7L)).thenReturn(Optional.of(cliente));
        assertThat(auth.iniciarSesion(new LoginRequest(EMAIL, "qa-demo-123")).usuario().id()).isEqualTo(31L);
        verify(jwt).generar(7L, "CLIENTE", 31L);
    }

    @Test void administradorUsaIdDeUsuarioSinBuscarCliente() {
        usuario.setRol("ADMIN");
        when(usuarios.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
        when(encoder.matches("qa-demo-123", "hash-de-prueba")).thenReturn(true);
        var respuesta = auth.iniciarSesion(new LoginRequest(EMAIL, "qa-demo-123")).usuario();
        assertThat(respuesta.id()).isEqualTo(7L);
        assertThat(respuesta.rol()).isEqualTo("ADMIN");
        verifyNoInteractions(clientes);
    }

    @Test void usuarioEliminadoInvalidaSesion() {
        assertThatThrownBy(() -> auth.obtener(7L, "CLIENTE", 31L))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.getCode()).isEqualTo("SESION_INVALIDA"));
    }

    @Test void perfilNormalizaCamposSinCambiarLaClave() {
        when(usuarios.findById(7L)).thenReturn(Optional.of(usuario));
        var perfil = auth.actualizarPerfil(7L, 31L, new ActualizarPerfilRequest(" Nombre ", " NUEVO@example.invalid ", " 55 "));
        assertThat(perfil.nombre()).isEqualTo("Nombre");
        assertThat(perfil.email()).isEqualTo("nuevo@example.invalid");
        assertThat(perfil.telefono()).isEqualTo("55");
        assertThat(usuario.getPassword()).isEqualTo("hash-de-prueba");
        verify(usuarios).save(usuario);
    }

    @Test void perfilNoAdmiteCorreoDeOtroUsuario() {
        when(usuarios.findById(7L)).thenReturn(Optional.of(usuario));
        when(usuarios.existsByEmail("otro@example.invalid")).thenReturn(true);
        assertThatThrownBy(() -> auth.actualizarPerfil(7L, 31L, new ActualizarPerfilRequest("Nombre", "otro@example.invalid", null)))
                .isInstanceOf(BusinessException.class);
        verify(usuarios, never()).save(any());
    }
}

package com.taqueriaalan.auth.service;

import com.taqueriaalan.auth.dto.ActualizarPerfilRequest;
import com.taqueriaalan.auth.dto.LoginRequest;
import com.taqueriaalan.auth.dto.RegistroRequest;
import com.taqueriaalan.auth.dto.UsuarioResponse;
import com.taqueriaalan.auth.exception.BusinessException;
import com.taqueriaalan.auth.model.Cliente;
import com.taqueriaalan.auth.model.Usuario;
import com.taqueriaalan.auth.repository.ClienteRepository;
import com.taqueriaalan.auth.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String ROL_CLIENTE = "CLIENTE";
    private static final String ROL_ADMIN = "ADMIN";

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** El registro publico siempre crea un CLIENTE; el rol nunca lo decide quien llama. */
    @Transactional
    public SesionIniciada registrar(RegistroRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new BusinessException("CORREO_EN_USO", "El correo ya está registrado", HttpStatus.CONFLICT);
        }

        Usuario usuario = new Usuario(
                request.nombre(),
                request.email(),
                request.telefono(),
                passwordEncoder.encode(request.password()),
                ROL_CLIENTE);
        usuario = usuarioRepository.save(usuario);

        Cliente cliente = clienteRepository.save(new Cliente(usuario.getId()));

        return emitirSesion(usuario, cliente.getIdCliente());
    }

    @Transactional(readOnly = true)
    public SesionIniciada iniciarSesion(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> credencialesInvalidas());

        if (!passwordEncoder.matches(request.password(), usuario.getPassword())) {
            throw credencialesInvalidas();
        }

        Long idCliente = ROL_CLIENTE.equals(usuario.getRol())
                ? clienteRepository.findByIdUsuario(usuario.getId()).map(Cliente::getIdCliente).orElse(null)
                : null;

        return emitirSesion(usuario, idCliente);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long idUsuario, String rol, Long idCliente) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new BusinessException("SESION_INVALIDA", "El usuario ya no existe", HttpStatus.UNAUTHORIZED));
        return aRespuesta(usuario, idCliente);
    }

    public long duracionTokenSegundos() {
        return jwtService.expirationSeconds();
    }

    /** El propio usuario autenticado edita su nombre, correo y telefono (nunca el rol ni la contraseña). */
    @Transactional
    public UsuarioResponse actualizarPerfil(Long idUsuario, Long idCliente, ActualizarPerfilRequest request) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new BusinessException("SESION_INVALIDA", "El usuario ya no existe", HttpStatus.UNAUTHORIZED));

        String nuevoCorreo = request.email().trim().toLowerCase();
        if (!nuevoCorreo.equals(usuario.getEmail())
                && usuarioRepository.existsByEmail(nuevoCorreo)) {
            throw new BusinessException("CORREO_EN_USO", "El correo ya está registrado", HttpStatus.CONFLICT);
        }

        usuario.setNombre(request.nombre().trim());
        usuario.setEmail(nuevoCorreo);
        usuario.setTelefono(request.telefono() == null ? null : request.telefono().trim());
        usuarioRepository.save(usuario);

        return aRespuesta(usuario, idCliente);
    }

    private SesionIniciada emitirSesion(Usuario usuario, Long idCliente) {
        String token = jwtService.generar(usuario.getId(), usuario.getRol(), idCliente);
        return new SesionIniciada(token, aRespuesta(usuario, idCliente));
    }

    private UsuarioResponse aRespuesta(Usuario usuario, Long idCliente) {
        Long id = ROL_ADMIN.equals(usuario.getRol()) ? usuario.getId() : idCliente;
        return new UsuarioResponse(id, usuario.getNombre(), usuario.getEmail(), usuario.getTelefono(), usuario.getRol());
    }

    private BusinessException credencialesInvalidas() {
        return new BusinessException("CREDENCIALES_INVALIDAS", "Correo o contraseña incorrectos", HttpStatus.UNAUTHORIZED);
    }

    public record SesionIniciada(String token, UsuarioResponse usuario) {
    }
}

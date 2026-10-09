package com.taqueriaalan.auth.service;

import com.taqueriaalan.auth.model.Usuario;
import com.taqueriaalan.auth.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
private final PasswordEncoder passwordEncoder; 

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
    this.usuarioRepository = usuarioRepository;
    this.passwordEncoder = passwordEncoder;
}
    public Usuario registrarUsuario(Usuario usuario) {

        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new RuntimeException("El correo ya está registrado");
        }
usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return usuarioRepository.save(usuario);
    }
    public Usuario iniciarSesion(String email, String password) {

    Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Correo o contraseña incorrectos"));

    if (!passwordEncoder.matches(password, usuario.getPassword())) {
        throw new RuntimeException("Correo o contraseña incorrectos");
    }

    return usuario;
}
}
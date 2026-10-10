package com.taqueriaalan.auth.controller;

import com.taqueriaalan.auth.dto.ActualizarPerfilRequest;
import com.taqueriaalan.auth.dto.LoginRequest;
import com.taqueriaalan.auth.dto.RegistroRequest;
import com.taqueriaalan.auth.dto.UsuarioResponse;
import com.taqueriaalan.auth.exception.BusinessException;
import com.taqueriaalan.auth.service.AuthService;
import com.taqueriaalan.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * El JWT de sesion viaja en una cookie httpOnly (nunca en el body ni en localStorage): el
 * JavaScript del front no puede leerla, asi que un XSS no puede robar la sesion.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String COOKIE_NAME = "taqueria_session";

    private final AuthService authService;
    private final JwtService jwtService;

    @Value("${app.security.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${app.security.cookie-same-site:Lax}")
    private String cookieSameSite;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponse> registrar(@Valid @RequestBody RegistroRequest request) {
        AuthService.SesionIniciada sesion = authService.registrar(request);
        return conCookieDeSesion(sesion);
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.SesionIniciada sesion = authService.iniciarSesion(request);
        return conCookieDeSesion(sesion);
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me(HttpServletRequest request) {
        Claims claims = claimsDeLaSesion(request);
        Long idUsuario = Long.valueOf(claims.getSubject());
        String rol = claims.get("rol", String.class);
        Long idCliente = claims.get("idCliente", Long.class);
        return ResponseEntity.ok(authService.obtener(idUsuario, rol, idCliente));
    }

    @PutMapping("/me")
    public ResponseEntity<UsuarioResponse> actualizarPerfil(
            @Valid @RequestBody ActualizarPerfilRequest request, HttpServletRequest httpRequest) {
        Claims claims = claimsDeLaSesion(httpRequest);
        Long idUsuario = Long.valueOf(claims.getSubject());
        Long idCliente = claims.get("idCliente", Long.class);
        return ResponseEntity.ok(authService.actualizarPerfil(idUsuario, idCliente, request));
    }

    private Claims claimsDeLaSesion(HttpServletRequest request) {
        String token = leerCookie(request)
                .orElseThrow(() -> new BusinessException("SIN_SESION", "No hay una sesión activa", HttpStatus.UNAUTHORIZED));
        try {
            return jwtService.validar(token);
        } catch (JwtException | IllegalArgumentException exception) {
            throw new BusinessException("SESION_INVALIDA", "La sesión no es válida o expiró", HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie borrada = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(0)
                .build();
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, borrada.toString()).build();
    }

    private ResponseEntity<UsuarioResponse> conCookieDeSesion(AuthService.SesionIniciada sesion) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, sesion.token())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(authService.duracionTokenSegundos())
                .build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(sesion.usuario());
    }

    private Optional<String> leerCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName())) {
                return Optional.of(cookie.getValue());
            }
        }
        return Optional.empty();
    }
}

package com.taqueriaalan.catalogo.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * El catalogo de lectura (GET) es publico a proposito: la landing lo muestra sin que el
 * visitante haya iniciado sesion. Solo la escritura (POST/PUT/PATCH/DELETE) exige una
 * cookie de sesion valida con rol ADMIN. Desactivado por completo si
 * app.security.enabled=false (perfil local por defecto).
 */
@Component
public class JwtCookieFilter extends OncePerRequestFilter {

    private static final String COOKIE_NAME = "taqueria_session";
    private static final String ROL_ADMIN = "ADMIN";

    private final ObjectMapper objectMapper;

    @Value("${app.security.enabled:false}")
    private boolean enabled;

    @Value("${app.security.jwt-secret:}")
    private String jwtSecret;

    public JwtCookieFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        boolean esLectura = "GET".equalsIgnoreCase(request.getMethod());
        return !enabled || "OPTIONS".equalsIgnoreCase(request.getMethod())
                || !request.getRequestURI().startsWith("/api/") || esLectura;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Optional<String> token = leerCookie(request);
        if (token.isEmpty()) {
            unauthorized(response, "No hay una sesión activa");
            return;
        }

        Claims claims;
        try {
            SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
            claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token.get()).getPayload();
        } catch (JwtException | IllegalArgumentException exception) {
            unauthorized(response, "La sesión no es válida o expiró");
            return;
        }

        String rol = claims.get("rol", String.class);
        request.setAttribute("idUsuario", Long.valueOf(claims.getSubject()));
        request.setAttribute("rol", rol);

        if (!ROL_ADMIN.equals(rol)) {
            forbidden(response, "Solo un administrador puede modificar el catálogo");
            return;
        }

        chain.doFilter(request, response);
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

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        escribirError(response, HttpServletResponse.SC_UNAUTHORIZED, "SESION_INVALIDA", message);
    }

    private void forbidden(HttpServletResponse response, String message) throws IOException {
        escribirError(response, HttpServletResponse.SC_FORBIDDEN, "ACCESO_DENEGADO", message);
    }

    private void escribirError(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status,
                "code", code,
                "message", message));
    }
}

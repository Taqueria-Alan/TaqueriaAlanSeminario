package com.taqueriaalan.pedidos.config;

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
 * Valida la cookie de sesion que emite auth-service y deja idUsuario/rol/idCliente como
 * atributos del request; el control de pertenencia (un CLIENTE solo ve sus propios
 * pedidos) se hace en el controller/servicio, que si conoce el dominio de PEDIDO.
 * Desactivado por completo si app.security.enabled=false (perfil local por defecto).
 */
@Component
public class JwtCookieFilter extends OncePerRequestFilter {

    private static final String COOKIE_NAME = "taqueria_session";

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
        return !enabled || "OPTIONS".equalsIgnoreCase(request.getMethod()) || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Optional<String> token = leerCookie(request);
        if (token.isEmpty()) {
            unauthorized(response, "No hay una sesión activa");
            return;
        }

        try {
            SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token.get()).getPayload();
            request.setAttribute("idUsuario", Long.valueOf(claims.getSubject()));
            request.setAttribute("rol", claims.get("rol", String.class));
            request.setAttribute("idCliente", claims.get("idCliente", Long.class));
        } catch (JwtException | IllegalArgumentException exception) {
            unauthorized(response, "La sesión no es válida o expiró");
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
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", HttpServletResponse.SC_UNAUTHORIZED,
                "code", "SESION_INVALIDA",
                "message", message));
    }
}

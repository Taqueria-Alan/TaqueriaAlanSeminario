package com.taqueriaalan.pedidos.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Adaptador de seguridad listo para cuando auth-service emita JWT firmados.
 * En el perfil local queda explícitamente desactivado, sin fingir una validación.
 */
@Component
public class JwtBearerFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    @Value("${app.security.enabled:false}")
    private boolean enabled;

    @Value("${app.security.jwt-secret:}")
    private String jwtSecret;

    public JwtBearerFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !enabled || "OPTIONS".equalsIgnoreCase(request.getMethod()) || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            unauthorized(response, "Falta un token Bearer válido");
            return;
        }
        try {
            if (jwtSecret == null || jwtSecret.isBlank()) {
                unauthorized(response, "La validación JWT no está configurada");
                return;
            }
            SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(authorization.substring(7)).getPayload();
            request.setAttribute("jwtClaims", claims);
            chain.doFilter(request, response);
        } catch (RuntimeException exception) {
            unauthorized(response, "El token JWT no es válido o expiró");
        }
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", HttpServletResponse.SC_UNAUTHORIZED,
                "code", "JWT_INVALIDO",
                "message", message));
    }
}

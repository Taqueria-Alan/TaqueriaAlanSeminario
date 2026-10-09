package com.taqueriaalan.clubalan.config;

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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Valida la cookie de sesion que emite auth-service y autoriza por regla de
 * ruta: ADMIN, el propio cliente (idCliente del path == idCliente del token),
 * o la llamada interna de pagos-service (X-Internal-Secret), segun el caso.
 * Desactivado por completo si app.security.enabled=false (perfil local por defecto).
 */
@Component
public class JwtCookieFilter extends OncePerRequestFilter {

    private static final String COOKIE_NAME = "taqueria_session";
    private static final String ROL_ADMIN = "ADMIN";
    private static final String ROL_CLIENTE = "CLIENTE";

    private enum Acceso { ADMIN, ADMIN_O_PROPIO }

    private record Regla(String metodo, String patron, Acceso acceso) {
    }

    /**
     * Desde el navegador estas rutas son ADMIN (o el propio cliente). pagos-service las
     * llama tambien internamente (sin cookie de usuario) para acumular puntos y activar
     * membresias; esa llamada se autentica con X-Internal-Secret y se deja pasar antes
     * de evaluar esta tabla (ver doFilterInternal).
     */
    private static final List<Regla> REGLAS = List.of(
            new Regla("GET", "/api/club-alan/clientes", Acceso.ADMIN),
            new Regla("GET", "/api/club-alan/clientes/buscar", Acceso.ADMIN),
            new Regla("GET", "/api/club-alan/clientes/miembros", Acceso.ADMIN),
            new Regla("GET", "/api/club-alan/clientes/{idCliente}/puntos", Acceso.ADMIN_O_PROPIO),
            new Regla("GET", "/api/club-alan/clientes/{idCliente}/movimientos", Acceso.ADMIN_O_PROPIO),
            new Regla("POST", "/api/club-alan/clientes/{idCliente}/movimientos", Acceso.ADMIN),
            new Regla("GET", "/api/club-alan/clientes/{idCliente}/membresia", Acceso.ADMIN_O_PROPIO),
            new Regla("POST", "/api/club-alan/clientes/{idCliente}/membresia", Acceso.ADMIN),
            new Regla("DELETE", "/api/club-alan/clientes/{idCliente}/membresia", Acceso.ADMIN));

    private final AntPathMatcher pathMatcher = new AntPathMatcher();
    private final ObjectMapper objectMapper;

    @Value("${app.security.enabled:false}")
    private boolean enabled;

    @Value("${app.security.jwt-secret:}")
    private String jwtSecret;

    @Value("${app.security.internal-secret:}")
    private String internalSecret;

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
        if (esLlamadaInterna(request)) {
            chain.doFilter(request, response);
            return;
        }

        Regla regla = reglaDe(request);
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
        Long idClienteToken = claims.get("idCliente", Long.class);
        request.setAttribute("idUsuario", Long.valueOf(claims.getSubject()));
        request.setAttribute("rol", rol);
        request.setAttribute("idCliente", idClienteToken);

        if (regla != null && !autorizado(regla.acceso(), rol, idClienteToken, request, regla.patron())) {
            forbidden(response, "No tienes permiso para acceder a este recurso");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean autorizado(Acceso acceso, String rol, Long idClienteToken, HttpServletRequest request, String patron) {
        if (ROL_ADMIN.equals(rol)) {
            return true;
        }
        if (acceso == Acceso.ADMIN) {
            return false;
        }
        if (acceso == Acceso.ADMIN_O_PROPIO && ROL_CLIENTE.equals(rol)) {
            Map<String, String> variables = pathMatcher.extractUriTemplateVariables(patron, request.getRequestURI());
            String idClientePath = variables.get("idCliente");
            return idClientePath != null && idClienteToken != null
                    && idClientePath.equals(String.valueOf(idClienteToken));
        }
        return false;
    }

    private Regla reglaDe(HttpServletRequest request) {
        for (Regla regla : REGLAS) {
            if (regla.metodo().equalsIgnoreCase(request.getMethod())
                    && pathMatcher.match(regla.patron(), request.getRequestURI())) {
                return regla;
            }
        }
        return null;
    }

    private boolean esLlamadaInterna(HttpServletRequest request) {
        String recibido = request.getHeader("X-Internal-Secret");
        return internalSecret != null && !internalSecret.isBlank() && internalSecret.equals(recibido);
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

package com.taqueriaalan.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Firma el JWT de sesion. El secreto y la duracion son los mismos que validan los demas servicios. */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationHours;

    public JwtService(
            @Value("${app.security.jwt-secret}") String jwtSecret,
            @Value("${app.security.jwt-expiration-hours:24}") long expirationHours) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        this.expirationHours = expirationHours;
    }

    public String generar(Long idUsuario, String rol, Long idCliente) {
        Instant ahora = Instant.now();
        var builder = Jwts.builder()
                .subject(String.valueOf(idUsuario))
                .claim("rol", rol)
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(Duration.ofHours(expirationHours))));
        if (idCliente != null) {
            builder.claim("idCliente", idCliente);
        }
        return builder.signWith(key).compact();
    }

    public long expirationSeconds() {
        return Duration.ofHours(expirationHours).toSeconds();
    }

    /** Lanza JwtException (firma invalida) o ExpiredJwtException si el token ya vencio. */
    public Claims validar(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}

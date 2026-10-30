package com.taqueriaalan.gateway;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class SpaController {
    @GetMapping(value = {"/", "/login", "/registro", "/cliente", "/cliente/**", "/admin", "/admin/**"}, produces = "text/html")
    @ResponseBody
    public ResponseEntity<Resource> index() {
        Resource index = new ClassPathResource("static/index.html");
        return index.exists() ? ResponseEntity.ok(index) : ResponseEntity.notFound().build();
    }
}

package com.navmate.qr;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnchorService {

    private final QrAnchorRepository qrAnchorRepository;

    public QrAnchor resolve(String token) {
        return qrAnchorRepository.findByTokenAndActiveTrue(token)
                .orElseThrow(() -> new EntityNotFoundException("QR anchor not found for token"));
    }
}

;; Math util updated 2026-05-27T20:27:00Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u40)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)

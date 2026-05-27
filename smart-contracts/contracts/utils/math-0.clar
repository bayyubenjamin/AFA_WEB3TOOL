;; Math util updated 2026-05-27T20:55:38Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u42)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)

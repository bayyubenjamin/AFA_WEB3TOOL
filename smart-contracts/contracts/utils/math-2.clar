;; Math util updated 2026-05-30T06:37:33Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u8)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)

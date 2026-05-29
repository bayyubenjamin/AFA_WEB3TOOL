;; Math util updated 2026-05-29T07:43:46Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u10)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
